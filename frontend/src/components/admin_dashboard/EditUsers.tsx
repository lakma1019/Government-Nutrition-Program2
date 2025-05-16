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

  // State for selected user and edit form
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<EditUserFormData>({
    username: '',
    password: '', // Optional for updates
    confirmPassword: '', // Added for validation
    role: 'admin',
    isActive: 'yes'
  });

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

  // Update filtered users when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(lowercaseQuery) ||
        user.role.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

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

      if (response.ok) {
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
      } else {
        setFormError(data.message || 'Failed to update user');
        console.error('Update failed:', data);
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
                    <div className="text-sm text-gray-600">Role: {user.role}</div>
                    <div className="text-sm text-gray-600">
                      Status: {user.is_active === 'yes' ? 'Active' : 'Inactive'}
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
              <h2 className="text-xl font-semibold mb-4">Edit User: {selectedUser.username}</h2>

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
                      <span>Active</span>
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
                      <span>Inactive</span>
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
    </div>
  );
}