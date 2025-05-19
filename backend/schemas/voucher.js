const { z } = require('zod');

// URL data schema for validation
const urlDataSchema = z.object({
  downloadURL: z.string().min(1, { message: 'Download URL is required' }),
  fileName: z.string().optional(),
  filePath: z.string().optional(),
  contentType: z.string().optional(),
  size: z.number().optional(),
  uploadTime: z.string().optional()
});

// Voucher schema for validation
const voucherSchema = z.object({
  url_data: z.union([
    urlDataSchema,
    z.string().min(1).transform(str => {
      try {
        return JSON.parse(str);
      } catch (e) {
        return { downloadURL: str };
      }
    })
  ]),
  deo_id: z.number().optional(),
  vo_id: z.number().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional().default('pending'),
  comment: z.string().optional().nullable()
});

module.exports = {
  voucherSchema,
  urlDataSchema
};
