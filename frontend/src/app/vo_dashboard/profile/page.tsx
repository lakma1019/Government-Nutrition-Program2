'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// Define VO details type
interface VODetails {
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
  voDetails: VODetails;
}

export default function VOProfilePage() {
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

        // Check if user is a verification officer
        if (user.role !== 'verificationOfficer') {
          alert('Access denied. Only Verification Officers can access this page.');
          router.push('/');
          return;
        }

        // Fetch VO details
        fetchVODetails();
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [user, token, router]);

  // Function to fetch VO details
  const fetchVODetails = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!user || !user.id) {
        throw new Error('User ID not found');
      }

      const response = await fetch(`http://localhost:3001/api/user-details/vo/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token || ''
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch VO details');
      }

      setUserDetails(data.userDetails);
    } catch (err) {
      console.error('Error fetching VO details:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Tailwind CSS classes
  const containerClasses = "min-h-screen bg-gray-50";
  const navbarClasses = "bg-white shadow-sm py-4 px-6 flex justify-between items-center";
  const brandClasses = "text-xl font-bold text-purple-700";
  const navLinksClasses = "flex space-x-4";
  const navLinkBaseClasses = "px-3 py-2 rounded-md";
  const linkTextBaseClasses = "text-gray-600 hover:text-purple-700";
  const linkTextHoverClasses = "hover:underline";
  const pageHeaderClasses = "bg-white shadow-sm mt-6 mx-6 p-6 rounded-lg";
  const pageHeaderH1Classes = "text-2xl font-bold text-gray-800";
  const mainContentClasses = "mx-6 my-6";
  const loadingClasses = "flex justify-center items-center p-12 text-gray-500";
  const errorClasses = "bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg";
  const profileCardClasses = "bg-white shadow-sm rounded-lg p-8";
  const profileHeaderClasses = "text-xl font-bold text-purple-700 mb-6 pb-4 border-b border-gray-200";
  const detailsSectionClasses = "grid grid-cols-1 md:grid-cols-2 gap-8";
  const detailGroupClasses = "mb-4";
  const detailLabelClasses = "text-sm font-medium text-gray-500 mb-1";
  const detailValueClasses = "text-base text-gray-800";
  const activeBadgeClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800";
  const inactiveBadgeClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800";
  const backButtonClasses = "inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500";

  // Show loading state
  if (loading) {
    return (
      <div className={containerClasses}>
        {/* Navigation Bar */}
        <nav className={navbarClasses}>
          <div className={brandClasses}>Government Nutrition Program</div>
          <div className={navLinksClasses}>
            <Link href="/vo_dashboard" className={navLinkBaseClasses}>
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
          <Link href="/vo_dashboard" className={navLinkBaseClasses}>
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
              onClick={fetchVODetails}
              className="mt-2 text-red-800 underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        ) : userDetails ? (
          <div className={profileCardClasses}>
            <h2 className={profileHeaderClasses}>Verification Officer Profile</h2>

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
                  <div className={detailValueClasses}>Verification Officer</div>
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
                  <div className={detailValueClasses}>
                    {new Date(userDetails.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>Last Updated</div>
                  <div className={detailValueClasses}>
                    {new Date(userDetails.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {/* VO Specific Details */}
              <div>
                <h3 className="text-lg font-semibold text-purple-700 mb-4">Personal Information</h3>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>Full Name</div>
                  <div className={detailValueClasses}>{userDetails.voDetails.full_name}</div>
                </div>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>NIC Number</div>
                  <div className={detailValueClasses}>{userDetails.voDetails.nic_number || 'Not provided'}</div>
                </div>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>Telephone Number</div>
                  <div className={detailValueClasses}>{userDetails.voDetails.tel_number || 'Not provided'}</div>
                </div>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>Address</div>
                  <div className={detailValueClasses}>{userDetails.voDetails.address || 'Not provided'}</div>
                </div>

                <div className={detailGroupClasses}>
                  <div className={detailLabelClasses}>Status</div>
                  <div>
                    {userDetails.voDetails.is_active === 'yes'
                      ? <span className={activeBadgeClasses}>Active</span>
                      : <span className={inactiveBadgeClasses}>Inactive</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <Link href="/vo_dashboard" className={backButtonClasses}>
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No profile information found.</p>
            <button
              onClick={fetchVODetails}
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