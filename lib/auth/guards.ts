import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export type AdminActor = { id: string; email: string; name: string };

export class NotAuthorizedError extends Error {
  constructor() {
    super('Admin privileges are required for this action.');
    this.name = 'NotAuthorizedError';
  }
}

type SessionLike = { user?: { role?: string } } | null | undefined;

/**
 * Pure, so the rule itself is testable without a request context. Exact match
 * only — never a substring test, and never a default of 'admin'.
 */
export function isAdminSession(session: SessionLike): boolean {
  return session?.user?.role === 'admin';
}

async function currentActor(): Promise<AdminActor | null> {
  const session = await auth();
  if (!isAdminSession(session)) return null;

  return {
    id: session?.user?.id ?? '',
    email: session?.user?.email ?? '',
    name: session?.user?.name ?? '',
  };
}

/** For Server Components. Sends non-admins away instead of rendering. */
export async function requireAdminPage(): Promise<AdminActor> {
  const actor = await currentActor();
  if (!actor) redirect('/login');
  return actor;
}

/**
 * For Server Actions. The proxy can be bypassed — a Server Function is a POST
 * to whatever route imported it — so this is the check that actually enforces.
 */
export async function requireAdminActor(): Promise<AdminActor> {
  const actor = await currentActor();
  if (!actor) throw new NotAuthorizedError();
  return actor;
}
