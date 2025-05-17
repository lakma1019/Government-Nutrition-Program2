import { z } from 'zod';

// Login form schema
export const loginFormSchema = z.object({
  username: z
    .string()
    .min(1, { message: 'Username is required' })
    .max(50, { message: 'Username cannot exceed 50 characters' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .max(100, { message: 'Password cannot exceed 100 characters' }),
  rememberMe: z.boolean().optional().default(false),
});

// Type for login form data
export type LoginFormData = z.infer<typeof loginFormSchema>;

// Password reset form schema
export const passwordResetSchema = z.object({
  username: z
    .string()
    .min(1, { message: 'Username is required' })
    .max(50, { message: 'Username cannot exceed 50 characters' }),
  oldPassword: z
    .string()
    .min(1, { message: 'Current password is required' })
    .max(100, { message: 'Current password cannot exceed 100 characters' }),
  newPassword: z
    .string()
    .min(6, { message: 'New password must be at least 6 characters' })
    .max(100, { message: 'New password cannot exceed 100 characters' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Confirm password is required' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type for password reset form data
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  role: z.enum(['admin', 'dataEntryOfficer', 'verificationOfficer']),
  is_active: z.enum(['yes', 'no']).optional(),
});

// Type for user data
export type User = z.infer<typeof userSchema>;

// Login response schema
export const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  token: z.string().optional(),
  user: userSchema.optional(),
});

// Type for login response
export type LoginResponse = z.infer<typeof loginResponseSchema>;

// Password reset response schema
export const passwordResetResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Type for password reset response
export type PasswordResetResponse = z.infer<typeof passwordResetResponseSchema>;
