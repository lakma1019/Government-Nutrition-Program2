'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import VoucherTemplate from '@/components/deo_dashboard/VoucherTemplate'; 

export default function GenerateVoucherPage() {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const initializeFormData = () => {
    return {
      date: getCurrentDate(),
      schoolName: 'Sample School',
      schoolAddress: 'Sample Address, Colombo',
      principalName: 'Mr. Principal',
      voucherNumber: 'GV-' + Math.floor(1000 + Math.random() * 9000),
      totalAmount: 25000,
      description: 'School nutrition program funding'
    };
  };

  const [formData, setFormData] = useState(initializeFormData());

  useEffect(() => {
    // Simulate auth check
    console.log('Simulating auth check...');
    const timer = setTimeout(() => {
      console.log('Auth check simulation complete.');
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleSendToVerify = () => {
    console.log('Send to Verify button clicked. Voucher data:', formData);
    alert('Voucher sent to Verification Officer successfully!');
  };

  const handleRefresh = () => {
    setFormData(initializeFormData());
    console.log('Voucher data refreshed.');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-2xl text-[#6c5ce7] bg-[#f8e6f3]">
        Loading...
      </div>
    );
  }

  const containerClasses = "w-full min-h-screen p-5 bg-[#f8e6f3] font-sans flex flex-col";
  const navbarClasses = "flex justify-between items-center py-4 px-6 mb-5 bg-[#e6b3d9] rounded-lg shadow-md";
  const brandClasses = "text-xl font-bold text-gray-800";
  const navLinksClasses = "flex space-x-4";
  const navLinkBaseClasses = "inline-flex group";
  const linkTextBaseClasses = "inline-block py-1.5 px-4 bg-white rounded-full text-black text-sm font-bold transition-all duration-200 ease-in-out";
  const linkTextHoverClasses = "group-hover:bg-[#f0e0f0]";
  const linkTextHighlightClasses = "bg-[#f0e0f0] border-2 border-[#d070d0] !text-black";
  const welcomeHeaderClasses = "text-center mb-5 py-2 bg-[#f8e6f3] rounded-lg";
  const welcomeHeaderH1Classes = "text-xl font-semibold text-gray-800";

  // Updated: Removed flex-col md:flex-row, added relative for button positioning
  const dashboardContentClasses = "flex bg-white rounded-xl overflow-hidden shadow-lg border-2 border-[#0070f3] relative"; 
  

  const mainPanelClasses = "flex-1 p-5 bg-white"; // Will take full width of dashboardContentClasses

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

      {/* Main Content */}
      <div className={dashboardContentClasses}>
        {/* Refresh Button Added Here */}
        <button
          onClick={handleRefresh}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
          aria-label="Refresh voucher data"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>

        {/* Sidebar REMOVED */}
        
        {/* Main Panel - Now takes full width */}
        <div className={mainPanelClasses}>
          <VoucherTemplate
            formData={formData}
            onSendToVerify={handleSendToVerify}
          />
        </div>
      </div>
    </div>
  );
}