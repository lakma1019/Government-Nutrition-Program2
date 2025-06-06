'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { editUserSchema, type EditUserFormData } from '@/schemas/userForms';
import { ZodError } from 'zod';
import { useFetchWithCSRF } from '@/hooks/useFetchWithCSRF';

// Define User type
interface User {
  id: number;
  username: string;
  role: string;
  is_active: string;
}

export default function EditUsersComponent() {
  // State for users list
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user from auth context
  const { user: currentUser } = useAuth();

  // State for selected user and edit form
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<EditUserFormData>({
    username: '',
    password: '', // Optional for updates
    confirmPassword: '', // Added for validation
    role: 'admin',
    isActive: 'yes'
  });

  // State for active user confirmation
  const [showActiveUserConfirm, setShowActiveUserConfirm] = useState(false);
  const [activeUserInfo, setActiveUserInfo] = useState<{
    id: number;
    username: string;
  } | null>(null);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Success/error messages for form submission
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { token } = useAuth();
  const { fetchWithCSRF, loading: csrfLoading, error: csrfError } = useFetchWithCSRF();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Update filtered users when search query changes or when users list changes
  useEffect(() => {
    // If not admin, only show the current user
    let filtered = [...users];

    if (currentUser && currentUser.role !== 'admin') {
      filtered = users.filter(user => user.id === currentUser.id);
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(lowercaseQuery) ||
        user.role.toLowerCase().includes(lowercaseQuery)
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, users, currentUser]);

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

  // Handle selecting a user to edit
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't pre-fill password
      confirmPassword: '', // Don't pre-fill confirm password
      role: user.role as 'admin' | 'deo' | 'vo', // Cast to expected type
      isActive: user.is_active as 'yes' | 'no' // Cast to expected type
    });
    setFormSuccess(null);
    setFormError(null);
    setValidationErrors({});
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  // Handle radio button changes
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Validate form using Zod
  const validateForm = (): boolean => {
    try {
      // For edit form, we need to handle the case where password is empty
      // If password is empty, we don't need to validate it
      if (!formData.password) {
        // Create a modified schema that doesn't require password
        const { password, confirmPassword, ...restData } = formData;

        // Only validate the rest of the data
        editUserSchema.parse({
          ...restData,
          password: '',
          confirmPassword: ''
        });
      } else {
        // If password is provided, validate the entire form including password match
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords don't match");
        }
        editUserSchema.parse(formData);
      }

      setValidationErrors({});
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        // Convert Zod errors to our validation error format
        const errors: Record<string, string> = {};
        err.errors.forEach((error) => {
          const path = error.path.join('.');
          errors[path] = error.message;
        });
        setValidationErrors(errors);
      } else if (err instanceof Error) {
        // Handle custom errors like password mismatch
        setValidationErrors({
          confirmPassword: err.message
        });
      } else {
        console.error('Unexpected validation error:', err);
      }
      return false;
    }
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous messages
    setFormSuccess(null);
    setFormError(null);

    // Check if CSRF token is still loading
    if (csrfLoading) {
      setFormError('Security token is still loading. Please try again in a moment.');
      return;
    }

    // Validate form using Zod
    if (!validateForm() || !selectedUser) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API with sanitized inputs
      const userData: Record<string, any> = {
        username: sanitizeInput(formData.username),
        role: formData.role,
        is_active: formData.isActive
      };

      // Only include password if it's provided and matches confirmation
      if (formData.password && formData.password === formData.confirmPassword) {
        userData.password = formData.password; // Don't sanitize password as it needs to be hashed
      } else if (formData.password) {
        console.warn('Password and confirmation do not match');
      }

      // Send PUT request to update user with CSRF protection
      const response = await fetchWithCSRF(`http://localhost:3001/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      console.log('Update response status:', response.status);

      const data = await response.json();

      console.log('Response data:', data);

      if (!response.ok) {
        // Check if the error is due to active user constraint
        if (response.status === 400 && data.activeUser) {
          console.log('Active user found:', data.activeUser);
          setActiveUserInfo(data.activeUser);
          setPendingFormData(userData);
          setShowActiveUserConfirm(true);
          return;
        }

        setFormError(data.message || 'Failed to update user');
        console.error('Update failed:', data);
        return;
      }

      // If we get here, the response was OK
      // Show success message
      const successMessage = data.message || 'User updated successfully';
      setFormSuccess(successMessage);
      console.log(successMessage);

      // Refresh the users list
      fetchUsers();

      // Reset form
      if (selectedUser) {
        // Update the selected user with the new data from the response
        setSelectedUser({
          ...selectedUser,
          username: data.user.username,
          role: data.user.role,
          is_active: data.user.is_active
        });

        // Reset form fields
        setFormData({
          username: data.user.username,
          password: '', // Clear password field
          confirmPassword: '', // Clear confirm password field
          role: data.user.role as 'admin' | 'deo' | 'vo',
          isActive: data.user.is_active as 'yes' | 'no'
        });
      }

      // Make sure the success message is visible
      const successElement = document.getElementById('success-message');
      if (successElement) {
        successElement.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Function to handle confirmation of deactivating current active user
  const confirmDeactivateActiveUser = async () => {
    if (!activeUserInfo || !pendingFormData || !selectedUser) {
      setShowActiveUserConfirm(false);
      setFormError('Missing information for user activation.');
      return;
    }

    try {
      // First, deactivate the currently active user
      const deactivateResponse = await fetchWithCSRF(`http://localhost:3001/api/users/${activeUserInfo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: activeUserInfo.username,
          is_active: 'no',
          role: pendingFormData.role // Keep the same role
        }),
      });

      if (!deactivateResponse.ok) {
        const deactivateData = await deactivateResponse.json();
        throw new Error(`Failed to deactivate current user: ${deactivateData.message || 'Unknown error'}`);
      }

      // Now submit the original update request again
      const submitResponse = await fetchWithCSRF(`http://localhost:3001/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pendingFormData),
      });

      const submitData = await submitResponse.json();

      if (!submitResponse.ok) {
        throw new Error(`Failed to update user: ${submitData.message || 'Unknown error'}`);
      }

      // Show success message
      setFormSuccess(`User updated successfully and set as active. Previous active ${pendingFormData.role.toUpperCase()} was deactivated.`);

      // Refresh the users list
      fetchUsers();

      // Update the selected user with the new data
      if (selectedUser) {
        setSelectedUser({
          ...selectedUser,
          username: submitData.user.username,
          role: submitData.user.role,
          is_active: submitData.user.is_active
        });

        // Reset form fields
        setFormData({
          username: submitData.user.username,
          password: '', // Clear password field
          confirmPassword: '', // Clear confirm password field
          role: submitData.user.role as 'admin' | 'deo' | 'vo',
          isActive: submitData.user.is_active as 'yes' | 'no'
        });
      }

    } catch (err) {
      console.error('Error in deactivate/activate process:', err);
      setFormError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setShowActiveUserConfirm(false);
      setPendingFormData(null);
      setActiveUserInfo(null);
    }
  };

  // CSS Classes
  const containerClasses = "w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8";
  const headerClasses = "text-2xl font-bold text-gray-800 mb-6 pb-2 border-b";
  const gridContainerClasses = "grid grid-cols-1 md:grid-cols-3 gap-6";
  const userListContainerClasses = "md:col-span-1 border rounded-lg p-4 bg-gray-50";
  const userListHeaderClasses = "flex justify-between items-center mb-4";
  const searchContainerClasses = "relative w-full";
  const searchInputClasses = "w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500";
  const searchIconClasses = "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500";
  const userListClasses = "space-y-2 mt-4 max-h-[500px] overflow-y-auto";
  const userItemClasses = "p-3 border rounded-md cursor-pointer hover:bg-gray-100 transition-colors";
  const userItemActiveClasses = "p-3 border rounded-md cursor-pointer bg-green-50 border-green-500";
  const formContainerClasses = "md:col-span-2 border rounded-lg p-6";
  const formClasses = "space-y-6";
  const formGroupClasses = "flex flex-col space-y-1";
  const labelClasses = "text-sm font-medium text-gray-700";
  const inputClasses = "px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500";
  const errorClasses = "text-sm text-red-600 mt-1";
  const buttonClasses = "w-full py-2 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors";
  const disabledButtonClasses = "w-full py-2 px-4 bg-gray-400 text-white font-medium rounded-md cursor-not-allowed";
  const radioGroupClasses = "flex space-x-6 mt-1";
  const radioLabelClasses = "flex items-center space-x-2 cursor-pointer";
  const radioInputClasses = "h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300";
  const alertSuccessClasses = "p-4 mb-6 rounded-md bg-green-50 text-green-800 border border-green-200";
  const alertErrorClasses = "p-4 mb-6 rounded-md bg-red-50 text-red-800 border border-red-200";
  const backLinkClasses = "inline-flex items-center text-green-600 hover:text-green-800 mt-4";
  const loadingClasses = "flex justify-center items-center h-40 text-xl text-gray-600";
  const emptyStateClasses = "text-center py-8 text-gray-500";

  // Badge classes (copied from ViewUsers component)
  const badgeBaseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const activeBadgeClasses = `${badgeBaseClasses} bg-green-100 text-green-800`;
  const inactiveBadgeClasses = `${badgeBaseClasses} bg-red-100 text-red-800`;
  const adminBadgeClasses = `${badgeBaseClasses} bg-purple-100 text-purple-800`;
  const deoBadgeClasses = `${badgeBaseClasses} bg-blue-100 text-blue-800`;
  const voBadgeClasses = `${badgeBaseClasses} bg-yellow-100 text-yellow-800`;

  return (
    <div className={containerClasses}>
      <h1 className={headerClasses}>Edit Users</h1>

      <div className={gridContainerClasses}>
        {/* User List Section */}
        <div className={userListContainerClasses}>
          <div className={userListHeaderClasses}>
            <h2 className="text-lg font-semibold">User List</h2>
            <button
              onClick={fetchUsers}
              className="text-green-600 hover:text-green-800"
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

          {/* User List */}
          {loading && !users.length ? (
            <div className={loadingClasses}>Loading users...</div>
          ) : error ? (
            <div className={alertErrorClasses}>{error}</div>
          ) : (
            <div className={userListClasses}>
              {filteredUsers.length === 0 ? (
                <div className={emptyStateClasses}>
                  {searchQuery ? 'No users match your search' : 'No users found'}
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

        {/* Edit Form Section */}
        <div className={formContainerClasses}>
          {selectedUser ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Edit  {selectedUser.username} user login credentials:</h2>

              {/* User current role and status badges */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Current Role:</span>
                  {selectedUser.role === 'admin' && <span className={adminBadgeClasses}>Admin</span>}
                  {selectedUser.role === 'deo' && <span className={deoBadgeClasses}>Data Entry Officer</span>}
                  {selectedUser.role === 'vo' && <span className={voBadgeClasses}>Verification Officer</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Current Status:</span>
                  {selectedUser.is_active === 'yes'
                    ? <span className={activeBadgeClasses}>Active</span>
                    : <span className={inactiveBadgeClasses}>Inactive</span>
                  }
                </div>
              </div>

              {/* Success Message */}
              {formSuccess && (
                <div id="success-message" className={alertSuccessClasses}>
                  {formSuccess}
                </div>
              )}

              {/* Error Message */}
              {formError && (
                <div className={alertErrorClasses}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className={formClasses}>
                {/* Username */}
                <div className={formGroupClasses}>
                  <label htmlFor="username" className={labelClasses}>
                    Username *
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="Enter username"
                  />
                  {validationErrors.username && (
                    <p className={errorClasses}>{validationErrors.username}</p>
                  )}
                </div>

                {/* Password (Optional) */}
                <div className={formGroupClasses}>
                  <label htmlFor="password" className={labelClasses}>
                    Password (Leave blank to keep current password)
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="Enter new password"
                  />
                  {validationErrors.password && (
                    <p className={errorClasses}>{validationErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className={formGroupClasses}>
                  <label htmlFor="confirmPassword" className={labelClasses}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="Confirm new password"
                  />
                  {validationErrors.confirmPassword && (
                    <p className={errorClasses}>{validationErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Role */}
                <div className={formGroupClasses}>
                  <label htmlFor="role" className={labelClasses}>
                    Role *
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-500">Selected:</span>
                    {formData.role === 'admin' && <span className={adminBadgeClasses}>Admin</span>}
                    {formData.role === 'deo' && <span className={deoBadgeClasses}>Data Entry Officer</span>}
                    {formData.role === 'vo' && <span className={voBadgeClasses}>Verification Officer</span>}
                  </div>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={inputClasses}
                  >
                    <option value="admin">Admin</option>
                    <option value="deo">Data Entry Officer</option>
                    <option value="vo">Verification Officer</option>
                  </select>
                </div>

                {/* Active Status */}
                <div className={formGroupClasses}>
                  <label className={labelClasses}>Status *</label>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-500">Selected:</span>
                    {formData.isActive === 'yes'
                      ? <span className={activeBadgeClasses}>Active</span>
                      : <span className={inactiveBadgeClasses}>Inactive</span>
                    }
                  </div>
                  <div className={radioGroupClasses}>
                    <label className={radioLabelClasses}>
                      <input
                        type="radio"
                        name="isActive"
                        value="yes"
                        checked={formData.isActive === 'yes'}
                        onChange={handleRadioChange}
                        className={radioInputClasses}
                      />
                      <span className="mr-1">Active</span>
                      <span className={activeBadgeClasses}>Active</span>
                    </label>
                    <label className={radioLabelClasses}>
                      <input
                        type="radio"
                        name="isActive"
                        value="no"
                        checked={formData.isActive === 'no'}
                        onChange={handleRadioChange}
                        className={radioInputClasses}
                      />
                      <span className="mr-1">Inactive</span>
                      <span className={inactiveBadgeClasses}>Inactive</span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={loading ? disabledButtonClasses : buttonClasses}
                  disabled={loading}
                >
                  {loading ? 'Updating User...' : 'Update User'}
                </button>

                {/* Role-specific detail buttons */}
                {selectedUser && selectedUser.role === 'deo' && (
                  <Link
                    href={`/admin_dashboard/edit_users/deo_details/${selectedUser.id}`}
                    className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit DEO Details
                  </Link>
                )}

                {selectedUser && selectedUser.role === 'vo' && (
                  <Link
                    href={`/admin_dashboard/edit_users/vo_details/${selectedUser.id}`}
                    className="mt-4 inline-block px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    Edit VO Details
                  </Link>
                )}
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="text-6xl mb-4">✏️</div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">Select a User to Edit</h3>
              <p className="text-gray-500 text-center">
                Choose a user from the list on the left to edit their details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Back to Dashboard Link */}
      <Link href="/admin_dashboard" className={backLinkClasses}>
        ← Back to Dashboard
      </Link>

      {/* Active user confirmation modal */}
      {showActiveUserConfirm && activeUserInfo && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-11/12 max-w-sm shadow-xl overflow-hidden">
            <div className="bg-gray-100 py-4 px-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="m-0 text-lg font-semibold text-gray-800">Active User Exists</h2>
              <button
                onClick={() => setShowActiveUserConfirm(false)}
                className="bg-none border-none text-2xl cursor-pointer text-gray-600 hover:text-red-600"
              >
                &times;
              </button>
            </div>
            <div className="p-6 text-gray-700 text-sm">
              <p className="mb-4">
                There is already an active user with the role {pendingFormData?.role.toUpperCase()}: <strong>{activeUserInfo.username}</strong>
              </p>
              <p className="mb-4">
                Only one active user per role is allowed. Would you like to deactivate the current active user and activate this one instead?
              </p>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowActiveUserConfirm(false)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150 bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeactivateActiveUser}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                >
                  Deactivate Current & Activate New
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}