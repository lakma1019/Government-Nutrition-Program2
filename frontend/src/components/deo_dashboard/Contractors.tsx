'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Define interfaces for Supporter and Contractor data structure
interface Supporter {
  supporter_nic_number: string;
  supporter_name: string;
  supporter_contact_number: string;
  supporter_address?: string; // Made optional as it's not always required in form
  contractor_nic_number: string;
  created_at?: string; // Made optional
  updated_at?: string; // Made optional
}

interface Contractor {
  nic_number: string; // Primary identifier
  full_name: string;
  contact_number: string;
  address?: string; // Made optional
  agreement_start_date?: string; // Made optional
  agreement_end_date?: string; // Made optional
  has_supporter: 'yes' | 'no'; // Explicitly 'yes' or 'no'
  supporter?: Supporter | null; // Supporter details (optional, nested)
  created_at?: string; // Made optional
  updated_at?: string; // Made optional
}


export default function ContractorsManagement() {
  // State variables
  const [contractors, setContractors] = useState<Contractor[]>([]); // Full list of contractors fetched
  const [filteredContractors, setFilteredContractors] = useState<Contractor[]>([]); // List displayed after filtering
  // const [loading, setLoading] = useState(true); // Loading state (commented out in original)
  const [searchQuery, setSearchQuery] = useState(''); // Value of the search input
  // State for notification messages (success, error)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showForm, setShowForm] = useState(false); // Controls visibility of the add/edit form
  const [editMode, setEditMode] = useState(false); // True if editing, false if adding
  // State to hold the contractor data currently being edited
  const [currentContractor, setCurrentContractor] = useState<Contractor | null>(null);
  // State to control visibility of the delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // State to hold the NIC number of the contractor to be deleted
  const [contractorToDelete, setContractorToDelete] = useState<string | null>(null);
  // Get the current path for navigation highlighting
  const pathname = usePathname();

  // Form state for the add/edit form
  const [formData, setFormData] = useState({
    full_name: '',
    contact_number: '',
    address: '',
    nic_number: '',
    agreement_start_date: '',
    agreement_end_date: '',
    has_supporter: 'no' as 'yes' | 'no', // Ensure correct type
    supporter_name: '',
    supporter_contact_number: '',
    supporter_address: '',
    supporter_nic_number: ''
  });

  // Fetch contractors on component mount using useCallback
  const fetchContractors = useCallback(async () => {
    try {
      // setLoading(true); // Commented out as per original
      setContractors([]); // Initialize with empty arrays before fetching
      setFilteredContractors([]);

      // Try to fetch from backend
      try {
        console.log('Fetching contractors from backend...');

        // Testing database connection (as in original) - keep for debugging
        // console.log('Testing database connection...');
        // const testDbResponse = await fetch('http://localhost:3001/api/test-db');
        // const testDbData = await testDbResponse.json();
        // console.log('Database connection test result:', testDbData);
        // if (!testDbResponse.ok) {
        //   throw new Error(`Database connection failed: ${testDbData.message || 'Unknown error'}`);
        // }

        // Fetch the actual contractors, potentially including credentials in URL for test setup
        // Note: Passing credentials in URL params is INSECURE. Use proper authentication (Headers, Cookies, JWT) in production.
        console.log('Fetching actual contractors with dummy credentials...');
        const response = await fetch('http://localhost:3001/api/contractors?username=dataeo1&password=dataeo1123');
        console.log('Fetch response status:', response.status);

        // Read response text first for robust error handling
        const responseText = await response.text();
        console.log('Raw response from backend:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed response data:', data);
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          console.error('Response text was:', responseText);
          throw new Error('Invalid JSON response from server');
        }

        // Check for HTTP errors and API success flag
        if (!response.ok) {
           // If server responded with an error status (e.g., 401, 404, 500)
           throw new Error(`Failed to fetch contractors: ${response.status} - ${data.message || responseText}`);
        }

        if (data.success && Array.isArray(data.data)) {
          console.log('Fetched contractors from backend:', data.data);
          // Ensure has_supporter is 'yes' or 'no' and supporter is null or object
           const processedData = data.data.map((c: any) => ({
              ...c,
              has_supporter: c.has_supporter ? 'yes' : 'no', // Assuming backend sends boolean or truthy/falsy
              supporter: c.supporter_nic_number ? { // Assuming if supporter_nic_number exists, supporter object is valid
                  supporter_nic_number: c.supporter_nic_number,
                  supporter_name: c.supporter_name || '',
                  supporter_contact_number: c.supporter_contact_number || '',
                  supporter_address: c.supporter_address || '',
                  contractor_nic_number: c.nic_number, // Link supporter to contractor
                  created_at: c.supporter_created_at,
                  updated_at: c.supporter_updated_at
              } : null // Set supporter to null if no supporter NIC
           }));

          setContractors(processedData);
          setFilteredContractors(processedData);
          return; // Exit early if backend fetch was successful
        } else {
           // If response is OK (e.g., status 200) but success is false
          throw new Error(data.message || 'Failed to fetch contractors (API reported failure)');
        }
      } catch (backendError: any) {
        // Handle network errors or specific backend errors
        console.warn('Could not fetch from backend:', backendError);
        // Show error notification but continue with empty data
        showNotification('error', `Could not fetch contractors from the server: ${backendError.message || 'Network error'}.`);
        setContractors([]); // Ensure state is empty if fetch failed
        setFilteredContractors([]);
      }
    } catch (err: unknown) {
      // Handle unexpected errors during the process
      console.error('Unexpected error during fetchContractors:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `An unexpected error occurred: ${errorMessage}`);
    }
     // finally {
     //   setLoading(false); // Commented out as per original
     // }
  }, []); // Empty dependency array: fetchContractors only needs to be created once

  // Fetch contractors on component mount
  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]); // Dependency array includes fetchContractors (due to useCallback)


  // Filter contractors when search query or the contractors list changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContractors(contractors); // If search is empty, show all contractors
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      // Filter the list based on multiple fields
      const filtered = contractors.filter(contractor =>
        contractor.nic_number.toLowerCase().includes(lowercaseQuery) || // Search by contractor NIC
        contractor.full_name.toLowerCase().includes(lowercaseQuery) || // Search by contractor name
        (contractor.contact_number && contractor.contact_number.toLowerCase().includes(lowercaseQuery)) || // Search by contractor contact
        (contractor.address && contractor.address.toLowerCase().includes(lowercaseQuery)) || // Search by contractor address
        (contractor.supporter?.supporter_name && contractor.supporter.supporter_name.toLowerCase().includes(lowercaseQuery)) || // Search by supporter name
        (contractor.supporter?.supporter_nic_number && contractor.supporter.supporter_nic_number.toLowerCase().includes(lowercaseQuery)) // Search by supporter NIC
      );
      setFilteredContractors(filtered); // Update the filtered list
    }
  }, [searchQuery, contractors]); // Dependency array: filter whenever searchQuery or contractors list changes

  // Reset form data and state variables related to the form
  const resetForm = () => {
    setFormData({
      full_name: '',
      contact_number: '',
      address: '',
      nic_number: '',
      agreement_start_date: '',
      agreement_end_date: '',
      has_supporter: 'no', // Reset to 'no'
      supporter_name: '',
      supporter_contact_number: '',
      supporter_address: '',
      supporter_nic_number: ''
    });
    setEditMode(false); // Exit edit mode
    setCurrentContractor(null); // Clear current contractor data
  };

  // Handle form input changes (for text, textarea, select)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData, // Copy existing form data
      [name]: value // Update the specific field by name
    });
  };

  // Show notification message for a limited time
  const showNotification = (type: 'success' | 'error' | null, message: string) => {
    setNotification({ type, message }); // Set the notification state
    // Set a timeout to clear the notification after 5 seconds
    setTimeout(() => {
      setNotification({ type: null, message: '' });
    }, 5000);
  };

  // Format date string into a readable format (e.g., "March 15, 2024")
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return ''; // Return empty string if dateString is null or undefined
    try {
      // Attempt to create a Date object from the string
      const date = new Date(dateString);
      // Check if the created Date object is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return the original string if it's not a valid date
      }
      // Format the date using toLocaleDateString
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return the original string in case of any error
    }
  };

  // Handle form submission (Add or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission

    // Basic form validation
    if (!formData.full_name || !formData.contact_number || !formData.nic_number || !formData.address) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    // Validate supporter details if 'has_supporter' is 'yes'
    if (formData.has_supporter === 'yes' &&
        (!formData.supporter_name || !formData.supporter_contact_number || !formData.supporter_nic_number)) {
      showNotification('error', 'Please fill in all required supporter details');
      return;
    }

    try {
      if (editMode && currentContractor) {
        // --- Update Existing Contractor ---
        console.log('Attempting to update contractor:', currentContractor.nic_number);

        // Prepare the data to send to the backend for update
        // Include Data Entry Officer credentials (INSECURE in production via body/params - use auth headers)
        const dataToUpdate = {
          ...formData, // Send all form data
          username: 'dataeo1', // Dummy credential
          password: 'dataeo1123'  // Dummy credential
        };

        console.log('Sending update data with credentials:', dataToUpdate);

        // Send PUT request to the backend update endpoint
        const response = await fetch(`http://localhost:3001/api/contractors/${currentContractor.nic_number}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToUpdate), // Send data as JSON string
        });

         // Read response text first for robust error handling
        const responseText = await response.text();
        console.log('Update response text:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed update response data:', data);
        } catch (parseError) {
           console.error('Error parsing update response as JSON:', parseError);
           throw new Error(`Server returned invalid JSON: ${responseText}`);
        }


        // Check if the HTTP response was successful and API indicates success
        if (!response.ok) {
           throw new Error(`Server returned ${response.status}: ${data.message || responseText}`);
        }

        if (data.success) {
          console.log('Contractor updated in database successfully:', data);
          showNotification('success', data.message || 'Contractor updated successfully!');
          fetchContractors(); // Refresh the contractors list from the server
        } else {
           // Server responded with OK but success: false
          throw new Error(data.message || 'Failed to update contractor');
        }
      } else {
        // --- Add New Contractor ---
        console.log('Attempting to add new contractor:', formData.nic_number);

        // Prepare the data to send to the backend for adding
        // Include Data Entry Officer credentials (INSECURE)
        const dataToAdd = {
          ...formData, // Send all form data
          username: 'dataeo1', // Dummy credential
          password: 'dataeo1123'  // Dummy credential
        };

        console.log('Sending add data with credentials:', dataToAdd);

        // Send POST request to the backend add endpoint
        const response = await fetch('http://localhost:3001/api/contractors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToAdd), // Send data as JSON string
        });

         // Read response text first for robust error handling
        const responseText = await response.text();
        console.log('Add response text:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed add response data:', data);
        } catch (parseError) {
           console.error('Error parsing add response as JSON:', parseError);
           throw new Error(`Server returned invalid JSON: ${responseText}`);
        }

        // Check if the HTTP response was successful and API indicates success
        if (!response.ok) {
           throw new Error(`Server returned ${response.status}: ${data.message || responseText}`);
        }

        if (data.success) {
          console.log('Contractor added to database successfully:', data);
          showNotification('success', data.message || 'Contractor added successfully!');
          fetchContractors(); // Refresh the contractors list from the server
        } else {
           // Server responded with OK but success: false
          throw new Error(data.message || 'Failed to add contractor');
        }
      }

      // Reset form state and close the form after successful backend operation
      resetForm();
      setShowForm(false);

    } catch (err: unknown) {
      // Catch any errors during the fetch/save process
      console.error('Error saving contractor:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Failed to save contractor: ${errorMessage}`);
    }
  };

  // Handle click on the "Edit" button
  const handleEdit = (contractor: Contractor) => {
    setCurrentContractor(contractor); // Set the contractor data to be edited
    // Populate the form state with the contractor's current details
    setFormData({
      full_name: contractor.full_name,
      contact_number: contractor.contact_number,
      address: contractor.address || '', // Handle optional address
      nic_number: contractor.nic_number,
      agreement_start_date: contractor.agreement_start_date || '', // Handle optional dates
      agreement_end_date: contractor.agreement_end_date || '',
      has_supporter: contractor.has_supporter || 'no', // Handle optional has_supporter
      supporter_name: contractor.supporter?.supporter_name || '', // Handle nested optional supporter details
      supporter_contact_number: contractor.supporter?.supporter_contact_number || '',
      supporter_address: contractor.supporter?.supporter_address || '',
      supporter_nic_number: contractor.supporter?.supporter_nic_number || ''
    });
    setEditMode(true); // Set edit mode to true
    setShowForm(true); // Show the form
  };

  // Handle click on the "Delete" button
  const handleDelete = (nicNumber: string) => {
    setContractorToDelete(nicNumber); // Store the NIC of the contractor to delete
    setShowDeleteConfirm(true); // Show the delete confirmation modal
  };

  // Confirm deletion after the modal is shown
  const confirmDelete = async () => {
    // Ensure contractorToDelete is not null before proceeding
    if (contractorToDelete === null) {
       setShowDeleteConfirm(false); // Hide modal
       showNotification('error', 'No contractor selected for deletion.');
       return;
    }

    setShowDeleteConfirm(false); // Hide the confirmation modal immediately
    showNotification(null, ''); // Clear previous notifications
    // setLoading(true); // Uncomment if using loading state

    try {
      console.log('Attempting to delete contractor from backend:', contractorToDelete);

      // Send DELETE request to the backend endpoint
      // Note: Passing credentials in URL params is INSECURE.
      const response = await fetch(`http://localhost:3001/api/contractors/${contractorToDelete}?username=dataeo1&password=dataeo1123`, {
        method: 'DELETE',
      });

       // Read response text first for robust error handling
      const responseText = await response.text();
      console.log('Delete response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed delete response data:', data);
      } catch (parseError) {
         console.error('Error parsing delete response as JSON:', parseError);
         throw new Error(`Server returned invalid JSON: ${responseText}`);
      }


      // Check if the HTTP response was successful and API indicates success
      if (!response.ok) {
         throw new Error(`Server returned ${response.status}: ${data.message || responseText}`);
      }

      if (data.success) {
        console.log('Contractor deleted from database successfully:', data);
        showNotification('success', data.message || 'Contractor deleted successfully!');
        fetchContractors(); // Refresh the contractors list from the server
      } else {
         // Server responded with OK but success: false
        throw new Error(data.message || 'Failed to delete contractor');
      }
    } catch (err: unknown) {
      // Catch any errors during the fetch/delete process
      console.error('Error deleting contractor:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Failed to delete contractor: ${errorMessage}`);

       // If deletion failed on server, potentially revert local state if it was optimistically updated earlier
       // (In this code, local state isn't deleted until success, so no revert needed)

    }
     // finally {
     //   setLoading(false); // Uncomment if using loading state
     //   setContractorToDelete(null); // Clear the contractorToDelete state
     // }
  };

  // Format contract period display string
  const formatContractPeriod = (startDate: string | undefined, endDate: string | undefined): string => {
    // Use the existing formatDate helper
    const formattedStart = formatDate(startDate);
    const formattedEnd = formatDate(endDate);

    if (!formattedStart && !formattedEnd) return 'Not specified';
    if (formattedStart && !formattedEnd) return `From ${formattedStart}`;
    if (!formattedStart && formattedEnd) return `Until ${formattedEnd}`;
    return `${formattedStart} - ${formattedEnd}`; // Both dates are available and valid
  };


  // --- Tailwind Class Mapping ---
  // Container and general layout
  // Mapping rgb(235, 217, 235) to bg-[#ebd9eb]
  const containerClasses = "w-full min-h-screen flex flex-col bg-[#ebd9eb] font-sans";

  // Navigation Bar (reused from DEO_login)
  // Mapping #e6b3d9 to bg-[#e6b3d9]
  // Mapping #333 to text-gray-800
  // Mapping #f0e0f0 to hover:bg-[#f0e0f0]
  // Mapping #d070d0 to border-[#d070d0]
  const navbarClasses = "flex justify-between items-center py-4 px-6 mb-5 bg-[#e6b3d9] rounded-lg shadow-md";
  const brandClasses = "text-xl font-bold text-gray-800";
  const navLinksClasses = "flex space-x-4";
  const navLinkBaseClasses = "inline-flex group"; // Group for hover effect on span
  const linkTextBaseClasses = "inline-block py-1.5 px-4 bg-white rounded-full text-black text-sm font-bold transition-all duration-200 ease-in-out";
  const linkTextHoverClasses = "group-hover:bg-[#f0e0f0]";
  const linkTextHighlightClasses = "bg-[#f0e0f0] border-2 border-[#d070d0] !text-black";

  // Main Content area
  const mainContentClasses = "flex-1 p-8 max-w-screen-xl mx-auto w-full"; // Max width, center horizontally, padding

  // Page Header
  // Mapping #6b21a8 to text-purple-800
  const pageHeaderClasses = "mb-8"; // Margin bottom
  const pageHeaderH1Classes = "text-purple-800 text-2xl font-bold mb-1"; // Color, size, weight, margin
  const pageHeaderPClasses = "text-gray-600 text-base"; // Color, size

  // Controls Section (Search and Add Button)
  const controlsSectionClasses = "flex justify-between items-center mb-8 flex-wrap gap-4"; // Flex properties, margin, wrap, gap

  // Search Container
  const searchContainerClasses = "flex items-center w-full max-w-md border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm flex-grow"; // Flex properties, width, border, rounded, overflow, bg, shadow, grow
  const searchInputClasses = "flex-1 py-2.5 px-3 border-none outline-none text-sm"; // Flex-1, padding, border/outline none, size
  const searchButtonClasses = "bg-gray-100 border-none py-2.5 px-4 cursor-pointer transition-colors duration-300 hover:bg-gray-200 text-gray-600"; // Background, border none, padding, cursor, transition, hover, color
  const searchIconClasses = "text-base"; // Size

  // Add Button
  // Mapping #6b21a8 to bg-purple-800
  // Mapping #4c1d95 to hover:bg-purple-900
  const addButtonClasses = "py-2.5 px-6 bg-purple-800 text-white border-none rounded-md cursor-pointer font-semibold transition-colors duration-300 hover:bg-purple-900"; // Padding, bg, text, border none, rounded, cursor, weight, transition, hover

  // Notification Styles (reused from DeleteUserPage)
  const notificationBaseClasses = "flex items-center p-4 my-2 rounded-lg shadow-sm animate-slideIn relative";
  const notificationSuccessClasses = `${notificationBaseClasses} bg-green-100 border-l-4 border-green-500 text-green-800`;
  const notificationErrorClasses = `${notificationBaseClasses} bg-red-100 border-l-4 border-red-500 text-red-800`;
  const notificationIconClasses = "mr-3 text-xl";
  const closeNotificationClasses = "absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none text-xl cursor-pointer opacity-60 hover:opacity-100";

  // Form Container
  const formContainerClasses = "bg-white rounded-lg shadow-md mb-8 overflow-hidden"; // Background, rounded, shadow, margin bottom, overflow
  const formHeaderClasses = "flex justify-between items-center p-6 border-b border-gray-200"; // Flex properties, padding, border bottom, border color
  const formHeaderH2Classes = "m-0 text-xl font-semibold text-purple-800"; // Margin 0, size, weight, color
  const closeFormClasses = "bg-none border-none text-2xl cursor-pointer text-gray-600 hover:text-red-600"; // Background none, border none, size, cursor, color, hover

  // Contractor Form
  const contractorFormClasses = "p-6"; // Padding

  const formRowClasses = "flex flex-col md:flex-row gap-4 mb-4"; // Responsive flex direction, gap, margin bottom
  const formGroupClasses = "flex-1 mb-4 md:mb-0"; // Flex-1, responsive margin bottom

  const formLabelClasses = "block mb-1.5 font-medium text-gray-700 text-sm"; // Display block, margin bottom, weight, color, size
  const formInputBaseClasses = "w-full py-2.5 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-800 focus:ring focus:ring-purple-800/20"; // Width, padding, border, rounded, size, focus styles with ring

  // Supporter Section
  const supporterSectionClasses = "mt-4 p-6 bg-purple-50 rounded-lg border-l-4 border-purple-700"; // Margin top, padding, bg, rounded, border left, border color
  const supporterSectionH3Classes = "text-purple-800 mb-4 text-lg font-semibold"; // Color, margin bottom, size, weight

  // Form Actions
  const formActionsClasses = "flex justify-end gap-4 mt-6"; // Flex properties, justify end, gap, margin top

  // Save and Cancel Buttons
  const saveButtonClasses = "py-2.5 px-6 bg-purple-800 text-white border-none rounded-md cursor-pointer font-semibold transition-colors duration-300 hover:bg-purple-900"; // Padding, bg, text, border none, rounded, cursor, weight, transition, hover
  const cancelButtonClasses = "py-2.5 px-6 bg-gray-200 text-gray-800 border border-gray-300 rounded-md cursor-pointer font-semibold transition-colors duration-300 hover:bg-gray-300"; // Padding, bg, text, border, rounded, cursor, weight, transition, hover

  // Table Container
  const tableContainerClasses = "bg-white rounded-lg shadow-md overflow-hidden"; // Background, rounded, shadow, overflow

  // Contractors Table
  const contractorsTableClasses = "w-full border-collapse"; // Width, border collapse

  const tableHeaderCellClasses = "px-6 py-3 text-left border-b border-gray-200 bg-purple-100 font-semibold text-purple-800 text-sm uppercase tracking-wider"; // Padding, text align, border bottom, bg, weight, color, size, uppercase, tracking
  const tableDataCellClasses = "px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-200"; // Padding, whitespace, size, color, border bottom

  const tableRowHoverClasses = "hover:bg-gray-50"; // Hover background color

  // Status Badge
  const statusBadgeBaseClasses = "inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"; // Inline block, padding, rounded full, size, weight
  const statusBadgeActiveClasses = `${statusBadgeBaseClasses} bg-green-100 text-green-800`; // Bg, text color
  const statusBadgeInactiveClasses = `${statusBadgeBaseClasses} bg-red-100 text-red-800`; // Bg, text color (using red for 'No')
  // Add other status badges if needed, e.g., blacklisted, pending

  // Actions Cell
  const actionsCellClasses = "px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2"; // Padding, whitespace, text align, size, weight, flex, gap

  // Action Buttons (View, Edit, Delete)
  const actionButtonBaseClasses = "inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150"; // Base styles
  const actionButtonViewClasses = `${actionButtonBaseClasses} bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500`; // Bg, text, hover, focus ring
  const actionButtonEditClasses = `${actionButtonBaseClasses} bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500`; // Bg, text, hover, focus ring (using yellow for edit)
  const actionButtonDeleteClasses = `${actionButtonBaseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`; // Bg, text, hover, focus ring

  // No Data message in table
  const noDataCellClasses = "px-6 py-4 text-center text-gray-500 italic"; // Padding, text align, color, italic, colSpan handled in JSX

  // Modal Styles (reused from DeleteUserPage, adjusted colors)
  const modalOverlayClasses = "fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm";
  const modalContentClasses = "bg-white rounded-lg w-11/12 max-w-sm shadow-xl overflow-hidden"; // Adjusted max-width
  const modalHeaderClasses = "bg-gray-100 py-4 px-5 border-b border-gray-200 flex justify-between items-center";
  const modalHeaderH2Classes = "m-0 text-lg font-semibold text-gray-800";
  const closeModalClasses = "bg-none border-none text-2xl cursor-pointer text-gray-600 hover:text-red-600";

  const modalBodyClasses = "p-6 text-gray-700 text-sm";
  const modalFormActionsClasses = "flex justify-end gap-3 mt-4";

  const deleteConfirmButtonClasses = `${actionButtonBaseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`; // Reused action button base
  const modalCancelButtonClasses = `${actionButtonBaseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-200`; // Reused action button base


  return (
    <div className={containerClasses}>
      {/* Navigation Bar */}
      <nav className={navbarClasses}>
        <div className={brandClasses}>Government Nutrition Program</div>
        <div className={navLinksClasses}>
          <Link href="/DEO_login" className={`${navLinkBaseClasses} ${pathname === "/DEO_login" ? linkTextHighlightClasses : ""}`}>
            <span className={linkTextBaseClasses}>Dashboard</span>
          </Link>
          <Link href="/DEO_login/DEO_contractors" className={`${navLinkBaseClasses} ${pathname === "/DEO_login/DEO_contractors" ? linkTextHighlightClasses : ""}`}>
            <span className={linkTextBaseClasses}>Contractors</span>
          </Link>
          <Link href="/login" className={navLinkBaseClasses}>
            <span className={linkTextBaseClasses}>Logout</span>
          </Link>
        </div>
      </nav>

      <div className={mainContentClasses}>
        <div className={pageHeaderClasses}>
          <h1 className={pageHeaderH1Classes}>Contractors Management</h1>
          <p className={pageHeaderPClasses}>Manage contractor information and agreements</p> {/* Adjusted text */}
        </div>

        {/* Search and Add Section */}
        <div className={controlsSectionClasses}>
          <div className={searchContainerClasses}>
            <input
              type="text"
              placeholder="Search by NIC number, name, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={searchInputClasses}
            />
            {/* Search button doesn't trigger search directly, filtering is reactive */}
            <button className={searchButtonClasses}>
              <span className={searchIconClasses}>🔍</span>
            </button>
          </div>
          <button
            className={addButtonClasses}
            onClick={() => {
              resetForm(); // Reset form for new entry
              setShowForm(true); // Show the form
            }}
          >
            Add New Contractor
          </button>
        </div>

        {/* Notification Message */}
        {notification.type && (
          <div className={`${notificationBaseClasses} ${notification.type === 'success' ? notificationSuccessClasses : notificationErrorClasses}`}>
            <span className={notificationIconClasses}>
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="flex-grow">{notification.message}</span>
            <button
              className={closeNotificationClasses}
              onClick={() => setNotification({type: null, message: ''})}
            >
              ×
            </button>
          </div>
        )}

        {/* Contractor Form (Add/Edit) */}
        {showForm && (
          <div className={formContainerClasses}>
            <div className={formHeaderClasses}>
              <h2 className={formHeaderH2Classes}>{editMode ? 'Edit Contractor' : 'Add New Contractor'}</h2>
              <button
                className={closeFormClasses}
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <form className={contractorFormClasses} onSubmit={handleSubmit}>
              {/* Contractor Details */}
              <div className={formRowClasses}>
                <div className={formGroupClasses}>
                  <label htmlFor="full_name" className={formLabelClasses}>Full Name*</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    className={formInputBaseClasses}
                  />
                </div>
                <div className={formGroupClasses}>
                  <label htmlFor="contact_number" className={formLabelClasses}>Contact Number*</label>
                  <input
                    type="tel" // Use tel type for contact number
                    id="contact_number"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleInputChange}
                    required
                     pattern="[0-9]{10}" // Basic 10-digit pattern
                     title="Enter a 10-digit phone number"
                    className={formInputBaseClasses}
                  />
                </div>
              </div>

              <div className={formGroupClasses}> {/* This is not in a form-row */}
                <label htmlFor="address" className={formLabelClasses}>Address*</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  required
                  className={`${formInputBaseClasses} resize-y`} // Reuse base + add resize
                />
              </div>

              <div className={formRowClasses}>
                <div className={formGroupClasses}>
                  <label htmlFor="nic_number" className={formLabelClasses}>NIC Number*</label>
                  <input
                    type="text"
                    id="nic_number"
                    name="nic_number"
                    value={formData.nic_number}
                    onChange={handleInputChange}
                    required
                     pattern="[0-9]{9}[vVxX]|[0-9]{12}" // Basic NIC pattern
                     title="Enter a valid NIC number (e.g., 123456789V or 199012345678)"
                    className={formInputBaseClasses}
                    disabled={editMode} // Disable NIC input in edit mode
                  />
                   {editMode && <p className="text-xs text-gray-500 mt-1">NIC Number cannot be changed in edit mode.</p>}
                </div>
                 <div className={formGroupClasses}>
                   <label htmlFor="has_supporter" className={formLabelClasses}>Has Supporter?</label> {/* Added "?" */}
                   <select
                     id="has_supporter"
                     name="has_supporter"
                     value={formData.has_supporter}
                     onChange={handleInputChange}
                     className={formInputBaseClasses} // Reuse base styles
                   >
                     <option value="no">No</option>
                     <option value="yes">Yes</option>
                   </select>
                 </div>
              </div>

               <div className={formRowClasses}> {/* Added dates into a form-row */}
                 <div className={formGroupClasses}>
                   <label htmlFor="agreement_start_date" className={formLabelClasses}>Agreement Start Date</label>
                   <input
                     type="date"
                     id="agreement_start_date"
                     name="agreement_start_date"
                     value={formData.agreement_start_date}
                     onChange={handleInputChange}
                     className={formInputBaseClasses} // Reuse base styles
                   />
                 </div>
                 <div className={formGroupClasses}>
                   <label htmlFor="agreement_end_date" className={formLabelClasses}>Agreement End Date</label>
                   <input
                     type="date"
                     id="agreement_end_date"
                     name="agreement_end_date"
                     value={formData.agreement_end_date}
                     onChange={handleInputChange}
                     className={formInputBaseClasses} // Reuse base styles
                   />
                 </div>
               </div>


              {/* Supporter Details Section (conditionally rendered) */}
              {formData.has_supporter === 'yes' && (
                <div className={supporterSectionClasses}>
                  <h3 className={supporterSectionH3Classes}>Supporter Details</h3>

                  <div className={formRowClasses}>
                    <div className={formGroupClasses}>
                      <label htmlFor="supporter_name" className={formLabelClasses}>Supporter Name*</label>
                      <input
                        type="text"
                        id="supporter_name"
                        name="supporter_name"
                        value={formData.supporter_name}
                        onChange={handleInputChange}
                        required={formData.has_supporter === 'yes'} // Required only if has_supporter is yes
                        className={formInputBaseClasses} // Reuse base styles
                      />
                    </div>
                    <div className={formGroupClasses}>
                      <label htmlFor="supporter_contact_number" className={formLabelClasses}>Supporter Contact Number*</label>
                      <input
                        type="tel" // Use tel type
                        id="supporter_contact_number"
                        name="supporter_contact_number"
                        value={formData.supporter_contact_number}
                        onChange={handleInputChange}
                        required={formData.has_supporter === 'yes'}
                         pattern="[0-9]{10}" // Basic 10-digit pattern
                         title="Enter a 10-digit phone number"
                        className={formInputBaseClasses} // Reuse base styles
                      />
                    </div>
                  </div>

                  <div className={formGroupClasses}> {/* This is not in a form-row */}
                    <label htmlFor="supporter_address" className={formLabelClasses}>Supporter Address</label>
                    <textarea
                      id="supporter_address"
                      name="supporter_address"
                      value={formData.supporter_address}
                      onChange={handleInputChange}
                      rows={2}
                       // Not required in original, keep optional
                      className={`${formInputBaseClasses} resize-y`} // Reuse base + resize
                    />
                  </div>

                  <div className={formRowClasses}>
                    <div className={formGroupClasses}>
                      <label htmlFor="supporter_nic_number" className={formLabelClasses}>Supporter NIC Number*</label>
                      <input
                        type="text"
                        id="supporter_nic_number"
                        name="supporter_nic_number"
                        value={formData.supporter_nic_number}
                        onChange={handleInputChange}
                        required={formData.has_supporter === 'yes'}
                         pattern="[0-9]{9}[vVxX]|[0-9]{12}" // Basic NIC pattern
                         title="Enter a valid NIC number (e.g., 123456789V or 199012345678)"
                        className={formInputBaseClasses} // Reuse base styles
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className={formActionsClasses}>
                <button
                  type="submit"
                  className={saveButtonClasses}
                >
                  {editMode ? 'Update Contractor' : 'Save Contractor'}
                </button>
                <button
                  type="button"
                  className={cancelButtonClasses}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Contractors Table */}
        <div className={tableContainerClasses}>
          <table className={contractorsTableClasses}>
            <thead>
              <tr>
                <th className={tableHeaderCellClasses}>Full Name</th>
                <th className={tableHeaderCellClasses}>Contact Number</th>
                <th className={tableHeaderCellClasses}>NIC Number</th>
                <th className={tableHeaderCellClasses}>Agreement Period</th>
                <th className={tableHeaderCellClasses}>Has Supporter</th>
                <th className={`${tableHeaderCellClasses} text-right`}>Actions</th> {/* Align actions header right */}
              </tr>
            </thead>
            <tbody>
              {/* Map over filtered contractors to display rows */}
              {filteredContractors.map((contractor) => (
                <tr key={contractor.nic_number} className={tableRowHoverClasses}>
                  <td className={tableDataCellClasses}>{contractor.full_name}</td>
                  <td className={tableDataCellClasses}>{contractor.contact_number}</td>
                  <td className={tableDataCellClasses}>{contractor.nic_number}</td>
                  <td className={tableDataCellClasses}>{formatContractPeriod(contractor.agreement_start_date, contractor.agreement_end_date)}</td>
                  <td className={tableDataCellClasses}>
                    {/* Status badge based on has_supporter */}
                    {contractor.has_supporter === 'yes' ? (
                      <span className={statusBadgeActiveClasses}>Yes</span>
                    ) : (
                      <span className={statusBadgeInactiveClasses}>No</span> {/* Use inactive style for 'No' */}
                    )}
                  </td>
                  <td className={actionsCellClasses}> {/* Use flex and gap for action buttons */}
                    {/* View Agreement Details Link */}
                    <Link href={`/DEO_login/DEO_contractors/${contractor.nic_number}`} className={actionButtonViewClasses}> {/* Updated link path */}
                      Agreement Details
                    </Link>
                    {/* Edit Button */}
                    <button
                      type="button" // Explicitly type="button"
                      className={actionButtonEditClasses}
                      onClick={() => handleEdit(contractor)}
                    >
                      Edit
                    </button>
                    {/* Delete Button */}
                    <button
                      type="button" // Explicitly type="button"
                      className={actionButtonDeleteClasses}
                      onClick={() => handleDelete(contractor.nic_number)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {/* Display message if no contractors are found */}
              {filteredContractors.length === 0 && (
                <tr>
                  <td colSpan={6} className={noDataCellClasses}> {/* Colspan spans all columns */}
                    No contractors found. {searchQuery ? 'Try a different search term.' : 'Add a new contractor to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className={modalOverlayClasses}>
              <div className={modalContentClasses}>
                <div className={modalHeaderClasses}>
                  <h2 className={modalHeaderH2Classes}>Confirm Deletion</h2>
                  <button
                    className={closeModalClasses}
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    ×
                  </button>
                </div>
                <div className={modalBodyClasses}>
                  <p className="mb-4">Are you sure you want to delete this contractor? This action cannot be undone.</p>
                  {/* Display contractor info in the confirmation */}
                  {contractorToDelete && (
                      <p className="font-semibold">
                         Contractor NIC: <span className="font-normal">{contractorToDelete}</span>
                      </p>
                   )}
                  <div className={modalFormActionsClasses}> {/* Reuse modal actions styling */}
                    {/* Confirm Delete Button */}
                    <button
                      type="button" // Explicitly type="button"
                      className={deleteConfirmButtonClasses}
                      onClick={confirmDelete}
                    >
                      Delete Contractor
                    </button>
                    {/* Cancel Button */}
                    <button
                      type="button" // Explicitly type="button"
                      className={modalCancelButtonClasses}
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* The original <style jsx> and <style jsx global> blocks are removed */}
      {/* Ensure you have Tailwind CSS configured globally in your project */}
       {/* Add required animations (slideIn) and maybe global base styles in your main CSS file */}
    </div>
  );
}