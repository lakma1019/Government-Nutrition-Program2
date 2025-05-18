/**
 * Utility functions for CSRF token management
 */

import { API_ENDPOINTS } from '@/config';

// Store the CSRF token in memory
let csrfToken: string = '';

/**
 * Fetch a new CSRF token from the server
 * @returns Promise resolving to the CSRF token
 */
export async function fetchCSRFToken(): Promise<string> {
  try {
    console.log('Fetching CSRF token...');
    const response = await fetch(API_ENDPOINTS.AUTH.CSRF_TOKEN, {
      method: 'GET',
      credentials: 'include', // Important for cookies
    });

    if (!response.ok) {
      console.error('Failed to fetch CSRF token, status:', response.status);
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const data = await response.json();
    console.log('CSRF token received:', data.csrfToken ? 'Token received' : 'No token in response');
    csrfToken = data.csrfToken || '';
    return csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    // Return empty string but don't store it
    return '';
  }
}

/**
 * Get the current CSRF token, fetching a new one if needed
 * @returns Promise resolving to the CSRF token
 */
export async function getCSRFToken(): Promise<string> {
  if (!csrfToken) {
    return fetchCSRFToken();
  }
  return csrfToken;
}

/**
 * Add CSRF token and auth token to fetch options
 * @param options - Fetch options
 * @returns Updated fetch options with CSRF token and auth token
 */
export function addCSRFToken(options: RequestInit = {}): RequestInit {
  // Get auth token from localStorage
  let authToken = '';
  try {
    const userData = localStorage.getItem('user');
    const tokenData = localStorage.getItem('token');

    if (tokenData) {
      // If token is stored directly
      authToken = tokenData;
    } else if (userData) {
      // Try to get token from user data if it's stored there
      const parsedUserData = JSON.parse(userData);
      if (parsedUserData.token) {
        authToken = parsedUserData.token;
      }
    }
  } catch (error) {
    console.error('Error getting auth token from localStorage:', error);
  }

  const headers = {
    ...options.headers,
    'X-CSRF-Token': csrfToken,
  };

  // Add Authorization header if we have a token
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
    // Also add as x-auth-token for compatibility
    headers['x-auth-token'] = authToken;
  }

  return {
    ...options,
    headers,
    credentials: 'include', // Important for cookies
  };
}

/**
 * Fetch with CSRF token
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Promise resolving to fetch response
 */
export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  // Ensure we have a CSRF token
  if (!csrfToken) {
    try {
      const token = await fetchCSRFToken();
      if (!token) {
        console.warn('Failed to get CSRF token, proceeding without it');
      }
    } catch (error) {
      console.error('Error fetching CSRF token, proceeding without it:', error);
    }
  }

  // Add CSRF token to request (even if it's empty, the request will still go through)
  const csrfOptions = addCSRFToken(options);

  // Make the request
  return fetch(url, csrfOptions);
}
