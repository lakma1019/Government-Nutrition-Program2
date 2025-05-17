'use client';

import { useState, useEffect } from 'react';
import { voDetailsSchema, type VODetailsFormData } from '@/schemas/userDetailsForm';
import { ZodError } from 'zod';
import { useFetchWithCSRF } from '@/hooks/useFetchWithCSRF';

interface VODetailsFormProps {
  userId: number;
  onSuccess: () => void;
  onCancel: () => void;
  mode?: 'add' | 'edit'; // Default is 'add'
}

export default function VODetailsForm({ userId, onSuccess, onCancel, mode = 'add' }: VODetailsFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(mode === 'edit');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchWithCSRF, loading: csrfLoading } = useFetchWithCSRF();

  // Form state
  const [formData, setFormData] = useState<VODetailsFormData>({
    userId: userId,
    fullName: '',
    nicNumber: '',
    telNumber: '',
    address: '',
    isActive: 'yes' // Default status
  });

  // Fetch existing details if in edit mode
  useEffect(() => {
    if (mode === 'edit') {
      fetchVODetails();
    }
  }, [userId, mode]);

  // Function to fetch VO details
  const fetchVODetails = async () => {
    setFetchLoading(true);
    setError(null);

    try {
      // Get auth token
      const authToken = localStorage.getItem('token');

      // Fetch VO details
      const response = await fetch(`http://localhost:3001/api/user-details/vo/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? {
            'Authorization': `Bearer ${authToken}`,
            'x-auth-token': authToken
          } : {})
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Set form data with existing details
        const voDetails = data.userDetails.voDetails;
        setFormData({
          userId: userId,
          fullName: voDetails.full_name || '',
          nicNumber: voDetails.nic_number || '',
          telNumber: voDetails.tel_number || '',
          address: voDetails.address || '',
          isActive: voDetails.is_active || 'yes'
        });
      } else {
        // If details not found but we're in edit mode, show error
        setError(data.message || 'Failed to fetch VO details');
      }
    } catch (err) {
      console.error('Error fetching VO details:', err);
      setError('An unexpected error occurred while fetching details.');
    } finally {
      setFetchLoading(false);
    }
  };

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle form input changes (for text, select)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      voDetailsSchema.parse(formData);
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

    // Check for authentication token
    const authToken = localStorage.getItem('token');
    console.log('Auth token available:', authToken ? 'Yes' : 'No');

    if (!authToken) {
      console.error('No authentication token found in localStorage');
      // Try to get it from user data
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          if (parsedUserData.token) {
            localStorage.setItem('token', parsedUserData.token);
            console.log('Token retrieved from user data and stored');
          } else {
            console.error('No token in user data either');
            setError('Authentication token missing. Please go back and log in again.');
            return;
          }
        } else {
          setError('User data missing. Please go back and log in again.');
          return;
        }
      } catch (error) {
        console.error('Error retrieving token from user data:', error);
        setError('Authentication error. Please go back and log in again.');
        return;
      }
    }

    // Validate form using Zod
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API with sanitized inputs
      const voData = {
        user_id: formData.userId,
        full_name: sanitizeInput(formData.fullName),
        nic_number: sanitizeInput(formData.nicNumber),
        tel_number: formData.telNumber ? sanitizeInput(formData.telNumber) : undefined,
        address: formData.address ? sanitizeInput(formData.address) : undefined,
        is_active: formData.isActive
      };

      // Get auth token
      const authToken = localStorage.getItem('token');

      // Determine the API endpoint and method based on mode
      const url = mode === 'edit'
        ? `http://localhost:3001/api/user-details/vo/${userId}`
        : 'http://localhost:3001/api/user-details/vo';

      const method = mode === 'edit' ? 'PUT' : 'POST';

      // Send request to the VO details API endpoint with CSRF protection
      const response = await fetchWithCSRF(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          // Add auth token directly to headers as well
          ...(authToken ? {
            'Authorization': `Bearer ${authToken}`,
            'x-auth-token': authToken
          } : {})
        },
        body: JSON.stringify(voData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Call the onSuccess callback
        onSuccess();
      } else {
        // Handle validation errors from backend
        if (data.errors && Array.isArray(data.errors)) {
          // Format validation errors for display
          const errorMessage = data.errors.map((err: any) =>
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');
          setError(errorMessage || data.message || 'Failed to add VO details');
        } else {
          setError(data.message || 'Failed to add VO details');
        }

        console.error('Error response:', data);
      }
    } catch (err) {
      console.error('Error adding VO details:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // CSS classes
  const containerClasses = "max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md";
  const headerClasses = "text-2xl font-bold text-gray-800 mb-6";
  const formClasses = "space-y-6";
  const formGroupClasses = "flex flex-col space-y-2";
  const labelClasses = "text-sm font-medium text-gray-700";
  const inputClasses = "px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
  const textareaClasses = "px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]";
  const errorClasses = "text-sm text-red-600";
  const buttonClasses = "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
  const disabledButtonClasses = "px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed";
  const cancelButtonClasses = "px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2";
  const alertSuccessClasses = "p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg";
  const alertErrorClasses = "p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg";
  const radioGroupClasses = "flex space-x-6 mt-1";
  const radioLabelClasses = "flex items-center space-x-2 cursor-pointer";
  const radioInputClasses = "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300";

  return (
    <div className={containerClasses}>
      <h1 className={headerClasses}>
        {mode === 'edit' ? 'Edit Verification Officer Details' : 'Add Verification Officer Details'}
      </h1>

      {/* Loading Message */}
      {fetchLoading && (
        <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg">
          Loading details...
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className={alertSuccessClasses}>
          VO details {mode === 'edit' ? 'updated' : 'added'} successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={alertErrorClasses}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={formClasses}>
        {/* Full Name */}
        <div className={formGroupClasses}>
          <label htmlFor="fullName" className={labelClasses}>
            Full Name *
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className={inputClasses}
            placeholder="Enter full name"
          />
          {validationErrors.fullName && (
            <p className={errorClasses}>{validationErrors.fullName}</p>
          )}
        </div>

        {/* NIC Number */}
        <div className={formGroupClasses}>
          <label htmlFor="nicNumber" className={labelClasses}>
            NIC Number *
          </label>
          <input
            type="text"
            id="nicNumber"
            name="nicNumber"
            value={formData.nicNumber}
            onChange={handleInputChange}
            className={inputClasses}
            placeholder="Enter NIC number"
          />
          {validationErrors.nicNumber && (
            <p className={errorClasses}>{validationErrors.nicNumber}</p>
          )}
        </div>

        {/* Telephone Number */}
        <div className={formGroupClasses}>
          <label htmlFor="telNumber" className={labelClasses}>
            Telephone Number
          </label>
          <input
            type="text"
            id="telNumber"
            name="telNumber"
            value={formData.telNumber}
            onChange={handleInputChange}
            className={inputClasses}
            placeholder="Enter telephone number"
          />
          {validationErrors.telNumber && (
            <p className={errorClasses}>{validationErrors.telNumber}</p>
          )}
        </div>

        {/* Address */}
        <div className={formGroupClasses}>
          <label htmlFor="address" className={labelClasses}>
            Address
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className={textareaClasses}
            placeholder="Enter address"
          />
          {validationErrors.address && (
            <p className={errorClasses}>{validationErrors.address}</p>
          )}
        </div>

        {/* Status */}
        <div className={formGroupClasses}>
          <label className={labelClasses}>Status</label>
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

        {/* Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            className={loading ? disabledButtonClasses : buttonClasses}
            disabled={loading || fetchLoading}
          >
            {loading ? 'Saving...' : mode === 'edit' ? 'Update Details' : 'Save Details'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={cancelButtonClasses}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
