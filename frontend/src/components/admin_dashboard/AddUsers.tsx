'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addUserSchema, type AddUserFormData } from '@/schemas/userForms';
import { ZodError } from 'zod';
import { useFetchWithCSRF } from '@/hooks/useFetchWithCSRF';

export default function AddUsersComponent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchWithCSRF, loading: csrfLoading } = useFetchWithCSRF();

  // Form state
  const [formData, setFormData] = useState<AddUserFormData>({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'admin', // Default role
    isActive: 'yes' // Default status
  });

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle form input changes (for text, select)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear validation error for this field when user starts typing
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
      // Validate form data against schema
      addUserSchema.parse(formData);
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

    // Clear previous states
    setError(null);
    setSuccess(false);

    // Check if CSRF token is still loading
    if (csrfLoading) {
      setError('Security token is still loading. Please try again in a moment.');
      return;
    }

    // Validate form using Zod
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API with sanitized inputs
      const userData = {
        username: sanitizeInput(formData.username),
        password: formData.password, // Don't sanitize password as it needs to be hashed
        role: formData.role,
        is_active: formData.isActive === 'yes' ? 'yes' : 'no' // Send as string 'yes' or 'no'
      };

      // Send POST request to the registration API endpoint with CSRF protection
      const response = await fetchWithCSRF('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if this is a DEO or VO user that requires additional details
        if (data.requiresAdditionalDetails && data.user && data.user.id) {
          // Log user data for debugging
          console.log('User created successfully:', data.user);
          console.log('User ID for redirection:', data.user.id);

          // Store the authentication token in localStorage
          if (data.token) {
            console.log('Storing authentication token in localStorage');
            localStorage.setItem('token', data.token);
          } else {
            console.warn('No token received from server');
          }

          // Store user ID and role for manual redirection if needed
          setCreatedUserId(data.user.id);
          setCreatedUserRole(data.user.role);

          // Show a temporary success message
          setSuccess(true);
          setError(null);

          // Show manual redirect button after 3 seconds if automatic redirection fails
          setTimeout(() => {
            setShowManualRedirect(true);
          }, 3000);

          // Redirect to the appropriate details page based on role after a short delay
          // This gives time for the success message to be seen and ensures the user creation is fully processed
          setTimeout(() => {
            // Add more debugging to see the exact role value
            console.log('User role for redirection check:', data.user.role);

            if (data.user.role === 'dataEntryOfficer' || data.user.role === 'deo') {
              // Use Next.js router for navigation
              console.log('Redirecting to DEO details page with userId:', data.user.id);
              try {
                router.push(`/admin_dashboard/add_users/deo_details?userId=${data.user.id}`);

                // Set a fallback in case router.push doesn't trigger navigation
                setTimeout(() => {
                  console.log('Fallback: Using window.location for DEO details redirection');
                  window.location.href = `/admin_dashboard/add_users/deo_details?userId=${data.user.id}`;
                }, 2000);
              } catch (error) {
                console.error('Router navigation error:', error);
                window.location.href = `/admin_dashboard/add_users/deo_details?userId=${data.user.id}`;
              }
            } else if (data.user.role === 'verificationOfficer' || data.user.role === 'vo') {
              // Use Next.js router for navigation
              console.log('Redirecting to VO details page with userId:', data.user.id);
              try {
                router.push(`/admin_dashboard/add_users/vo_details?userId=${data.user.id}`);

                // Set a fallback in case router.push doesn't trigger navigation
                setTimeout(() => {
                  console.log('Fallback: Using window.location for VO details redirection');
                  window.location.href = `/admin_dashboard/add_users/vo_details?userId=${data.user.id}`;
                }, 2000);
              } catch (error) {
                console.error('Router navigation error:', error);
                window.location.href = `/admin_dashboard/add_users/vo_details?userId=${data.user.id}`;
              }
            } else {
              // If role doesn't match any expected value, log it and try direct navigation
              console.error('Unexpected role value:', data.user.role);
              if (formData.role === 'deo') {
                window.location.href = `/admin_dashboard/add_users/deo_details?userId=${data.user.id}`;
              } else if (formData.role === 'vo') {
                window.location.href = `/admin_dashboard/add_users/vo_details?userId=${data.user.id}`;
              }
            }
          }, 1000); // 1 second delay
        } else {
          // For admin users, just show success and reset form
          setSuccess(true);
          // Reset form
          setFormData({
            username: '',
            password: '',
            confirmPassword: '',
            role: 'admin',
            isActive: 'yes'
          });
        }
      } else {
        // Handle validation errors from backend
        if (data.errors && Array.isArray(data.errors)) {
          // Format validation errors for display
          const errorMessage = data.errors.map((err: any) =>
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');
          setError(errorMessage || data.message || 'Failed to add user');
        } else {
          setError(data.message || 'Failed to add user');
        }

        console.error('Error response:', data);
      }
    } catch (err) {
      console.error('Error adding user:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // State for manual redirection
  const [createdUserId, setCreatedUserId] = useState<number | null>(null);
  const [createdUserRole, setCreatedUserRole] = useState<string | null>(null);
  const [showManualRedirect, setShowManualRedirect] = useState(false);

  // Function to handle manual redirection
  const handleManualRedirect = () => {
    if (createdUserId) {
      if (createdUserRole === 'dataEntryOfficer' || createdUserRole === 'deo') {
        window.location.href = `/admin_dashboard/add_users/deo_details?userId=${createdUserId}`;
      } else if (createdUserRole === 'verificationOfficer' || createdUserRole === 'vo') {
        window.location.href = `/admin_dashboard/add_users/vo_details?userId=${createdUserId}`;
      }
    }
  };

  // CSS Classes
  const containerClasses = "w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-32";
  const headerClasses = "text-2xl font-bold text-gray-800 mb-6 pb-2 border-b";
  const formClasses = "space-y-6";
  const formGroupClasses = "flex flex-col space-y-1";
  const labelClasses = "text-sm font-medium text-gray-700";
  const inputClasses = "px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const errorClasses = "text-sm text-red-600 mt-1";
  const buttonClasses = "w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors";
  const disabledButtonClasses = "w-full py-2 px-4 bg-gray-400 text-white font-medium rounded-md cursor-not-allowed";
  const radioGroupClasses = "flex space-x-6 mt-1";
  const radioLabelClasses = "flex items-center space-x-2 cursor-pointer";
  const radioInputClasses = "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300";
  const alertSuccessClasses = "p-4 mb-6 rounded-md bg-green-50 text-green-800 border border-green-200";
  const alertErrorClasses = "p-4 mb-6 rounded-md bg-red-50 text-red-800 border border-red-200";
  const backLinkClasses = "inline-flex items-center text-blue-600 hover:text-blue-800 mt-4";
  const manualRedirectButtonClasses = "mt-4 py-2 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors";



  return (
    <div className={containerClasses}>
      <h1 className={headerClasses}>Add New User</h1>

      <div className="mb-6 p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-md">
        <h3 className="font-medium mb-2">Two-Step Registration Process</h3>
        <p className="text-sm">
          When creating a <strong>Data Entry Officer</strong> or <strong>Verification Officer</strong> account,
          you will be redirected to a second form to provide additional details after the basic account is created.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className={alertSuccessClasses}>
          {formData.role === 'admin' ? (
            <>User added successfully!</>
          ) : (
            <>
              User added successfully! You will be redirected to add additional details...

              {/* Manual redirection button if automatic redirection fails */}
              {showManualRedirect && (
                <div className="mt-4">
                  <p className="text-sm mb-2">
                    If you are not redirected automatically, please click the button below:
                  </p>
                  <button
                    type="button"
                    onClick={handleManualRedirect}
                    className={manualRedirectButtonClasses}
                  >
                    Continue to Additional Details
                  </button>

                  {/* Direct link as a last resort */}
                  <div className="mt-2 text-sm">
                    <p>Or use this direct link:</p>
                    {createdUserRole === 'dataEntryOfficer' || createdUserRole === 'deo' ? (
                      <a
                        href={`/admin_dashboard/add_users/deo_details?userId=${createdUserId}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Go to DEO Details Form
                      </a>
                    ) : createdUserRole === 'verificationOfficer' || createdUserRole === 'vo' ? (
                      <a
                        href={`/admin_dashboard/add_users/vo_details?userId=${createdUserId}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Go to VO Details Form
                      </a>
                    ) : null}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={alertErrorClasses}>
          {error}
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

        {/* Password */}
        <div className={formGroupClasses}>
          <label htmlFor="password" className={labelClasses}>
            Password *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={inputClasses}
            placeholder="Enter password"
          />
          {validationErrors.password && (
            <p className={errorClasses}>{validationErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className={formGroupClasses}>
          <label htmlFor="confirmPassword" className={labelClasses}>
            Confirm Password *
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={inputClasses}
            placeholder="Confirm password"
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
          {loading ? 'Adding User...' : 'Add User'}
        </button>
      </form>

      {/* Back to Dashboard Link */}
      <Link href="/admin_dashboard" className={backLinkClasses}>
        ← Back to Dashboard
      </Link>
    </div>
  );
}