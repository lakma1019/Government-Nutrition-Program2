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

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  role: z.enum(['admin', 'dataEntryOfficer', 'verificationOfficer']),
  full_name: z.string().optional(),
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
