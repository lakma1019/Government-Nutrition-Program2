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

// Gazette schema for validation
const gazetteSchema = z.object({
  gazette_name: z.string().min(1, { message: 'Gazette name is required' }),
  publish_date: z.string().optional().nullable(),
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
  uploader_name: z.string().optional().nullable(),
  is_active: z.enum(['yes', 'no']).optional().default('yes')
});

module.exports = {
  gazetteSchema,
  urlDataSchema
};
