import { useState, useEffect } from 'react';
import { fetchCSRFToken, fetchWithCSRF } from '@/utils/csrf';

/**
 * Custom hook for making fetch requests with CSRF protection
 * @returns Object with fetchWithCSRF function and loading state
 */
export function useFetchWithCSRF() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch CSRF token on component mount
  useEffect(() => {
    let isMounted = true;

    const getToken = async () => {
      try {
        const token = await fetchCSRFToken();

        if (isMounted) {
          if (token) {
            console.log('CSRF token loaded successfully');
          } else {
            console.warn('Empty CSRF token received');
            setError('Could not load security token');
          }
          // Set loading to false even if token is empty to prevent blocking
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
        if (isMounted) {
          setError('Failed to load security token');
          // Set loading to false to prevent blocking
          setLoading(false);
        }
      }
    };

    // Start token fetch
    getToken();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    fetchWithCSRF,
    loading,
    error
  };
}
