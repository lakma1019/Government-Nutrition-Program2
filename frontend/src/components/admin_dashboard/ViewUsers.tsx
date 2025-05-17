'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useFetchWithCSRF } from '@/hooks/useFetchWithCSRF';

// Define User type
interface User {
  id: number;
  username: string;
  role: string;
  is_active: string;
  nic_number?: string;
  tel_number?: string;
  address?: string;
  profession?: string;
  created_at?: string;
}

// Define DEO details type
interface DEODetails {
  id: number;
  user_id: number;
  full_name: string;
  nic_number: string;
  tel_number: string;
  address: string;
  is_active: string;
  created_at: string;
  updated_at: string;
}

// Define VO details type
interface VODetails {
  id: number;
  user_id: number;
  full_name: string;
  nic_number: string;
  tel_number: string;
  address: string;
  is_active: string;
  created_at: string;
  updated_at: string;
}

export default function ViewUsersComponent() {
  // State for users list
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for selected user
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // State for role-specific details
  const [deoDetails, setDeoDetails] = useState<DEODetails | null>(null);
  const [voDetails, setVoDetails] = useState<VODetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Get current user from auth context
  const { user: currentUser } = useAuth();

  // Filter options
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { token } = useAuth();
  const { fetchWithCSRF, loading: csrfLoading, error: csrfError } = useFetchWithCSRF();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Update filtered users when search query or filters change
  useEffect(() => {
    // Start with all users
    let filtered = [...users];

    // If not admin, only show the current user
    if (currentUser && currentUser.role !== 'admin') {
      filtered = filtered.filter(user => user.id === currentUser.id);
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(lowercaseQuery) ||
        user.role.toLowerCase().includes(lowercaseQuery)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.is_active === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, statusFilter, users, currentUser]);

  // Fetch users from API with CSRF protection
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // If CSRF token is still loading, wait a short time but proceed anyway
      if (csrfLoading) {
        console.log('CSRF token is still loading, proceeding with request anyway...');
      }

      // If there was a CSRF error, log it but proceed with the request
      if (csrfError) {
        console.warn('CSRF error detected:', csrfError);
        setError(`Security warning: ${csrfError}. Attempting to load users anyway.`);
      }

      const response = await fetchWithCSRF('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch role-specific details
  const fetchRoleSpecificDetails = async (user: User) => {
    if (!user) return;

    // Reset details
    setDeoDetails(null);
    setVoDetails(null);

    // Only fetch details for DEO or VO roles
    if (user.role !== 'deo' && user.role !== 'vo') return;

    setLoadingDetails(true);

    try {
      const endpoint = user.role === 'deo'
        ? `http://localhost:3001/api/user-details/deo/${user.id}`
        : `http://localhost:3001/api/user-details/vo/${user.id}`;

      const response = await fetchWithCSRF(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // If 404, it means details don't exist yet, which is fine
        if (response.status !== 404) {
          console.error(`Failed to fetch ${user.role.toUpperCase()} details: ${response.status}`);
        }
        return;
      }

      const data = await response.json();

      if (user.role === 'deo') {
        setDeoDetails(data.userDetails.deoDetails);
      } else if (user.role === 'vo') {
        setVoDetails(data.userDetails.voDetails);
      }
    } catch (err) {
      console.error(`Error fetching ${user.role.toUpperCase()} details:`, err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle selecting a user to view
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    fetchRoleSpecificDetails(user);
  };

  // Sanitize input to prevent XSS attacks
  const sanitizeInput = (input: string): string => {
    // Basic client-side sanitization
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Handle search input change with sanitization
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(sanitizeInput(e.target.value));
  };

  // Handle role filter change
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // CSS Classes
  const containerClasses = "w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8";
  const headerClasses = "text-2xl font-bold text-gray-800 mb-6 pb-2 border-b";
  const gridContainerClasses = "grid grid-cols-1 md:grid-cols-3 gap-6";
  const userListContainerClasses = "md:col-span-1 border rounded-lg p-4 bg-gray-50";
  const userListHeaderClasses = "flex justify-between items-center mb-4";
  const searchContainerClasses = "relative w-full mb-4";
  const searchInputClasses = "w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500";
  const searchIconClasses = "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500";
  const filterContainerClasses = "space-y-3 mb-4 p-3 bg-gray-100 rounded-md";
  const filterLabelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const filterSelectClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500";
  const resetButtonClasses = "text-sm text-purple-600 hover:text-purple-800 mt-2 cursor-pointer";
  const userListClasses = "space-y-2 mt-4 max-h-[500px] overflow-y-auto";
  const userItemClasses = "p-3 border rounded-md cursor-pointer hover:bg-gray-100 transition-colors";
  const userItemActiveClasses = "p-3 border rounded-md cursor-pointer bg-purple-50 border-purple-500";
  const detailContainerClasses = "md:col-span-2 border rounded-lg p-6";
  const detailHeaderClasses = "text-xl font-semibold mb-6 pb-2 border-b";
  const detailGridClasses = "grid grid-cols-1 md:grid-cols-2 gap-4";
  const detailItemClasses = "mb-4";
  const detailLabelClasses = "text-sm font-medium text-gray-500";
  const detailValueClasses = "text-base font-medium text-gray-900";
  const badgeBaseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const activeBadgeClasses = `${badgeBaseClasses} bg-green-100 text-green-800`;
  const inactiveBadgeClasses = `${badgeBaseClasses} bg-red-100 text-red-800`;
  const adminBadgeClasses = `${badgeBaseClasses} bg-purple-100 text-purple-800`;
  const deoBadgeClasses = `${badgeBaseClasses} bg-blue-100 text-blue-800`;
  const voBadgeClasses = `${badgeBaseClasses} bg-yellow-100 text-yellow-800`;
  const backLinkClasses = "inline-flex items-center text-purple-600 hover:text-purple-800 mt-4";
  const loadingClasses = "flex justify-center items-center h-40 text-xl text-gray-600";
  const emptyStateClasses = "text-center py-8 text-gray-500";
  const refreshButtonClasses = "text-purple-600 hover:text-purple-800";
  const emptyDetailClasses = "flex flex-col items-center justify-center h-full py-12";

  return (
    <div className={containerClasses}>
      <h1 className={headerClasses}>View Users Details</h1>

      <div className={gridContainerClasses}>
        {/* User List Section */}
        <div className={userListContainerClasses}>
          <div className={userListHeaderClasses}>
            <h2 className="text-lg font-semibold">User List</h2>
            <button
              onClick={fetchUsers}
              className={refreshButtonClasses}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {/* Search Bar */}
          <div className={searchContainerClasses}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
              className={searchInputClasses}
            />
            <span className={searchIconClasses}>🔍</span>
          </div>

          {/* Filters */}
          <div className={filterContainerClasses}>
            <h3 className="text-sm font-semibold mb-2">Filters</h3>

            {/* Role Filter */}
            <div>
              <label htmlFor="roleFilter" className={filterLabelClasses}>
                Role
              </label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={handleRoleFilterChange}
                className={filterSelectClasses}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="deo">Data Entry Officer</option>
                <option value="vo">Verification Officer</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="statusFilter" className={filterLabelClasses}>
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className={filterSelectClasses}
              >
                <option value="all">All Statuses</option>
                <option value="yes">Active</option>
                <option value="no">Inactive</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div>
              <button
                onClick={resetFilters}
                className={resetButtonClasses}
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* User List */}
          {loading && !users.length ? (
            <div className={loadingClasses}>Loading users...</div>
          ) : error ? (
            <div className="p-4 mb-6 rounded-md bg-red-50 text-red-800 border border-red-200">
              {error}
            </div>
          ) : (
            <div className={userListClasses}>
              {filteredUsers.length === 0 ? (
                <div className={emptyStateClasses}>
                  {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'No users match your filters'
                    : 'No users found'}
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={selectedUser?.id === user.id ? userItemActiveClasses : userItemClasses}
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                      <span>Role:</span>
                      {user.role === 'admin' && <span className={adminBadgeClasses}>Admin</span>}
                      {user.role === 'deo' && <span className={deoBadgeClasses}>Data Entry Officer</span>}
                      {user.role === 'vo' && <span className={voBadgeClasses}>Verification Officer</span>}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                      <span>Status:</span>
                      {user.is_active === 'yes'
                        ? <span className={activeBadgeClasses}>Active</span>
                        : <span className={inactiveBadgeClasses}>Inactive</span>
                      }
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Details Section */}
        <div className={detailContainerClasses}>
          {selectedUser ? (
            <>
              <h2 className={detailHeaderClasses}>User Details: {selectedUser.username}</h2>

              <div className={detailGridClasses}>
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className={detailItemClasses}>
                    <div className={detailLabelClasses}>Username</div>
                    <div className={detailValueClasses}>{selectedUser.username}</div>
                  </div>

                  <div className={detailItemClasses}>
                    <div className={detailLabelClasses}>Role</div>
                    <div className="mt-1">
                      {selectedUser.role === 'admin' && <span className={adminBadgeClasses}>Admin</span>}
                      {selectedUser.role === 'deo' && <span className={deoBadgeClasses}>Data Entry Officer</span>}
                      {selectedUser.role === 'vo' && <span className={voBadgeClasses}>Verification Officer</span>}
                    </div>
                  </div>

                  <div className={detailItemClasses}>
                    <div className={detailLabelClasses}>Status</div>
                    <div className="mt-1">
                      {selectedUser.is_active === 'yes'
                        ? <span className={activeBadgeClasses}>Active</span>
                        : <span className={inactiveBadgeClasses}>Inactive</span>
                      }
                    </div>
                  </div>

                  <div className={detailItemClasses}>
                    <div className={detailLabelClasses}>User ID</div>
                    <div className={detailValueClasses}>{selectedUser.id}</div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <div className={detailItemClasses}>
                    <div className={detailLabelClasses}>NIC Number</div>
                    <div className={detailValueClasses}>{selectedUser.nic_number || 'Not provided'}</div>
                  </div>

                  <div className={detailItemClasses}>
                    <div className={detailLabelClasses}>Telephone</div>
                    <div className={detailValueClasses}>{selectedUser.tel_number || 'Not provided'}</div>
                  </div>

                  <div className={detailItemClasses}>
                    <div className={detailLabelClasses}>Address</div>
                    <div className={detailValueClasses}>{selectedUser.address || 'Not provided'}</div>
                  </div>

                  <div className={detailItemClasses}>
                    <div className={detailLabelClasses}>Profession</div>
                    <div className={detailValueClasses}>{selectedUser.profession || 'Not provided'}</div>
                  </div>
                </div>
              </div>

              {/* Role-specific details */}
              {selectedUser.role === 'deo' && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Data Entry Officer Details</h3>

                  {loadingDetails ? (
                    <div className="p-4 text-blue-700">Loading DEO details...</div>
                  ) : deoDetails ? (
                    <div className="space-y-4">
                      <div className={detailItemClasses}>
                        <div className={detailLabelClasses}>Full Name</div>
                        <div className={detailValueClasses}>{deoDetails.full_name}</div>
                      </div>

                      <div className={detailItemClasses}>
                        <div className={detailLabelClasses}>NIC Number</div>
                        <div className={detailValueClasses}>{deoDetails.nic_number || 'Not provided'}</div>
                      </div>

                      <div className={detailItemClasses}>
                        <div className={detailLabelClasses}>Telephone Number</div>
                        <div className={detailValueClasses}>{deoDetails.tel_number || 'Not provided'}</div>
                      </div>

                      <div className={detailItemClasses}>
                        <div className={detailLabelClasses}>Address</div>
                        <div className={detailValueClasses}>{deoDetails.address || 'Not provided'}</div>
                      </div>

                      <div className={detailItemClasses}>
                        <div className={detailLabelClasses}>Status</div>
                        <div className="mt-1">
                          {deoDetails.is_active === 'yes'
                            ? <span className={activeBadgeClasses}>Active</span>
                            : <span className={inactiveBadgeClasses}>Inactive</span>
                          }
                        </div>
                      </div>

                      <div className="mt-4">
                        <Link
                          href={`/admin_dashboard/edit_users/deo_details/${selectedUser.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit DEO Details
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md">
                      <p>No DEO details found for this user.</p>
                      <Link
                        href={`/admin_dashboard/edit_users/deo_details/${selectedUser.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium block mt-2"
                      >
                        Add DEO Details
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {selectedUser.role === 'vo' && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Verification Officer Details</h3>

                  {loadingDetails ? (
                    <div className="p-4 text-blue-700">Loading VO details...</div>
                  ) : voDetails ? (
                    <div className="space-y-4">
                      <div className={detailItemClasses}>
                        <div className={detailLabelClasses}>Full Name</div>
                        <div className={detailValueClasses}>{voDetails.full_name}</div>
                      </div>

                      <div className={detailItemClasses}>
                        <div className={detailLabelClasses}>NIC Number</div>
                        <div className={detailValueClasses}>{voDetails.nic_number || 'Not provided'}</div>
                      </div>

                      <div className={detailItemClasses}>
                        <div className={detailLabelClasses}>Telephone Number</div>
                        <div className={detailValueClasses}>{voDetails.tel_number || 'Not provided'}</div>
                      </div>

                      <div className={detailItemClasses}>
                        <div className={detailLabelClasses}>Address</div>
                        <div className={detailValueClasses}>{voDetails.address || 'Not provided'}</div>
                      </div>

                      <div className={detailItemClasses}>
                        <div className={detailLabelClasses}>Status</div>
                        <div className="mt-1">
                          {voDetails.is_active === 'yes'
                            ? <span className={activeBadgeClasses}>Active</span>
                            : <span className={inactiveBadgeClasses}>Inactive</span>
                          }
                        </div>
                      </div>

                      <div className="mt-4">
                        <Link
                          href={`/admin_dashboard/edit_users/vo_details/${selectedUser.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit VO Details
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md">
                      <p>No VO details found for this user.</p>
                      <Link
                        href={`/admin_dashboard/edit_users/vo_details/${selectedUser.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium block mt-2"
                      >
                        Add VO Details
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Created Date */}
              <div className="mt-6 pt-4 border-t">
                <div className={detailLabelClasses}>Account Created</div>
                <div className={detailValueClasses}>{formatDate(selectedUser.created_at)}</div>
              </div>
            </>
          ) : (
            <div className={emptyDetailClasses}>
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">Select a User to View</h3>
              <p className="text-gray-500 text-center">
                Choose a user from the list on the left to view their details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Back to Dashboard Link */}
      <Link href="/admin_dashboard" className={backLinkClasses}>
        ← Back to Dashboard
      </Link>
    </div>
  );
}