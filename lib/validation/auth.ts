import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  email,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().trim().default(''),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

/** Asking for a link needs nothing but an address — deliberately, so the form
 *  cannot be used to probe for anything else. */
export const forgotPasswordSchema = z.object({ email });

/** The same minimum the register form enforces: a reset must not be a way to
 *  end up with a weaker password than registration would have allowed. */
export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'That reset link is not valid.'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string().min(1, 'Please type the password twice'),
  })
  .refine((value) => value.password === value.confirm, {
    message: 'Those passwords do not match',
    path: ['confirm'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
