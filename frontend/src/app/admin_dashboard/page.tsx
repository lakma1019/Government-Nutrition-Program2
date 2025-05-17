'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true); // Loading state for initial authentication check
  const pathname = usePathname(); // Get current path for navigation highlighting
  const router = useRouter(); // Router for navigation

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

  // --- Tailwind Class Mapping ---
  // Container and general layout
  const containerClasses = "w-full min-h-screen p-5 bg-[#d6e9f3] font-sans flex flex-col";

  // Navigation Bar
  const navbarClasses = "flex justify-between items-center py-[15px] px-[25px] bg-[#e6f0ff] rounded-[15px] shadow-lg mb-10";
  const brandClasses = "text-xl font-bold text-[#003300]";
  const navLinksClasses = "flex gap-4";
  const navLinkBaseClasses = "inline-flex group";
  const linkTextBaseClasses = "inline-block py-[5px] px-[15px] bg-white rounded-full text-black text-sm font-bold transition-all duration-200 ease-in-out";
  const linkTextHoverClasses = "group-hover:bg-[#c79696]";
  const linkTextHighlightClasses = "bg-[#f1a3d0] border-[5px] border-red-600 !text-black";

  // Welcome Header
  const welcomeHeaderClasses = "text-center my-5 text-2xl text-gray-800 font-semibold";

  // Loading Message
  const loadingMessageClasses = "flex justify-center items-center h-screen text-2xl text-indigo-600";


  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className={loadingMessageClasses}>Loading...</div>
    );
  }

  // Define card styles for the new dashboard
  const cardContainerClasses = "grid grid-cols-1 md:grid-cols-3 gap-8 p-8";
  const cardClasses = "bg-white rounded-xl shadow-lg hover:shadow-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 border border-gray-100 cursor-pointer";
  const cardIconClasses = "bg-blue-100 p-8 flex justify-center items-center h-36 text-5xl";
  const cardBodyClasses = "p-6 flex-1 flex flex-col items-center text-center";
  const cardTitleClasses = "text-xl font-bold text-gray-800 mb-3";
  const cardDescriptionClasses = "text-gray-600 mb-4";

  return (
    <div className={containerClasses}>
      {/* Navigation Bar */}
      <nav className={navbarClasses}>
        <div className={brandClasses}>Government Nutrition Program</div>
        <div className={navLinksClasses}>
          <Link href="/" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/" ? linkTextHighlightClasses : ""}`}>
              Home
            </span>
          </Link>
          <Link href="/about" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/about" ? linkTextHighlightClasses : ""}`}>
              About Program
            </span>
          </Link>
          <Link href="/" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/" ? linkTextHighlightClasses : ""}`}>
              Logout
            </span>
          </Link>
          <Link href="/gazette" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/gazette" ? linkTextHighlightClasses : ""}`}>
              Gazette
            </span>
          </Link>
        </div>
      </nav>

      {/* Welcome Header */}
      <div className={welcomeHeaderClasses}>
        <h1>Admin Dashboard</h1>
      </div>

      {/* Main Content - Card Layout */}
      <div className={cardContainerClasses}>
        {/* Add Users Card */}
        <div
          className={cardClasses}
          onClick={() => router.push('/admin_dashboard/add_users')}
        >
          <div className={`${cardIconClasses} bg-blue-100 text-blue-600`}>
            👤
          </div>
          <div className={cardBodyClasses}>
            <h2 className={cardTitleClasses}>Add Users</h2>
            <p className={cardDescriptionClasses}>Create new user accounts with different roles and permissions</p>
            <button className="mt-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Add Users
            </button>
          </div>
        </div>

        {/* Edit Users Card */}
        <div
          className={cardClasses}
          onClick={() => router.push('/admin_dashboard/edit_users')}
        >
          <div className={`${cardIconClasses} bg-green-100 text-green-600`}>
            ✏️
          </div>
          <div className={cardBodyClasses}>
            <h2 className={cardTitleClasses}>Edit Users</h2>
            <p className={cardDescriptionClasses}>Modify existing user accounts and update their information</p>
            <button className="mt-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Edit Users
            </button>
          </div>
        </div>

        {/* View Users Card */}
        <div
          className={cardClasses}
          onClick={() => router.push('/admin_dashboard/view_users')}
        >
          <div className={`${cardIconClasses} bg-purple-100 text-purple-600`}>
            📋
          </div>
          <div className={cardBodyClasses}>
            <h2 className={cardTitleClasses}>View Users Details</h2>
            <p className={cardDescriptionClasses}>Browse and search through all registered user accounts</p>
            <button className="mt-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              View Users Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}