import { z } from 'zod';

// NIC number validation schema
export const nicNumberSchema = z
  .string()
  .min(1, { message: 'NIC number is required' })
  .max(50, { message: 'NIC number cannot exceed 50 characters' });

// Telephone number validation schema
export const telNumberSchema = z
  .string()
  .min(1, { message: 'Telephone number is required' })
  .max(20, { message: 'Telephone number cannot exceed 20 characters' })
  .regex(/^[0-9+\-\s()]*$/, { 
    message: 'Telephone number can only contain numbers, +, -, spaces, and parentheses' 
  });

// Full name validation schema
export const fullNameSchema = z
  .string()
  .min(1, { message: 'Full name is required' })
  .max(100, { message: 'Full name cannot exceed 100 characters' });

// Address validation schema
export const addressSchema = z
  .string()
  .min(1, { message: 'Address is required' })
  .max(255, { message: 'Address cannot exceed 255 characters' });

// Status validation schema (reusing from userForms.ts)
export const statusSchema = z.enum(['yes', 'no'], {
  errorMap: () => ({ message: 'Status must be either active or inactive' })
});

// DEO Details form schema
export const deoDetailsSchema = z.object({
  userId: z.number().int().positive(),
  fullName: fullNameSchema,
  nicNumber: nicNumberSchema,
  telNumber: telNumberSchema.optional(),
  address: addressSchema.optional(),
  isActive: statusSchema.default('yes')
});

// VO Details form schema
export const voDetailsSchema = z.object({
  userId: z.number().int().positive(),
  fullName: fullNameSchema,
  nicNumber: nicNumberSchema,
  telNumber: telNumberSchema.optional(),
  address: addressSchema.optional(),
  isActive: statusSchema.default('yes')
});

// Types for form data
export type DEODetailsFormData = z.infer<typeof deoDetailsSchema>;
export type VODetailsFormData = z.infer<typeof voDetailsSchema>;