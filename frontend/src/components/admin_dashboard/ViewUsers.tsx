'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DeleteUserPage() {
  // State for sidebar active item
  const [activeMenuItem, setActiveMenuItem] = useState('delete');
  // State for the search input value
  const [searchQuery, setSearchQuery] = useState('');
  // State to hold the user data found by the search
  const [searchResults, setSearchResults] = useState<any>(null);
  // Loading state for asynchronous operations (search, delete)
  const [loading, setLoading] = useState(false);
  // State to hold the currently authenticated user (for auth check)
  const [user, setUser] = useState<any>(null);
  // State to control visibility of the delete confirmation dialog
  const [showConfirmation, setShowConfirmation] = useState(false);
  // State for displaying notifications (success, error, info)
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info' | null, message: string}>({type: null, message: ''});
  // Get the current path for navigation highlighting
  const pathname = usePathname();
  // Get the router instance for navigation
  const router = useRouter();

  // Function to map backend role values ('admin', 'dataEntryOfficer', etc.)
  // to more user-friendly frontend role names ('Admin', 'Data Entry Officer', etc.)
  const mapRoleToFrontend = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'dataEntryOfficer':
        return 'Data Entry Officer';
      case 'verificationOfficer':
        return 'Verification Officer';
      default: // Default to Verification Officer if role is unexpected
        return 'Verification Officer';
    }
  };

  // Handle search by NIC number - uses useCallback to memoize the function
  // This prevents unnecessary re-creation of the function on every render,
  // which is useful when including it in useEffect dependencies.
  const handleSearch = useCallback(async () => {
    // Clear any existing notifications and hide confirmation dialog
    setNotification({type: null, message: ''});
    setShowConfirmation(false);
    setSearchResults(null); // Clear previous search results

    // Basic validation for empty search query
    if (!searchQuery.trim()) {
      setNotification({type: 'error', message: 'Please enter a NIC number to search'});
      return;
    }

    setLoading(true); // Set loading state to true
    try {
      // Construct the API URL with the NIC number
      const apiUrl = `http://localhost:3001/api/users/nic/${searchQuery}`;
      console.log('Searching for user with NIC:', searchQuery, 'at', apiUrl);

      // Send GET request to the backend search endpoint
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Search response status:', response.status);

      // Read the response body as text first to handle potential non-JSON errors
      const responseText = await response.text();
      console.log('Search response text:', responseText);

      let result;
      try {
          // Attempt to parse the response text as JSON
          result = JSON.parse(responseText);
          console.log('Parsed search response data:', result);
      } catch (parseError) {
           console.error('Error parsing search response as JSON:', parseError);
           // If parsing fails, throw an error with the raw text
           throw new Error(`Failed to parse server response: ${responseText}`);
      }


      // Check if the HTTP response was successful (status 2xx) and the API indicates success
      if (response.ok && result.success) {
        const userData = result.data;
        setSearchResults(userData); // Store the found user data

        // Show success notification with user's name
        setNotification({type: 'success', message: `User "${userData.full_name || userData.username}" found successfully!`});
      } else {
        // If API indicates failure or response status is not 2xx
        const errorMessage = result.message || response.statusText || 'User not found';
        setNotification({type: 'error', message: errorMessage});
        setSearchResults(null); // Ensure no results are displayed
      }
    } catch (error: any) {
      console.error('Error searching user:', error);
       // Show a generic error notification for fetch/parsing errors
      setNotification({type: 'error', message: `Failed to search user: ${error.message || 'Unknown error'}. Please try again.`});
      setSearchResults(null); // Ensure no results are displayed on error
    } finally {
      setLoading(false); // Set loading state to false regardless of success/failure
    }
  }, [searchQuery]); // Dependency array: handleSearch function depends on searchQuery

  // Effect hook to check user authentication and role on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Retrieve user data from local storage
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          router.push('/login'); // Redirect to login if no user data
          return; // Stop execution
        }

        // Parse user data and set it in state
        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Check if the authenticated user has the 'admin' role
        if (userData.role !== 'admin') {
          setNotification({type: 'error', message: 'Access denied. Only administrators can access this page.'});
          router.push('/'); // Redirect to home or another page if not admin
          return; // Stop execution
        }

        // Check if there's a 'nic' query parameter in the URL
        const params = new URLSearchParams(window.location.search);
        const nicParam = params.get('nic');
        if (nicParam) {
          setSearchQuery(nicParam); // Set the search query state
          // Use the memoized handleSearch function here
          await handleSearch(); // Perform the search automatically if NIC is in URL
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login'); // Redirect to login on any auth check error
      }
      // No finally block needed here if loading state is managed by individual actions (search, delete)
      // If you had a single page-load loading indicator, you'd set it to false here.
    };

    // Call the auth check function
    checkAuth();
  }, [router, handleSearch]); // Dependency array: depends on router and handleSearch


  // Handle click on the "Delete User" button (shows confirmation dialog)
  const handleDeleteConfirmation = () => {
     // Only show confirmation if a user is found
    if (searchResults) {
        setShowConfirmation(true); // Set state to show the confirmation dialog
        setNotification({type: 'info', message: 'Please confirm user deletion.'}); // Optional info notification
    } else {
        setNotification({type: 'info', message: 'Search for a user first before attempting to delete.'});
    }
  };

  // Handle the actual user deletion after confirmation
  const handleDeleteUser = async () => {
    // Ensure there are search results before attempting deletion
    if (!searchResults) {
        setShowConfirmation(false); // Hide confirmation just in case
        setNotification({type: 'error', message: 'No user selected for deletion.'});
        return;
    }

    setLoading(true); // Set loading state
    setShowConfirmation(false); // Hide the confirmation dialog
    setNotification({type: null, message: ''}); // Clear previous notifications

    try {
      console.log('Preparing to delete user with ID:', searchResults.id);
      // Include user data in the body as per the original code's potential backend expectation
      // Note: Sending full user data in DELETE body is less conventional than sending just ID,
      // but following original structure. Backend should verify auth regardless.
      const deletionData = {
        id: searchResults.id,
        username: searchResults.username,
        full_name: searchResults.full_name,
        role: searchResults.role,
        is_active: searchResults.is_active,
        nic_number: searchResults.register.nic_number, // Access nested register data
        tel_number: searchResults.register.tel_number,
        address: searchResults.register.address,
        profession: searchResults.register.profession
      };

      // Call the API to delete the user
      const response = await fetch(`http://localhost:3001/api/users/delete/${searchResults.id}`, {
        method: 'POST', // Using POST as per original code, though DELETE is more semantic for REST
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deletionData), // Send user data in the body
      });

      console.log('Delete response status:', response.status);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const text = await response.text(); // Read response body for detailed error
        console.error('Error response text:', text);
        // Attempt to parse JSON error response if available, otherwise use text
        try {
            const errorJson = JSON.parse(text);
             throw new Error(errorJson.message || `Server responded with ${response.status}: ${text}`);
        } catch (parseError) {
             throw new Error(`Server responded with ${response.status}: ${text}`);
        }
      }

      const result = await response.json(); // Parse the JSON response
      console.log('Delete response data:', result);

      if (result.success) {
        setNotification({type: 'success', message: result.message || 'User deleted successfully!'});
        setSearchResults(null); // Clear search results after successful deletion
        setSearchQuery(''); // Clear search query
      } else {
        // API indicated failure
        setNotification({type: 'error', message: result.message || 'Failed to delete user'});
      }
    } catch (err: any) {
      // Catch errors during the fetch/delete process
      console.error('Error deleting user:', err);
      setNotification({type: 'error', message: `Failed to delete user: ${err.message || 'Unknown error'}`});
    } finally {
      setLoading(false); // Set loading state to false
    }
  };

  // Handle cancel delete (hides confirmation dialog)
  const handleCancelDelete = () => {
    setShowConfirmation(false); // Set state to hide the confirmation dialog
    setNotification({type: null, message: ''}); // Clear any info notification about confirmation
  };

  // Handle navigation logic for sidebar menu items
  const handleMenuItemClick = (menuItem: string) => {
    // Navigate to the appropriate route based on the menu item
    if (menuItem === 'add') {
      router.push('/admin_dashboard'); // Assuming '/' is the Add User page
    } else if (menuItem === 'view') {
      router.push('/admin_dashboard/view_profile');
    } else if (menuItem === 'edit') {
       // You might want to redirect to an edit page, maybe with a query param
       // For now, just setting active state or redirecting based on original structure
      router.push('/admin_dashboard/edit_user'); // Assuming edit page path
    } else if (menuItem === 'delete') {
       // If already on delete page, clear search/results
       setSearchQuery('');
       setSearchResults(null);
       setShowConfirmation(false);
       setNotification({type: null, message: ''});
       setActiveMenuItem('delete'); // Ensure 'delete' is active
    } else if (menuItem === 'reset') {
       // Redirect to reset password page
       router.push('/admin_dashboard/reset_password'); // Assuming reset password page path
    }
  };

  // --- Tailwind Class Mapping ---
  // Container and general layout
  const containerClasses = "flex flex-col min-h-screen bg-gray-100 font-sans"; // Adjusted bg color slightly

  // Navigation Bar (reused from AdminDashboardPage for consistency)
  const navbarClasses = "flex justify-between items-center py-4 px-8 bg-blue-800 text-white shadow-lg"; // Changed color to blue-800 for variation
  const brandClasses = "text-2xl font-bold";
  const navLinksClasses = "flex space-x-6";
  const navLinkBaseClasses = "py-2 px-4 rounded transition-colors duration-300 hover:bg-white/10";
  const navLinkHighlightClasses = "bg-white/10";

  // Welcome Header
  const welcomeHeaderClasses = "bg-blue-700 text-white py-4 text-center text-2xl font-semibold"; // Adjusted color/padding/size/weight

  // Dashboard Content Layout
  const dashboardContentClasses = "flex flex-1 p-8 gap-8 flex-col md:flex-row"; // Added responsive flex direction and gap

  // Sidebar (reused from AdminDashboardPage, adjusted color slightly)
  const sidebarClasses = "w-full md:w-64 bg-white rounded-lg p-4 shadow flex-shrink-0"; // Adjusted width for responsiveness, padding
  const sidebarItemClasses = "flex items-center py-3 px-4 mb-1 rounded-md cursor-pointer transition-colors duration-300 hover:bg-gray-100"; // Adjusted padding, margin, rounded
  const sidebarItemActiveClass = "bg-blue-100 text-blue-700"; // Adjusted color
  const sidebarIconClasses = "mr-3 text-xl"; // Adjusted margin/size
  const sidebarTextClasses = "text-base";

  // Main Panel
  const mainPanelClasses = "flex-1 bg-white rounded-lg p-6 shadow"; // Adjusted padding

  // Top Bar (Search & Notification)
  const topBarClasses = "flex justify-between items-center mb-6 flex-wrap gap-4"; // Added flex-wrap and gap

  // Search Container, Input, Button, Icon
  const searchContainerClasses = "flex items-center w-full max-w-md border border-gray-300 rounded-md overflow-hidden shadow-sm flex-grow"; // Added flex-grow
  const searchInputClasses = "flex-1 py-2 px-3 border-none outline-none text-sm";
  const searchButtonClasses = "bg-gray-100 border-none py-2 px-4 cursor-pointer transition-colors duration-300 hover:bg-gray-200 text-gray-600"; // Adjusted padding, colors, added hover
  const searchIconClasses = "text-base"; // Adjusted size

  const notificationIconClasses = "text-xl cursor-pointer text-gray-600 hover:text-blue-600"; // Added color and hover

  // Loading, No Results, User Profile
  const loadingContainerClasses = "flex flex-col items-center justify-center p-8 text-center text-gray-700";
  const loadingSpinnerClasses = "w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"; // Adjusted size/color
  const noResultsClasses = "text-center p-8 text-gray-600"; // Adjusted padding

  // User Profile Display Styles
  const userProfileContainerClasses = "bg-gray-50 rounded-lg p-6 shadow-sm"; // Adjusted bg color and padding
  const userProfileClasses = "w-full";
  const profileHeaderClasses = "flex justify-between items-center mb-4 pb-3 border-b border-gray-200 flex-wrap gap-2"; // Added flex-wrap and gap
  const profileHeaderH2Classes = "m-0 text-xl font-semibold text-gray-800"; // Adjusted size/weight/color
  const statusBadgeBaseClasses = "py-1 px-3 rounded-full text-sm font-medium";
  const statusBadgeActiveClasses = `${statusBadgeBaseClasses} bg-green-100 text-green-800`;
  const statusBadgeInactiveClasses = `${statusBadgeBaseClasses} bg-red-100 text-red-800`;

  const profileDetailsClasses = "mb-6";
  const detailRowClasses = "flex flex-col md:flex-row mb-3 py-1 border-b border-gray-100 last:border-b-0 gap-2 md:gap-0"; // Responsive flex and gap, border for rows
  const detailLabelClasses = "w-full md:w-40 font-medium text-gray-600 text-sm"; // Responsive width, size/color
  const detailValueClasses = "flex-1 text-gray-800 text-sm"; // Size/color

  const profileActionsClasses = "flex justify-start gap-4 mt-6"; // Adjusted gap and margin

  // Buttons
  const actionButtonBaseClasses = "py-2.5 px-5 rounded-md cursor-pointer text-sm font-semibold transition-colors duration-300"; // Base styles for action buttons
  const deleteButtonClasses = `${actionButtonBaseClasses} bg-red-600 text-white hover:bg-red-700`;
  const backButtonClasses = `${actionButtonBaseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300`;

  // Confirmation Dialog Styles
  const confirmationOverlayClasses = "fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm"; // Added backdrop-blur
  const confirmationDialogClasses = "bg-white rounded-lg w-11/12 max-w-md shadow-xl overflow-hidden"; // Adjusted width/max-width
  const confirmationHeaderClasses = "bg-gray-100 py-4 px-5 border-b border-gray-200";
  const confirmationHeaderH3Classes = "m-0 text-lg font-semibold text-gray-800";
  const confirmationContentClasses = "p-6 text-gray-700 text-sm"; // Adjusted padding/color/size
  const warningTextClasses = "text-red-800 bg-red-50 p-3 rounded text-xs mt-4 border border-red-100"; // Adjusted colors, padding, size, border
  const confirmationActionsClasses = "flex justify-end p-4 bg-gray-100 border-t border-gray-200 gap-3"; // Adjusted gap

  const confirmButtonClasses = `${actionButtonBaseClasses} bg-red-600 text-white hover:bg-red-700`;
  const cancelButtonClasses = `${actionButtonBaseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300`;

  // Notification Styles
  const notificationBaseClasses = "flex items-center p-4 my-2 rounded-lg shadow-sm animate-slideIn relative"; // Adjusted padding, margin, shadow, added animation
  const notificationSuccessClasses = `${notificationBaseClasses} bg-green-100 border-l-4 border-green-500 text-green-800`;
  const notificationErrorClasses = `${notificationBaseClasses} bg-red-100 border-l-4 border-red-500 text-red-800`;
  const notificationInfoClasses = `${notificationBaseClasses} bg-blue-100 border-l-4 border-blue-500 text-blue-800`; // Added info style
  const notificationIconClasses = "mr-3 text-xl"; // Adjusted margin/size
  const closeNotificationClasses = "absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none text-xl cursor-pointer opacity-60 hover:opacity-100"; // Adjusted size/position/opacity

  // Global styles placeholder (should be in your main CSS)
   // const globalStyles = `
   //   * {
   //     box-sizing: border-box;
   //     margin: 0;
   //     padding: 0;
   //   }
   //   body {
   //     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
   //       Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
   //     line-height: 1.6;
   //     color: #333;
   //   }
   //   a {
   //     color: inherit;
   //     text-decoration: none;
   //   }
   //   @keyframes spin {
   //     0% { transform: rotate(0deg); }
   //     100% { transform: rotate(360deg); }
   //   }
   //   @keyframes slideIn {
   //     from { transform: translateY(-20px); opacity: 0; }
   //     to { transform: translateY(0); opacity: 1; }
   //   }
   // `;


  return (
    <div className={containerClasses}>
      {/* Navigation Bar */}
      <nav className={navbarClasses}>
        <div className={brandClasses}>Goverment Nutrition Program</div>
        <div className={navLinksClasses}>
          <Link href="/" className={`${navLinkBaseClasses} ${pathname === "/" ? navLinkHighlightClasses : ""}`}>
            Home
          </Link>
          <Link href="/about" className={`${navLinkBaseClasses} ${pathname === "/about" ? navLinkHighlightClasses : ""}`}>
            About Program
          </Link>
          <Link href="/login" className={`${navLinkBaseClasses} ${pathname === "/login" ? navLinkHighlightClasses : ""}`}>
            Login
          </Link>
          <Link href="/gazette" className={`${navLinkBaseClasses} ${pathname === "/gazette" ? navLinkHighlightClasses : ""}`}>
            Gazette
          </Link>
        </div>
      </nav>

      {/* Welcome Header */}
      <div className={welcomeHeaderClasses}>
        <h1>Search Users for Delete</h1>
      </div>

      {/* Main Content */}
      <div className={dashboardContentClasses}>
        {/* Sidebar */}
        <div className={sidebarClasses}>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'add' ? sidebarItemActiveClass : ''}`}
            onClick={() => handleMenuItemClick('add')}
          >
            <div className={sidebarIconClasses}>👤</div>
            <div className={sidebarTextClasses}>Add user</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'edit' ? sidebarItemActiveClass : ''}`}
            onClick={() => handleMenuItemClick('edit')}
          >
            <div className={sidebarIconClasses}>👤</div>
            <div className={sidebarTextClasses}>Edit user</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'delete' ? sidebarItemActiveClass : ''}`}
            onClick={() => handleMenuItemClick('delete')}
          >
            <div className={sidebarIconClasses}>👤</div>
            <div className={sidebarTextClasses}>Delete user</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'view' ? sidebarItemActiveClass : ''}`}
            onClick={() => handleMenuItemClick('view')}
          >
            <div className={sidebarIconClasses}>📋</div>
            <div className={sidebarTextClasses}>View profile</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'reset' ? sidebarItemActiveClass : ''}`}
            onClick={() => handleMenuItemClick('reset')}
          >
            <div className={sidebarIconClasses}>🔑</div>
            <div className={sidebarTextClasses}>Reset password</div>
          </div>
        </div>

        {/* Main Panel */}
        <div className={mainPanelClasses}>
          {/* Search Bar */}
          <div className={topBarClasses}>
            <div className={searchContainerClasses}>
              <input
                type="text"
                placeholder="Search by NIC Number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={searchInputClasses}
                disabled={loading} // Disable input while loading
                onKeyDown={(e) => { // Allow search on Enter key press
                   if (e.key === 'Enter') {
                       e.preventDefault(); // Prevent default form submission if inside a form
                       handleSearch();
                   }
                }}
              />
              <button
                 onClick={handleSearch}
                 className={searchButtonClasses}
                 disabled={loading} // Disable button while loading
              >
                <span className={searchIconClasses}>🔍</span>
              </button>
            </div>
            {/* Optional: Notification icon */}
            <div className={notificationIconClasses}>🔔</div>
          </div>

          {/* Notification Message */}
          {notification.type && (
            <div className={`${notificationBaseClasses} ${notification.type === 'success' ? notificationSuccessClasses : notification.type === 'error' ? notificationErrorClasses : notificationInfoClasses}`}>
              <span className={notificationIconClasses}>
                {notification.type === 'success' && '✅'}
                {notification.type === 'error' && '❌'}
                {notification.type === 'info' && 'ℹ️'}
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

          {/* Confirmation Dialog */}
          {showConfirmation && (
            <div className={confirmationOverlayClasses}>
              <div className={confirmationDialogClasses}>
                <div className={confirmationHeaderClasses}>
                  <h3 className={confirmationHeaderH3Classes}>Confirm Deletion</h3>
                </div>
                <div className={confirmationContentClasses}>
                  <p className="mb-3">Are you sure you want to delete this user?</p>
                  {searchResults && (
                    <p className="font-semibold mb-3">
                      User: <span className="font-normal">{searchResults.full_name || searchResults.username}</span>
                      <br />
                      NIC: <span className="font-normal">{searchResults.register.nic_number}</span>
                    </p>
                  )}
                  <p className={warningTextClasses}>⚠️ This action will remove the user from the active system but their data will be stored in a separate table for record-keeping.</p>
                </div>
                <div className={confirmationActionsClasses}>
                  <button
                    className={confirmButtonClasses}
                    onClick={handleDeleteUser}
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Yes, Delete User'}
                  </button>
                  <button
                    className={cancelButtonClasses}
                    onClick={handleCancelDelete}
                    disabled={loading}
                  >
                    No, Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Profile Display */}
          {loading && !searchResults ? ( // Show loading spinner only when initially loading or searching, and no results are yet shown
            <div className={loadingContainerClasses}>
              <div className={loadingSpinnerClasses}></div>
              <p>Searching...</p>
            </div>
          ) : searchResults ? ( // Show profile if searchResults are available
            <div className={userProfileContainerClasses}>
              <div className={userProfileClasses}>
                <div className={profileHeaderClasses}>
                  <h2 className={profileHeaderH2Classes}>{searchResults.full_name || searchResults.username}'s Profile</h2>
                  <div className={searchResults.is_active ? statusBadgeActiveClasses : statusBadgeInactiveClasses}>
                    {searchResults.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div className={profileDetailsClasses}>
                  <div className={detailRowClasses}>
                    <div className={detailLabelClasses}>Username:</div>
                    <div className={detailValueClasses}>{searchResults.username}</div>
                  </div>
                  {/* Conditionally render Full Name if available */}
                   {searchResults.full_name && (
                     <div className={detailRowClasses}>
                       <div className={detailLabelClasses}>Full Name:</div>
                       <div className={detailValueClasses}>{searchResults.full_name}</div>
                     </div>
                   )}
                  {/* Access nested register data */}
                  {searchResults.register && (
                    <>
                      {searchResults.register.nic_number && (
                        <div className={detailRowClasses}>
                          <div className={detailLabelClasses}>NIC Number:</div>
                          <div className={detailValueClasses}>{searchResults.register.nic_number}</div>
                        </div>
                      )}
                       {searchResults.register.tel_number && (
                         <div className={detailRowClasses}>
                           <div className={detailLabelClasses}>Tel Number:</div>
                           <div className={detailValueClasses}>{searchResults.register.tel_number}</div>
                         </div>
                       )}
                       {searchResults.register.address && (
                         <div className={detailRowClasses}>
                           <div className={detailLabelClasses}>Address:</div>
                           <div className={detailValueClasses}>{searchResults.register.address}</div>
                         </div>
                       )}
                       {searchResults.register.profession && (
                         <div className={detailRowClasses}>
                           <div className={detailLabelClasses}>Profession:</div>
                           <div className={detailValueClasses}>{searchResults.register.profession}</div>
                         </div>
                       )}
                    </>
                   )}

                  <div className={detailRowClasses}>
                    <div className={detailLabelClasses}>Role:</div>
                    <div className={detailValueClasses}>{mapRoleToFrontend(searchResults.role)}</div>
                  </div>
                   {/* Optionally display created/updated dates */}
                   {searchResults.created_at && (
                      <div className={detailRowClasses}>
                         <div className={detailLabelClasses}>Created:</div>
                         <div className={detailValueClasses}>{new Date(searchResults.created_at).toLocaleDateString()}</div>
                       </div>
                   )}
                    {searchResults.updated_at && (
                      <div className={detailRowClasses}>
                         <div className={detailLabelClasses}>Last Updated:</div>
                         <div className={detailValueClasses}>{new Date(searchResults.updated_at).toLocaleDateString()}</div>
                       </div>
                   )}
                </div>

                <div className={profileActionsClasses}>
                  <button
                    className={deleteButtonClasses}
                    onClick={handleDeleteConfirmation}
                    disabled={loading} // Disable delete button while deletion is in progress
                  >
                     {loading ? 'Deleting...' : 'Delete User'}
                  </button>
                  <button
                    className={backButtonClasses}
                    onClick={() => {
                      setSearchResults(null); // Clear results to go back to initial state
                      setSearchQuery(''); // Clear search input
                      setNotification({type: null, message: ''}); // Clear notifications
                      setShowConfirmation(false); // Hide confirmation
                    }}
                    disabled={loading} // Disable back button while deletion is in progress
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          ) : ( // Show initial message if no searchResults and not loading
            <div className={noResultsClasses}>
              <p className="text-lg">Enter a NIC number to search for a user to delete</p>
            </div>
          )}
        </div>
      </div>

      {/* The original <style jsx> and <style jsx global> blocks are removed */}
      {/* Ensure you have Tailwind CSS configured globally in your project */}
      {/* Add required animations (spin, slideIn) and maybe global base styles in your main CSS file */}
       {/* Example of where you might include animations if not in tailwind.config.js */}
       {/* <style>{`
         @keyframes spin { /* ... styles ... */ }
         @keyframes slideIn { /* ... styles ... */ }
       `}</style> */}
    </div>
  );
}