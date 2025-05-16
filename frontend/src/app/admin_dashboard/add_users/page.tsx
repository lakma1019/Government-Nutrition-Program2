'use client';

import AddUsersComponent from '@/components/admin_dashboard/AddUsers';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddUsersPage() {
const [loading, setLoading] = useState(true);
const router = useRouter();

// Check if user is authenticated and is an admin on component mount
useEffect(() => {
const checkAuth = () => {
try {
const storedUser = localStorage.getItem('user');
if (!storedUser) {
router.push('/login'); // Redirect to login if no user data found
return;
}

const userData = JSON.parse(storedUser);

    // Check if user is an admin role
    if (userData.role !== 'admin') {
      alert('Access denied. Only administrators can access this page.');
      router.push('/'); // Redirect to home or another page if not admin
    }
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
return <div className="flex justify-center items-center h-screen text-2xl text-indigo-600">Loading...</div>;
}

return <AddUsersComponent />;
}