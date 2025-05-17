'use client';

import EditUsersComponent from '@/components/admin_dashboard/EditUsers';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditUsersPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          router.push('/login'); // Redirect to login if no user data found
          return;
        }

        // User is authenticated, no need to check for admin role anymore
        const userData = JSON.parse(storedUser);
        console.log('User authenticated:', userData.username);
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login'); // Redirect to login on auth error
      } finally {
        setLoading(false); // Stop loading once auth check is complete
      }
    };

    checkAuth();
  }, [router]); // Depend on router

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-2xl text-green-600">Loading...</div>;
  }

  return <EditUsersComponent />;
}
