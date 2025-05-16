'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AddUsersComponent() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
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

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Username validation
    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous states
    setError(null);
    setSuccess(false);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API
      const userData = {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        is_active: formData.isActive === 'yes' ? 'yes' : 'no' // Send as string 'yes' or 'no'
      };

      // Send POST request to the registration API endpoint
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Reset form
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          role: 'admin',
          isActive: 'yes'
        });
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

  return (
    <div className={containerClasses}>
      <h1 className={headerClasses}>Add New User</h1>

      {/* Success Message */}
      {success && (
        <div className={alertSuccessClasses}>
          User added successfully!
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