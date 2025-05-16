/**
 * Utility functions for CSRF token management
 */

// Store the CSRF token in memory
let csrfToken: string = '';

/**
 * Fetch a new CSRF token from the server
 * @returns Promise resolving to the CSRF token
 */
export async function fetchCSRFToken(): Promise<string> {
  try {
    console.log('Fetching CSRF token...');
    const response = await fetch('http://localhost:3001/api/csrf-token', {
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
 * Add CSRF token to fetch options
 * @param options - Fetch options
 * @returns Updated fetch options with CSRF token
 */
export function addCSRFToken(options: RequestInit = {}): RequestInit {
  const headers = {
    ...options.headers,
    'X-CSRF-Token': csrfToken,
  };

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
