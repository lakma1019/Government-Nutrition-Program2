const { z } = require('zod');

// Supporter schema for validation
const supporterSchema = z.object({
  supporter_nic_number: z.string().min(1, { message: 'Supporter NIC number is required' }),
  supporter_name: z.string().min(1, { message: 'Supporter name is required' }),
  supporter_contact_number: z.string().min(1, { message: 'Supporter contact number is required' }),
  supporter_address: z.string().optional().nullable(),
  contractor_id: z.number().optional().nullable(),
  contractor_nic_number: z.string().optional().nullable(),
  is_active: z.enum(['yes', 'no']).optional().default('yes')
});

// Combined schema for supporter with contractor details
const supporterWithContractorSchema = supporterSchema.extend({
  contractor_name: z.string().optional().nullable()
});

module.exports = {
  supporterSchema,
  supporterWithContractorSchema
};
