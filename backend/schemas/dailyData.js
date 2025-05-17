const { z } = require('zod');

// Daily Data schema for validation
const dailyDataSchema = z.object({
  date: z.string().min(1, { message: 'Date is required' }),
  female: z.number().int().nonnegative({ message: 'Female count must be a non-negative integer' }),
  male: z.number().int().nonnegative({ message: 'Male count must be a non-negative integer' }),
  total: z.number().int().nonnegative({ message: 'Total must be a non-negative integer' }),
  unit_price: z.number().nonnegative({ message: 'Unit price must be a non-negative number' }),
  amount: z.number().nonnegative({ message: 'Amount must be a non-negative number' }),
  method_of_rice_received: z.enum(['donated', 'purchased'], {
    message: 'Method of rice received must be either donated or purchased'
  }),
  meal_recipe: z.string().min(1, { message: 'Meal recipe is required' }),
  number_of_eggs: z.number().int().nonnegative({ message: 'Number of eggs must be a non-negative integer' }),
  fruits: z.string().nullable().optional()
});

module.exports = {
  dailyDataSchema
};
