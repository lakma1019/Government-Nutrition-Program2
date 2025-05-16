const { z } = require('zod');

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' })
});

// User schema for registration and updates
const userSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  password: z.string().min(6, { message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'}),
  role: z.enum(['admin', 'deo', 'vo'], {
    message: 'Role must be one of: admin, deo, vo'
  }),
  is_active: z.enum(['yes', 'no']).optional().default('yes'),
  nic_number: z.string().optional(),
  tel_number: z.string().optional(),
  address: z.string().optional(),
  profession: z.string().optional()
});

// Map database roles to frontend roles
const mapDbRoleToFrontend = (dbRole) => {
  switch (dbRole) {
    case 'admin':
      return 'admin';
    case 'deo':
      return 'dataEntryOfficer';
    case 'vo':
      return 'verificationOfficer';
    default:
      return 'verificationOfficer';
  }
};

// Map frontend roles to database roles
const mapFrontendRoleToDb = (frontendRole) => {
  switch (frontendRole) {
    case 'admin':
      return 'admin';
    case 'dataEntryOfficer':
      return 'deo';
    case 'verificationOfficer':
      return 'vo';
    default:
      return 'vo';
  }
};

module.exports = {
  loginSchema,
  userSchema,
  mapDbRoleToFrontend,
  mapFrontendRoleToDb
};
