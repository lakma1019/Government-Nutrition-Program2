import { z } from 'zod';

// Username validation schema
export const usernameSchema = z
  .string()
  .min(3, { message: 'Username must be at least 3 characters' })
  .max(50, { message: 'Username cannot exceed 50 characters' })
  .regex(/^[a-zA-Z0-9_]+$/, { 
    message: 'Username can only contain letters, numbers, and underscores' 
  });

// Password validation schema
export const passwordSchema = z
  .string()
  .min(6, { message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' })
  .max(100, { message: 'Password cannot exceed 100 characters' })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  });

// Role validation schema
export const roleSchema = z.enum(['admin', 'deo', 'vo'], {
  errorMap: () => ({ message: 'Role must be one of: admin, deo, vo' })
});

// Status validation schema
export const statusSchema = z.enum(['yes', 'no'], {
  errorMap: () => ({ message: 'Status must be either active or inactive' })
});

// Add User form schema
export const addUserSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: roleSchema,
  isActive: statusSchema
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Edit User form schema (password is optional for updates)
export const editUserSchema = z.object({
  username: usernameSchema,
  password: z.union([
    z.string().length(0),
    passwordSchema
  ]),
  confirmPassword: z.string(),
  role: roleSchema,
  isActive: statusSchema
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
}).refine(data => !data.password || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Types for form data
export type AddUserFormData = z.infer<typeof addUserSchema>;
export type EditUserFormData = z.infer<typeof editUserSchema>;
