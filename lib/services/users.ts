import { Types } from 'mongoose';
import { hash, verify } from '@node-rs/argon2';
import { connectToDatabase } from '@/lib/db/connection';
import { User } from '@/lib/db/models/user';
import type { RegisterInput } from '@/lib/validation/auth';

export type UserDTO = {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
};

export class EmailTakenError extends Error {
  constructor(email: string) {
    super(`An account already exists for ${email}`);
    this.name = 'EmailTakenError';
  }
}

/**
 * A real argon2 hash of a throwaway value. When no user matches, we verify
 * against this so a missing account costs the same time as a wrong password
 * and cannot be detected by timing.
 *
 * Computed lazily and cached rather than with a top-level await: `tsx`
 * transforms scripts to CJS, which rejects top-level await outright.
 */
let dummyHashPromise: Promise<string> | null = null;

function getDummyHash(): Promise<string> {
  dummyHashPromise ??= hash('shrinkless-dummy-password');
  return dummyHashPromise;
}

type UserShape = {
  _id: Types.ObjectId;
  email: string;
  name: string;
  role: string;
};

function toUserDTO(user: UserShape): UserDTO {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role === 'admin' ? 'admin' : 'customer',
  };
}

export async function createUser(input: RegisterInput): Promise<UserDTO> {
  await connectToDatabase();

  const existing = await User.findOne({ email: input.email }).lean();
  if (existing) throw new EmailTakenError(input.email);

  try {
    const created = await User.create({
      email: input.email,
      passwordHash: await hash(input.password),
      name: input.name,
      role: 'customer', // never taken from input
    });

    return toUserDTO(created as unknown as UserShape);
  } catch (error) {
    // The unique index is the real guard; the check above is only a nicety.
    if (error instanceof Error && error.message.includes('duplicate key')) {
      throw new EmailTakenError(input.email);
    }
    throw error;
  }
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<UserDTO | null> {
  await connectToDatabase();

  const normalised = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalised }).lean();

  if (!user) {
    await verify(await getDummyHash(), password).catch(() => false);
    return null;
  }

  const valid = await verify(user.passwordHash, password).catch(() => false);
  if (!valid) return null;

  return toUserDTO(user as unknown as UserShape);
}

export async function getUserById(id: string): Promise<UserDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;

  await connectToDatabase();
  const user = await User.findById(id).lean();

  return user ? toUserDTO(user as unknown as UserShape) : null;
}
