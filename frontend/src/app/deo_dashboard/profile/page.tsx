'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// Define DEO details type
interface DEODetails {
  id: number;
  user_id: number;
  full_name: string;
  nic_number: string | null;
  tel_number: string | null;
  address: string | null;
  is_active: string;
  created_at: string;
  updated_at: string;
}

// Define user details type
interface UserDetails {
  id: number;
  username: string;
  role: string;
  is_active: string;
  created_at: string;
  updated_at: string;
  deoDetails: DEODetails;
}

export default function DEOProfilePage() {
  // State for user details
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get auth context
  const { user, token } = useAuth();
  const router = useRouter();

  // Fetch user details on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user is authenticated
        if (!user || !token) {
          router.push('/login');
          return;
        }

        // Check if user is a data entry officer
        if (user.role !== 'dataEntryOfficer') {
          alert('Access denied. Only Data Entry Officers can access this page.');
          router.push('/');
          return;
        }

        // Fetch DEO details
        fetchDEODetails();
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [user, token, router]);

  // Function to fetch DEO details
  const fetchDEODetails = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!user || !user.id) {
        throw new Error('User ID not found');
      }

      const response = await fetch(`http://localhost:3001/api/user-details/deo/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token || ''
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch DEO details');
      }

      setUserDetails(data.userDetails);
    } catch (err) {
      console.error('Error fetching DEO details:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Format date function
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not available';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // --- Tailwind Class Mapping ---
  // Container and general layout
  const containerClasses = "w-full min-h-screen p-5 bg-[#f8e6f3] font-sans flex flex-col";

  // Navigation Bar
  const navbarClasses = "flex justify-between items-center py-4 px-6 mb-5 bg-[#e6b3d9] rounded-lg shadow-md";
  const brandClasses = "text-xl font-bold text-gray-800";
  const navLinksClasses = "flex space-x-4";
  const navLinkBaseClasses = "inline-flex group";
  const linkTextBaseClasses = "inline-block py-1.5 px-4 bg-white rounded-full text-black text-sm font-bold transition-all duration-200 ease-in-out";
  const linkTextHoverClasses = "group-hover:bg-[#f0e0f0]";
  const linkTextHighlightClasses = "bg-[#f0e0f0] border-2 border-[#d070d0] !text-black";

  // Page header
  const pageHeaderClasses = "text-center mb-5 py-2 bg-[#f8e6f3] rounded-lg";
  const pageHeaderH1Classes = "text-xl font-semibold text-gray-800";

  // Main content area
  const mainContentClasses = "bg-white rounded-xl shadow-lg border-2 border-purple-300 p-6 mt-5";

  // Profile card
  const profileCardClasses = "max-w-3xl mx-auto";
  const profileHeaderClasses = "text-2xl font-bold text-purple-800 mb-6 pb-2 border-b border-purple-200";

  // Details section
  const detailsSectionClasses = "grid grid-cols-1 md:grid-cols-2 gap-6";
  const detailGroupClasses = "mb-4";
  const detailLabelClasses = "text-sm font-medium text-gray-500";
  const detailValueClasses = "text-base font-medium text-gray-900 mt-1";

  // Status badge
  const badgeBaseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1";
  const activeBadgeClasses = `${badgeBaseClasses} bg-green-100 text-green-800`;
  const inactiveBadgeClasses = `${badgeBaseClasses} bg-red-100 text-red-800`;

  // Loading and error states
  const loadingClasses = "flex justify-center items-center h-64 text-xl text-purple-700";
  const errorClasses = "p-4 mb-6 rounded-md bg-red-50 text-red-800 border border-red-200";

  // Back button
  const backButtonClasses = "mt-6 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors";

  // Show loading state
  if (loading) {
    return (
      <div className={containerClasses}>
        {/* Navigation Bar */}
        <nav className={navbarClasses}>
          <div className={brandClasses}>Government Nutrition Program</div>
          <div className={navLinksClasses}>
            <Link href="/deo_dashboard" className={navLinkBaseClasses}>
              <span className={`${linkTextBaseClasses} ${linkTextHoverClasses}`}>
                Dashboard
              </span>
            </Link>
            <Link href="/" className={navLinkBaseClasses}>
              <span className={`${linkTextBaseClasses} ${linkTextHoverClasses}`}>
                Logout
              </span>
            </Link>
          </div>
        </nav>

        <div className={pageHeaderClasses}>
          <h1 className={pageHeaderH1Classes}>My Profile</h1>
        </div>

        <div className={mainContentClasses}>
          <div className={loadingClasses}>
            Loading profile information...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Navigation Bar */}
      <nav className={navbarClasses}>
        <div className={brandClasses}>Government Nutrition Program</div>
        <div className={navLinksClasses}>
          <Link href="/deo_dashboard" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses}`}>
              Dashboard
            </span>
          </Link>
          <Link href="/" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses}`}>
              Logout
            </span>
          </Link>
        </div>
      </nav>

      <div className={pageHeaderClasses}>
        <h1 className={pageHeaderH1Classes}>My Profile</h1>
      </div>

      <div className={mainContentClasses}>
        {error ? (
          <div className={errorClasses}>
            <p>{error}</p>
            <button
              onClick={fetchDEODetails}
              className="mt-2 text-red-800 underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        ) : userDetails ? (
          <div className={profileCardClasses}>
            <h2 className={profileHeaderClasses}>Data Entry Officer Profile</h2>

            <div className={detailsSectionClasses}>
              {/* Basic User Information */}
              <div>
                <h3 className="text-lg font-semibold text-purple-700 mb-4">Account Information</h3>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>Username</div>
                  <div className={detailValueClasses}>{userDetails.username}</div>
                </div>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>Role</div>
                  <div className={detailValueClasses}>Data Entry Officer</div>
                </div>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>Account Status</div>
                  <div>
                    {userDetails.is_active === 'yes'
                      ? <span className={activeBadgeClasses}>Active</span>
                      : <span className={inactiveBadgeClasses}>Inactive</span>
                    }
                  </div>
                </div>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>Account Created</div>
                  <div className={detailValueClasses}>{formatDate(userDetails.created_at)}</div>
                </div>
              </div>

              {/* DEO Specific Details */}
              <div>
                <h3 className="text-lg font-semibold text-purple-700 mb-4">Personal Information</h3>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>Full Name</div>
                  <div className={detailValueClasses}>{userDetails.deoDetails.full_name}</div>
                </div>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>NIC Number</div>
                  <div className={detailValueClasses}>{userDetails.deoDetails.nic_number || 'Not provided'}</div>
                </div>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>Telephone Number</div>
                  <div className={detailValueClasses}>{userDetails.deoDetails.tel_number || 'Not provided'}</div>
                </div>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>Address</div>
                  <div className={detailValueClasses}>{userDetails.deoDetails.address || 'Not provided'}</div>
                </div>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>Status</div>
                  <div>
                    {userDetails.deoDetails.is_active === 'yes'
                      ? <span className={activeBadgeClasses}>Active</span>
                      : <span className={inactiveBadgeClasses}>Inactive</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <Link href="/deo_dashboard" className={backButtonClasses}>
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No profile information found.</p>
            <button
              onClick={fetchDEODetails}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}