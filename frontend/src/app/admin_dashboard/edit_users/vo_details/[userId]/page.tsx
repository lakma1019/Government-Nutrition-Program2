'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import VODetailsForm from '@/components/admin_dashboard/VODetailsForm';
import Link from 'next/link';

export default function EditVODetailsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  // Check if user is authenticated and is an admin on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Log params for debugging
        console.log('URL params:', params);
        console.log('User ID from URL:', userId);
        
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          router.push('/login'); // Redirect to login if no user data found
          return;
        }

        const userData = JSON.parse(storedUser);
        
        // Check if token exists in localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          // Try to get token from user data
          if (userData.token) {
            // Store token separately for easier access
            localStorage.setItem('token', userData.token);
            console.log('Token retrieved from user data and stored');
          } else {
            console.error('No token in user data either');
            alert('Authentication token missing. Please log in again.');
            router.push('/login');
            return;
          }
        } else {
          console.log('Authentication token found in localStorage');
        }

        // No need to check for admin role anymore - any authenticated user can access this page
        // Just log the user role for debugging
        console.log('User role:', userData.role);

        // Check if userId is provided
        if (!userId) {
          setError('User ID is missing. Please go back and try again.');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login'); // Redirect to login on auth error
      } finally {
        setLoading(false); // Stop loading once auth check is complete
      }
    };

    checkAuth();
  }, [router, userId, params]); // Depend on router, userId, and params

  // Handle success
  const handleSuccess = () => {
    // Redirect to the users list or dashboard
    router.push('/admin_dashboard/edit_users');
  };

  // Handle cancel
  const handleCancel = () => {
    // Go back to the users list
    router.push('/admin_dashboard/edit_users');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-2xl text-indigo-600">Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-32">
        <div className="p-4 mb-6 rounded-md bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
        <Link href="/admin_dashboard/edit_users" className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-4">
          ← Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {userId ? (
        isNaN(parseInt(userId)) ? (
          <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="p-4 mb-6 rounded-md bg-red-50 text-red-800 border border-red-200">
              Invalid User ID format. Please go back and try again.
            </div>
            <Link href="/admin_dashboard/edit_users" className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-4">
              ← Back to Users
            </Link>
          </div>
        ) : (
          <VODetailsForm 
            userId={parseInt(userId)} 
            onSuccess={handleSuccess} 
            onCancel={handleCancel}
            mode="edit"
          />
        )
      ) : (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
          <div className="p-4 mb-6 rounded-md bg-red-50 text-red-800 border border-red-200">
            User ID is missing. Please go back and try again.
          </div>
          <Link href="/admin_dashboard/edit_users" className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-4">
            ← Back to Users
          </Link>
        </div>
      )}
    </div>
  );
}
