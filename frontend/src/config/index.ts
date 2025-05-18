/**
 * Application configuration
 * 
 * This file contains configuration settings for the application.
 * It centralizes environment-specific values to make them easier to manage.
 */

// Backend API URL - uses the PORT from backend/.env (currently 3001)
export const API_BASE_URL = 'http://localhost:3001';

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    ME: `${API_BASE_URL}/api/auth/me`,
    CSRF_TOKEN: `${API_BASE_URL}/api/csrf-token`,
  },
  
  // User endpoints
  USERS: {
    BASE: `${API_BASE_URL}/api/users`,
    DETAILS: `${API_BASE_URL}/api/user-details`,
    ACTIVE_DEO: `${API_BASE_URL}/api/user-details/active/deo`,
    ACTIVE_VO: `${API_BASE_URL}/api/user-details/active/vo`,
  },
  
  // Contractor endpoints
  CONTRACTORS: {
    BASE: `${API_BASE_URL}/api/contractors`,
    ACTIVE: `${API_BASE_URL}/api/contractors/active`,
  },
  
  // Daily data endpoints
  DAILY_DATA: {
    BASE: `${API_BASE_URL}/api/daily-data`,
  },
  
  // Supporters endpoints
  SUPPORTERS: {
    BASE: `${API_BASE_URL}/api/supporters`,
  },
};
