const { z } = require('zod');

// Supporter schema for validation
const supporterSchema = z.object({
  supporter_nic_number: z.string().min(1, { message: 'Supporter NIC number is required' }),
  supporter_name: z.string().min(1, { message: 'Supporter name is required' }),
  supporter_contact_number: z.string().min(1, { message: 'Supporter contact number is required' }),
  supporter_address: z.string().optional().nullable(),
  is_active: z.enum(['yes', 'no']).optional().default('yes')
});

// Contractor schema for validation
const contractorSchema = z.object({
  contractor_nic_number: z.string().min(1, { message: 'Contractor NIC number is required' }),
  full_name: z.string().min(1, { message: 'Full name is required' }),
  contact_number: z.string().min(1, { message: 'Contact number is required' }),
  address: z.string().min(1, { message: 'Address is required' }),
  agreement_number: z.string().optional().nullable(),
  agreement_start_date: z.string().optional().nullable(),
  agreement_end_date: z.string().optional().nullable(),
  is_active: z.enum(['yes', 'no']).optional().default('yes'),
  has_supporter: z.enum(['yes', 'no']).optional().default('no')
});

// Combined schema for contractor with optional supporter
const contractorWithSupporterSchema = contractorSchema.extend({
  supporter_nic_number: z.string().optional().nullable(),
  supporter_name: z.string().optional().nullable(),
  supporter_contact_number: z.string().optional().nullable(),
  supporter_address: z.string().optional().nullable()
});

module.exports = {
  supporterSchema,
  contractorSchema,
  contractorWithSupporterSchema
};
