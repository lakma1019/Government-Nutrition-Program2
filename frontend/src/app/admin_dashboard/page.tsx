'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  // Function to map frontend role names to backend role values
  const mapRoleToBackend = (role: string): string => {
    switch (role) {
      case 'Admin':
        return 'admin';
      case 'Data Entry Officer':
        return 'dataEntryOfficer';
      case 'Verification Officer':
      default: // Default to Verification Officer if role is unexpected
        return 'verificationOfficer';
    }
  };

  const [activeMenuItem, setActiveMenuItem] = useState('add'); // State for sidebar active item
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const pathname = usePathname(); // Get current path for navigation highlighting
  const router = useRouter(); // Router for navigation
  const [user, setUser] = useState<any>(null); // State to store authenticated user data
  const [loading, setLoading] = useState(true); // Loading state for initial authentication check

  // Check if user is authenticated and is an admin on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          router.push('/login'); // Redirect to login if no user data found
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData); // Set user data

        // Check if user is an admin role
        if (userData.role !== 'admin') {
          alert('Access denied. Only administrators can access this page.');
          router.push('/'); // Redirect to home or another page if not admin
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login'); // Redirect to login on auth error
      } finally {
        setLoading(false); // Stop loading once auth check is complete
      }
    };

    checkAuth();
  }, [router]); // Depend on router

  // Form state for adding/editing user
  const [formData, setFormData] = useState({
    fullName: '',
    nicNumber: '',
    telNumber: '',
    address: '',
    profession: '',
    username: '', // Required
    password: '', // Required
    role: 'Admin', // Default role
    isActive: true // Default status
  });

  // Handle form input changes (for text, number, select)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target; // Extract name and value from input
    setFormData({
      ...formData, // Copy existing form data
      [name]: value // Update the specific field
    });
  };

  // Handle checkbox input change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const { name, checked } = e.target; // Extract name and checked state
     setFormData({
        ...formData, // Copy existing form data
        [name]: checked // Update the checkbox field
     });
  };


  // Handle form submission to add user
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Validate required fields before submitting
    if (!formData.username || !formData.password) {
      alert('Username and password are required!');
      return;
    }

    // Log data being sent (excluding password for security)
    console.log('Sending registration request with data:', {
      username: formData.username,
      password: '***',
      full_name: formData.fullName,
      role: mapRoleToBackend(formData.role), // Map frontend role string to backend value
      is_active: formData.isActive,
      nic_number: formData.nicNumber,
      tel_number: formData.telNumber,
      address: formData.address,
      profession: formData.profession
    });

    try {
      // Send POST request to the registration API endpoint
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Indicate JSON request body
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          full_name: formData.fullName,
          role: mapRoleToBackend(formData.role),
          is_active: formData.isActive,
          nic_number: formData.nicNumber,
          tel_number: formData.telNumber,
          address: formData.address,
          profession: formData.profession
        }),
      });

      console.log('Response status:', response.status); // Log response status

      const responseText = await response.text(); // Read response body as text
      console.log('Response text:', responseText); // Log raw response text

      let data;
      try {
        data = JSON.parse(responseText); // Attempt to parse response text as JSON
        console.log('Parsed response data:', data); // Log parsed data
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        // If parsing fails, alert user and return
        alert(`Server returned invalid JSON: ${responseText}`);
        return;
      }

      // Check if the request was successful based on response status
      if (response.ok) { // response.ok is true for 2xx status codes
        alert('User added successfully!'); // Show success message
        // Reset form state to initial values after successful submission
        setFormData({
          fullName: '',
          nicNumber: '',
          telNumber: '',
          address: '',
          profession: '',
          username: '',
          password: '',
          role: 'Admin',
          isActive: true
        });
      } else {
        // If response status is not 2xx, check data.message for error details
        alert(`Failed to add user: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      // Catch any errors during the fetch process (e.g., network issues)
      console.error('Error adding user:', err);
      alert(`Failed to connect to the server: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
    }
  };

  // Handle discard button click (resets form)
  const handleDiscard = () => {
    // Reset form state to initial values
    setFormData({
      fullName: '',
      nicNumber: '',
      telNumber: '',
      address: '',
      profession: '',
      username: '',
      password: '',
      role: 'Admin',
      isActive: true
    });
  };

  // --- Tailwind Class Mapping ---
  // Container and general layout
  // Mapping rgb(214, 233, 243) to bg-[#d6e9f3]
  const containerClasses = "w-full min-h-screen p-5 bg-[#d6e9f3] font-sans flex flex-col";

  // Navigation Bar
  // Mapping #e6f0ff to bg-[#e6f0ff]
  // Mapping #003300 to text-[#003300]
  // Mapping rgb(199, 150, 150) to hover:bg-[#c79696]
  // Mapping rgb(241, 163, 208) to bg-[#f1a3d0]
  // Mapping #ff0000 to border-red-600
  const navbarClasses = "flex justify-between items-center py-[15px] px-[25px] bg-[#e6f0ff] rounded-[15px] shadow-lg mb-10"; // Added margin-bottom
  const brandClasses = "text-xl font-bold text-[#003300]";
  const navLinksClasses = "flex gap-4";
  const navLinkBaseClasses = "inline-flex group"; // Use group on Link for hover effects on span
  const linkTextBaseClasses = "inline-block py-[5px] px-[15px] bg-white rounded-full text-black text-sm font-bold transition-all duration-200 ease-in-out";
  const linkTextHoverClasses = "group-hover:bg-[#c79696]";
  const linkTextHighlightClasses = "bg-[#f1a3d0] border-[5px] border-red-600 !text-black";

  // Welcome Header
  const welcomeHeaderClasses = "text-center my-5 text-2xl text-gray-800 font-semibold"; // Added font-semibold

  // Dashboard Content Layout
  // Mapping #f0f8ff to bg-[#f0f8ff]
  const dashboardContentClasses = "flex bg-[#f0f8ff] rounded-lg overflow-hidden shadow-md"; // Removed margin-top, added to navbar

  // Sidebar
  // Mapping #f0f8ff to bg-[#f0f8ff]
  const sidebarClasses = "w-[250px] bg-[#f0f8ff] py-5 border-r border-gray-300 flex-shrink-0"; // Added flex-shrink-0

  // Sidebar Item
  const sidebarItemClasses = "flex items-center py-3 px-5 cursor-pointer transition-colors duration-200 hover:bg-[#e6f0ff]";
  const sidebarItemActiveClass = "bg-[#e6f0ff]";
  const sidebarIconClasses = "mr-2.5 text-xl";
  const sidebarTextClasses = "text-base";

  // Main Panel
  // Mapping #f0f8ff to bg-[#f0f8ff]
  const mainPanelClasses = "flex-1 p-5 bg-[#f0f8ff]";

  // Top Bar (Search & Notification)
  const topBarClasses = "flex justify-between items-center mb-5";
  const searchContainerClasses = "relative w-full md:w-[70%]"; // Responsive width
  const searchInputClasses = "w-full py-2 px-4 pr-10 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-blue-500"; // Added focus styles
  const searchIconClasses = "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-base"; // Adjusted right/color
  const notificationIconClasses = "text-xl cursor-pointer text-gray-600 hover:text-blue-600"; // Added color and hover

  // User Form
  const userFormContainerClasses = "bg-white rounded-lg p-5 shadow-sm";
  const userFormClasses = "flex flex-col gap-4";
  const formRowClasses = "flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0"; // Responsive flex direction and alignment
  const formLabelClasses = "w-full md:w-[150px] text-sm font-medium text-gray-700 mb-1 md:mb-0"; // Responsive width and margin
  const formInputBaseClasses = "flex-1 py-2 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"; // Base input styles with focus
  const formSelectClasses = `${formInputBaseClasses} bg-white appearance-auto h-[38px]`; // Specific styles for select

  const checkboxRowClasses = `${formRowClasses} items-center`; // Ensure items-center for checkbox row

  const statusToggleClasses = "flex items-center";
  const statusToggleInputClasses = "mr-2.5 w-[18px] h-[18px]";
  const toggleLabelClasses = "text-sm font-medium text-gray-700";

  // Form Actions (Buttons)
  const formActionsClasses = "flex flex-col items-center mt-5 gap-4";
  const addButtonClasses = "w-full sm:w-[60%] p-2.5 bg-indigo-600 text-white rounded font-bold cursor-pointer text-center hover:bg-indigo-700 transition-colors"; // Adjusted color, added hover/transition
  const secondaryButtonsClasses = "flex flex-col sm:flex-row justify-between w-full gap-3"; // Responsive flex and gap

  const actionButtonBaseClasses = "py-2 px-5 rounded cursor-pointer font-bold text-sm text-center transition-colors"; // Base styles for action buttons
  const viewProfileButtonClasses = `${actionButtonBaseClasses} bg-indigo-600 text-white flex-1 hover:bg-indigo-700`; // Adjusted color, added flex-1
  const discardButtonClasses = `${actionButtonBaseClasses} bg-white border border-gray-300 text-gray-800 flex-1 hover:bg-gray-100`; // Adjusted colors, added border, flex-1

  // Loading Message
  const loadingMessageClasses = "flex justify-center items-center h-screen text-2xl text-indigo-600";


  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className={loadingMessageClasses}>Loading...</div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Navigation Bar */}
      <nav className={navbarClasses}>
        <div className={brandClasses}>Goverment Nutrition Program</div>
        <div className={navLinksClasses}>
          <Link href="/" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/" ? linkTextHighlightClasses : ""}`}>
              Home
            </span>
          </Link>
          <Link href="/about" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/about" ? linkTextHighlightClasses : ""}`}>
              About Program
            </span>
          </Link>
          <Link href="/login" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/login" ? linkTextHighlightClasses : ""}`}>
              Login
            </span>
          </Link>
          <Link href="/gazette" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/gazette" ? linkTextHighlightClasses : ""}`}>
              Gazette
            </span>
          </Link>
        </div>
      </nav>

      {/* Welcome Header */}
      <div className={welcomeHeaderClasses}>
        <h1>Welcome to admin login</h1>
      </div>

      {/* Main Content */}
      <div className={dashboardContentClasses}>
        {/* Sidebar */}
        <div className={sidebarClasses}>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'add' ? sidebarItemActiveClass : ''}`}
            onClick={() => setActiveMenuItem('add')}
          >
            <div className={sidebarIconClasses}>👤</div>
            <div className={sidebarTextClasses}>Add user</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'edit' ? sidebarItemActiveClass : ''}`}
            onClick={() => setActiveMenuItem('edit')} // Assuming edit user form/page is here
          >
            <div className={sidebarIconClasses}>👤</div>
            <div className={sidebarTextClasses}>Edit user</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'delete' ? sidebarItemActiveClass : ''}`}
            onClick={() => router.push('/admin_dashboard/delete_user')} // Redirects to delete page
          >
            <div className={sidebarIconClasses}>👤</div>
            <div className={sidebarTextClasses}>Delete user</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'view' ? sidebarItemActiveClass : ''}`}
            onClick={() => router.push('/admin_dashboard/view_profile')} // Redirects to view profile page
          >
            <div className={sidebarIconClasses}>📋</div>
            <div className={sidebarTextClasses}>View profile</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'reset' ? sidebarItemActiveClass : ''}`}
            onClick={() => setActiveMenuItem('reset')} // Assuming reset password form/page is here
          >
            <div className={sidebarIconClasses}>🔑</div>
            <div className={sidebarTextClasses}>Reset password</div>
          </div>
        </div>

        {/* Main Panel */}
        <div className={mainPanelClasses}>
          {/* Search and Notification Bar */}
          <div className={topBarClasses}>
            <div className={searchContainerClasses}>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={searchInputClasses}
              />
              <span className={searchIconClasses}>🔍</span>
            </div>
            <div className={notificationIconClasses}>🔔</div>
          </div>

          {/* User Form - Only show the form if activeMenuItem is 'add' */}
          {activeMenuItem === 'add' && (
              <div className={userFormContainerClasses}>
                <form onSubmit={handleSubmit} className={userFormClasses}>
                  <div className={formRowClasses}>
                    <label className={formLabelClasses}>Full Name :</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={formInputBaseClasses}
                    />
                  </div>

                  <div className={formRowClasses}>
                    <label className={formLabelClasses}>NIC number :</label>
                    <input
                      type="text"
                      name="nicNumber"
                      value={formData.nicNumber}
                      onChange={handleInputChange}
                      className={formInputBaseClasses}
                    />
                  </div>

                  <div className={formRowClasses}>
                    <label className={formLabelClasses}>Tel number :</label>
                    <input
                      type="text"
                      name="telNumber"
                      value={formData.telNumber}
                      onChange={handleInputChange}
                      className={formInputBaseClasses}
                    />
                  </div>

                  <div className={formRowClasses}>
                    <label className={formLabelClasses}>Address :</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={formInputBaseClasses}
                    />
                  </div>

                  <div className={formRowClasses}>
                    <label className={formLabelClasses}>Profession :</label>
                    <input
                      type="text"
                      name="profession"
                      value={formData.profession}
                      onChange={handleInputChange}
                      className={formInputBaseClasses}
                    />
                  </div>

                  <div className={formRowClasses}>
                    <label className={formLabelClasses}>Username :</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required // Username is required
                      className={formInputBaseClasses}
                    />
                  </div>

                  <div className={formRowClasses}>
                    <label className={formLabelClasses}>Created password :</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required // Password is required
                      className={formInputBaseClasses}
                    />
                  </div>

                  <div className={formRowClasses}>
                    <label className={formLabelClasses}>User Role :</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className={formSelectClasses} // Use specific select styles
                    >
                      <option value="Admin">Admin</option>
                      <option value="Data Entry Officer">Data Entry Officer</option>
                      <option value="Verification Officer">Verification Officer</option>
                    </select>
                  </div>

                  <div className={checkboxRowClasses}> {/* Use specific checkbox row styling */}
                    <label className={formLabelClasses}>Status :</label>
                    <div className={statusToggleClasses}>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleCheckboxChange} // Use specific handler for checkbox
                        id="status-toggle"
                        className={statusToggleInputClasses}
                      />
                      <label htmlFor="status-toggle" className={toggleLabelClasses}>
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className={formActionsClasses}>
                    <button type="submit" className={addButtonClasses}>ADD</button>
                    <div className={secondaryButtonsClasses}>
                      <button type="button" onClick={handleDiscard} className={discardButtonClasses}>Discard</button>
                      <button
                        type="button"
                        onClick={() => router.push('/admin_dashboard/view_profile')}
                        className={viewProfileButtonClasses}
                      >
                        View Profiles
                      </button>
                    </div>
                  </div>
                </form>
              </div>
          )}
          {/* Add content for other menu items here (e.g., Edit User form, Reset Password form) */}
          {/* {activeMenuItem === 'edit' && (<div>Edit User Content Here</div>)} */}
          {/* {activeMenuItem === 'reset' && (<div>Reset Password Content Here</div>)} */}
          {/* View Profile and Delete User are handled by routing */}

        </div>
      </div>

      {/* The original <style jsx> and <style jsx global> blocks are removed */}
      {/* Ensure you have Tailwind CSS configured globally in your project */}
    </div>
  );
}