'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import VoucherTemplate from './VoucherTemplate'; // Assuming VoucherTemplate is a component in the same directory

export default function GenerateVoucherPage() {
  // State for loading status (e.g., during authentication check)
  const [loading, setLoading] = useState(true);
  // Get the current path for navigation highlighting
  const pathname = usePathname();
  // Get the router instance for navigation
  const router = useRouter();

  // Function to get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based (0-11)
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Form state for voucher generation with sample/initial data
  // In a real app, this data would likely be fetched or generated dynamically
  // based on user inputs, reports, or other criteria.
  const [formData] = useState({
    date: getCurrentDate(), // Default to current date
    schoolName: 'Sample School', // Sample data
    schoolAddress: 'Sample Address, Colombo', // Sample data
    principalName: 'Mr. Principal', // Sample data
    voucherNumber: 'GV-' + Math.floor(1000 + Math.random() * 9000), // Generate a random sample voucher number
    totalAmount: 25000, // Sample amount
    description: 'School nutrition program funding' // Sample description
  });

  // Effect hook to perform initial setup tasks, like checking authentication
  useEffect(() => {
    // --- Authentication Check (Simplified for Demo) ---
    // In a real application, you would check localStorage for user data,
    // verify the user's role (Data Entry Officer), and redirect if necessary.
    // Example:
    // const storedUser = localStorage.getItem('user');
    // if (!storedUser) { router.push('/login'); return; }
    // const userData = JSON.parse(storedUser);
    // if (userData.role !== 'dataEntryOfficer') { alert('Access denied.'); router.push('/'); return; }
    // setUser(userData); // Set user state if needed elsewhere

    // For the purpose of this styling conversion, we'll just simulate a loading time
    // and assume authentication passes after the timer.
    console.log('Simulating auth check...');
    const timer = setTimeout(() => {
      console.log('Auth check simulation complete.');
      setLoading(false); // Set loading to false after simulation
    }, 500); // Simulate 500ms loading time

    // Cleanup function to clear the timer if the component unmounts early
    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this effect runs only once on mount

  // Handler for the "Preview" button click
  const handlePreview = () => {
    // In this demo, the preview is just the VoucherTemplate component rendering the formData.
    // Clicking preview could potentially:
    // 1. Re-generate the voucher data based on current inputs (if inputs were editable).
    // 2. Trigger a re-render to ensure the latest data is displayed.
    // 3. Open a modal or new window with a dedicated preview.
    console.log('Preview button clicked. Voucher data:', formData);
    // Since the template renders directly with formData, no specific action is needed here for the current structure.
    // If using React-to-Print or similar, this would trigger the print/PDF generation.
  };

  // Handler for the "Send to Verification Officer" button click
  const handleSendToVerify = () => {
    // In a real application, this would:
    // 1. Validate the voucher data.
    // 2. Send the data to a backend API endpoint (e.g., POST /api/vouchers).
    // 3. The backend would save the voucher and potentially notify the Verification Officer.
    // For this demo, we'll just show a success message.
    console.log('Send to Verify button clicked. Voucher data:', formData);
    alert('Voucher sent to Verification Officer successfully!'); // Show simple alert
    // You might want to clear the form or redirect after sending.
  };

  // Show loading state while authentication is in progress
  if (loading) {
    // Use Tailwind classes for loading message display
    // Mapping #f8e6f3 background to bg-[#f8e6f3]
    // Mapping #6c5ce7 color to text-[#6c5ce7]
    return (
      <div className="flex justify-center items-center h-screen text-2xl text-[#6c5ce7] bg-[#f8e6f3]">
        Loading...
      </div>
    );
  }

  // --- Tailwind Class Mapping ---
  // Container and general layout
  // Mapping #f8e6f3 to bg-[#f8e6f3]
  const containerClasses = "w-full min-h-screen p-5 bg-[#f8e6f3] font-sans flex flex-col";

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

  // Welcome Header
  const welcomeHeaderClasses = "text-center mb-5 py-2 bg-[#f8e6f3] rounded-lg";
  const welcomeHeaderH1Classes = "text-xl font-semibold text-gray-800";

  // Dashboard Content Layout
  // Mapping #fff to bg-white
  // Mapping #0070f3 to border-[#0070f3]
  const dashboardContentClasses = "flex bg-white rounded-xl overflow-hidden shadow-lg border-2 border-[#0070f3] flex-col md:flex-row"; // Added responsive flex

  // Sidebar (reused from DEO_login)
  // Mapping #f8e1f4 to bg-[#f8e1f4]
  // Mapping #0070f3 to border-r-2 border-[#0070f3]
  const sidebarClasses = "w-full md:w-52 bg-[#f8e1f4] py-5 border-r-0 md:border-r-2 border-[#0070f3] flex-shrink-0"; // Responsive width and border

  // Sidebar Item (reused from DEO_login)
  // Mapping #f0d0f0 to hover:bg-[#f0d0f0]
  // Mapping #e6b3d9 to active:bg-[#e6b3d9]
  const sidebarItemClasses = "flex items-center py-3 px-5 cursor-pointer transition-colors duration-200 hover:bg-[#f0d0f0]";
  const sidebarItemActiveClass = "bg-[#e6b3d9] font-bold"; // Keep font-bold explicitly
  const sidebarIconClasses = "mr-2.5 text-xl";
  const sidebarTextClasses = "text-base";

  // Main Panel
  // Mapping #fff to bg-white
  const mainPanelClasses = "flex-1 p-5 bg-white";

  // Note: The original code had VoucherTemplate component inside the main-panel.
  // The styling for the form elements (`voucher-form`, `form-row`, `form-group`, etc.)
  // and buttons (`preview-button`, `send-verify-button`, `back-button`) seems to be
  // *duplicated* in the original VoucherTemplate.jsx (not provided) AND in this
  // GenerateVoucherPage's style block.
  // To avoid duplication and follow the component structure, these styles should ideally
  // live within the VoucherTemplate component itself and be translated to Tailwind there.
  // However, as the goal is to translate THIS file's styling, I will map the styles present
  // in THIS file's style block, assuming they are intended to style the contents rendered
  // by VoucherTemplate.
  // The original style block also had a `voucher-form` class, which implies VoucherTemplate
  // might be rendering a form. Let's map those styles here.

  // Voucher Form (assuming VoucherTemplate renders a form with these structures)
   const voucherFormClasses = "max-w-full"; // Max width

   const formRowClasses = "flex flex-col md:flex-row mb-4 items-start md:items-center gap-2 md:gap-4"; // Responsive flex, items, gap
   const formGroupClasses = "flex-1 mr-0 md:mr-4 last:mr-0"; // Flex-1, responsive margin-right
   const formLabelClasses = "block mb-1.5 font-semibold text-gray-700 text-sm"; // Adjusted margin, color, size
   const formInputBaseClasses = "w-full py-2 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"; // Base input styles with focus
   const formTextareaClasses = `${formInputBaseClasses} resize-y`; // Textarea with resize

   // Date Input Container (reused from DEO_login)
   const dateInputContainerClasses = "relative flex items-center";
   const dateTextInputClasses = `${formInputBaseClasses} pr-8 bg-white cursor-default`; // Added padding-right for icon space
   const calendarInputClasses = "absolute right-0 top-0 w-8 h-full opacity-0 cursor-pointer";
    // Manual simulation for the calendar icon (requires span)
    const dateIconClasses = "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-base text-gray-600";


  // Voucher Actions (Buttons)
  const voucherActionsClasses = "flex flex-col sm:flex-row justify-between mt-5 gap-4"; // Responsive flex, justify, margin, gap

  // Preview and Send to Verify Buttons
  // Mapping #4CAF50 to bg-green-600
  // Mapping #45a049 to hover:bg-green-700
  // Mapping #2196F3 to bg-blue-600
  // Mapping #0b7dda to hover:bg-blue-700
  const voucherButtonBaseClasses = "flex-1 p-2.5 border-none rounded font-bold cursor-pointer text-base text-white transition-colors"; // Flex-1, padding, border none, rounded, weight, cursor, size, text white, transition
  const previewButtonClasses = `${voucherButtonBaseClasses} bg-green-600 hover:bg-green-700`; // Green colors
  const sendVerifyButtonClasses = `${voucherButtonBaseClasses} bg-blue-600 hover:bg-blue-700`; // Blue colors

  // Form Footer (Back button)
  const formFooterClasses = "flex justify-end mt-5"; // Flex, justify end, margin top

  // Back Button (reused from DEO_login)
  const backButtonClasses = "py-2 px-5 bg-white border border-gray-300 rounded cursor-pointer text-gray-800 text-sm transition-colors hover:bg-gray-100"; // Padding, bg, border, rounded, cursor, color, size, transition, hover


  // Loading message styles (reused from DEO_login)
   // Mapping #6c5ce7 to text-[#6c5ce7]
   const loadingMessageClasses = "flex justify-center items-center h-screen text-2xl text-[#6c5ce7]";


  return (
    <div className={containerClasses}>
      {/* Navigation Bar */}
      <nav className={navbarClasses}>
        <div className={brandClasses}>Government Nutrition Program</div>
        <div className={navLinksClasses}>
          <Link href="/deo_dashboard" className={`${navLinkBaseClasses} ${pathname === "/deo_dashboard" ? linkTextHighlightClasses : ""}`}>
            <span className={linkTextBaseClasses}>Dashboard</span>
          </Link>
          <Link href="/deo_dashboard/contractors" className={`${navLinkBaseClasses} ${pathname === "/deo_dashboard/contractors" ? linkTextHighlightClasses : ""}`}>
            <span className={linkTextBaseClasses}>Contractors</span>
          </Link>
          <Link href="/" className={navLinkBaseClasses}>
            <span className={linkTextBaseClasses}>Logout</span>
          </Link>
        </div>
      </nav>

      {/* Welcome Header */}
      <div className={welcomeHeaderClasses}>
        <h1 className={welcomeHeaderH1Classes}>Generate General 35 Voucher</h1>
      </div>

      {/* Main Content */}
      <div className={dashboardContentClasses}>
        {/* Sidebar */}
        <div className={sidebarClasses}>
          <div
            className={sidebarItemClasses} // No active class initially as this page is active
            onClick={() => router.push('/deo_dashboard')}
          >
            <div className={sidebarIconClasses}>📝</div>
            <div className={sidebarTextClasses}>Enter Daily Data</div>
          </div>
          <div
            className={sidebarItemClasses}
            onClick={() => router.push('/deo_dashboard/contractors')}
          >
            <div className={sidebarIconClasses}>👥</div>
            <div className={sidebarTextClasses}>Contractors</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${sidebarItemActiveClass}`} // This item is active on this page
            onClick={() => router.push('/deo_dashboard/generate_voucher')}
          >
            <div className={sidebarIconClasses}>📄</div>
            <div className={sidebarTextClasses}>Generate General 35 Voucher</div>
          </div>
          <div
            className={sidebarItemClasses}
            onClick={() => router.push('/deo_dashboard/generate_progress_report')}
          >
            <div className={sidebarIconClasses}>📈</div>
            <div className={sidebarTextClasses}>Generate Progress Report</div>
          </div>
           {/* Assuming these links go to placeholder or same dashboard page */}
          <div
            className={sidebarItemClasses}
            onClick={() => router.push('/deo_dashboard?tab=viewProfile')} // Example: use query param
          >
            <div className={sidebarIconClasses}>👤</div>
            <div className={sidebarTextClasses}>View profile</div>
          </div>
          <div
            className={sidebarItemClasses}
             onClick={() => router.push('/deo_dashboard?tab=reports')} // Example: use query param
          >
            <div className={sidebarIconClasses}>📊</div>
            <div className={sidebarTextClasses}>Reports</div>
          </div>
          <div
            className={sidebarItemClasses}
             onClick={() => router.push('/deo_dashboard?tab=history')} // Example: use query param
          >
            <div className={sidebarIconClasses}>📜</div>
            <div className={sidebarTextClasses}>History</div>
          </div>
        </div>

        {/* Main Panel */}
        <div className={mainPanelClasses}>
          {/* The VoucherTemplate component is rendered here */}
          {/* It should use Tailwind internally based on the original styling intent */}
          <VoucherTemplate
            formData={formData} // Pass the generated form data
            onPreview={handlePreview} // Pass preview handler
            onSendToVerify={handleSendToVerify} // Pass send handler
            // Assuming VoucherTemplate also accepts classes for its container/form/buttons
            // You would ideally pass classes like:
            // containerClass={voucherFormClasses} // Or a specific container class for the template
            // previewButtonClass={previewButtonClasses}
            // sendButtonClass={sendVerifyButtonClasses}
          />

           {/* The following form structure and buttons were in the original style block here.
               They should ideally be part of VoucherTemplate.jsx and styled with Tailwind there.
               Keeping the structure commented out to acknowledge the original source. */}
           {/* <div className="voucher-form">
              <div className="form-row">...</div>
              <div className="form-row">...</div>
              <div className="voucher-actions">
                  <button className="preview-button">Preview</button>
                  <button className="send-verify-button">Send to Verify</button>
              </div>
              <div className="form-footer">
                 <button className="back-button">Back</button>
              </div>
           </div> */}

        </div>
      </div>

      {/* The original <style jsx> and <style jsx global> blocks are removed */}
      {/* Ensure you have Tailwind CSS configured globally in your project */}
      {/* Add required animations (slideIn) and maybe global base styles in your main CSS file */}
    </div>
  );
}