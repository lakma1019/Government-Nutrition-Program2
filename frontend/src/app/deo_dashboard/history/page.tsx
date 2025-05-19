'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/config';

// Define the Voucher type based on the database structure
interface Voucher {
  id: number;
  url_data: {
    downloadURL: string;
    fileName?: string;
    filePath?: string;
    contentType?: string;
    size?: number;
    uploadTime?: string;
  };
  deo_id: number;
  vo_id: number;
  status: 'pending' | 'approved' | 'rejected';
  comment: string | null;
  created_at: string;
  updated_at: string;
  deo_username?: string;
  vo_username?: string;
  deo_full_name?: string;
  vo_full_name?: string;
}

export default function VoucherHistoryPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<{id?: number; username?: string; role?: string} | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Add state for year and month filters
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Generate years for dropdown (from 2020 to 2050)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 31 }, (_, i) => (2020 + i).toString());

  // Months for dropdown
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (!storedUser || !storedToken) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);
        setToken(storedToken);

        // Check if user is a data entry officer
        if (userData.role !== 'dataEntryOfficer') {
          alert('Access denied. Only Data Entry Officers can access this page.');
          router.push('/');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Function to show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setError(type === 'error' ? message : null);
    // You could implement a toast notification here if desired
  };

  // Fetch vouchers data
  const fetchVouchers = useCallback(async (year?: string, month?: string) => {
    if (!token) {
      showNotification('error', 'Authentication required. Please log in.');
      return;
    }

    try {
      setLoading(true);
      setVouchers([]);
      setFilteredVouchers([]);

      // Build URL with query parameters for year and month filters
      let url = API_ENDPOINTS.VOUCHERS.BASE;
      const params = new URLSearchParams();

      if (year) {
        params.append('year', year);
      }

      if (month) {
        params.append('month', month);
      }

      // Append query parameters if any exist
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch vouchers: ${response.status} - ${data.message || responseText}`);
      }

      if (data.success && Array.isArray(data.data)) {
        setVouchers(data.data);
        setFilteredVouchers(data.data);
        setTotalPages(Math.ceil(data.data.length / itemsPerPage));
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch vouchers (API reported failure)');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Could not fetch vouchers: ${errorMessage}. Check API connection.`);
      setVouchers([]);
      setFilteredVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [token, itemsPerPage]);

  // Function to reset filters
  const resetFilters = () => {
    setSelectedYear('');
    setSelectedMonth('');
    if (token) {
      fetchVouchers();
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (token) {
      fetchVouchers();
    }
  }, [fetchVouchers, token]);

  // Fetch data when filters change
  useEffect(() => {
    if (token) {
      fetchVouchers(selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth, token]);

  // Filter vouchers based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredVouchers(vouchers);
      setTotalPages(Math.ceil(vouchers.length / itemsPerPage));
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = vouchers.filter(voucher =>
        (voucher.id && String(voucher.id).includes(lowercaseQuery)) ||
        (voucher.status && voucher.status.toLowerCase().includes(lowercaseQuery)) ||
        (voucher.deo_username && voucher.deo_username.toLowerCase().includes(lowercaseQuery)) ||
        (voucher.vo_username && voucher.vo_username.toLowerCase().includes(lowercaseQuery)) ||
        (voucher.url_data?.fileName && voucher.url_data.fileName.toLowerCase().includes(lowercaseQuery))
      );
      setFilteredVouchers(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    }
  }, [searchQuery, vouchers, itemsPerPage]);

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get current items for pagination
  const getCurrentItems = () => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredVouchers.slice(indexOfFirstItem, indexOfLastItem);
  };

  // Format file size for display
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Preview PDF file
  const handlePreviewPdf = (downloadURL: string) => {
    window.open(downloadURL, '_blank');
  };

  // CSS Classes
  const containerClasses = "min-h-screen bg-[#f8e6f3] p-5";
  const navbarClasses = "flex justify-between items-center py-[15px] px-[25px] mb-5 bg-[#e6b3d9] rounded-lg shadow-[0_2px_5px_rgba(0,0,0,0.1)]";
  const brandClasses = "text-xl font-bold text-[#333]";
  const navLinksClasses = "flex gap-[15px]";
  const navLinkBaseClasses = "no-underline";
  const linkTextBaseClasses = "inline-block py-[5px] px-[15px] bg-white rounded-[20px] text-black text-sm font-bold transition-all duration-200";
  const linkTextHoverClasses = "hover:bg-[#f0e0f0]";
  const linkTextHighlightClasses = "bg-[#f0e0f0] border-2 border-[#d070d0]";
  const mainContentClasses = "bg-white p-6 rounded-lg shadow-md";
  const pageHeaderClasses = "mb-6 border-b border-[#f0e0f0] pb-4";
  const pageHeaderH1Classes = "text-2xl font-bold text-[#333] mb-2";
  const pageHeaderPClasses = "text-[#666]";
  const controlsSectionClasses = "flex flex-wrap justify-between items-center mb-6";
  const searchContainerClasses = "flex items-center border border-[#e0e0e0] rounded-lg overflow-hidden";
  const searchInputClasses = "py-2 px-4 outline-none border-none flex-1";
  const searchButtonClasses = "bg-[#e6b3d9] text-white p-2 border-none";
  const searchIconClasses = "block w-5 h-5";
  const tableContainerClasses = "bg-white rounded-lg shadow-md overflow-x-auto";
  const dataTableClasses = "w-full border-collapse";
  const tableHeaderCellClasses = "px-6 py-3 text-left border-b border-gray-200 bg-purple-100 font-semibold text-purple-800 text-sm uppercase tracking-wider whitespace-nowrap";
  const tableDataCellClasses = "px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-200";
  const tableRowHoverClasses = "hover:bg-gray-50";
  const actionButtonBaseClasses = "inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150";
  const actionButtonViewClasses = `${actionButtonBaseClasses} bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500`;
  const paginationContainerClasses = "flex justify-between items-center mt-6";
  const paginationButtonsClasses = "flex gap-2";
  const paginationButtonBaseClasses = "px-3 py-1 border border-gray-300 rounded-md text-sm";
  const paginationButtonActiveClasses = "bg-purple-100 border-purple-300 text-purple-800";
  const paginationInfoClasses = "text-sm text-gray-600";
  const statusBadgeBaseClasses = "px-2 py-1 rounded-full text-xs font-medium";

  return (
    <div className={containerClasses}>
      {/* Navigation Bar */}
      <nav className={navbarClasses}>
        <div className={brandClasses}>Government Nutrition Program</div>
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
          <Link href="/" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses}`}>
              Logout
            </span>
          </Link>
          <Link href="/deo_dashboard" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname.startsWith("/deo_dashboard") ? linkTextHighlightClasses : ""}`}>
              Dashboard
            </span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className={mainContentClasses}>
        <div className={pageHeaderClasses}>
          <h1 className={pageHeaderH1Classes}>Voucher History</h1>
          <p className={pageHeaderPClasses}>View all voucher submissions and their status</p>
        </div>

        <div className={controlsSectionClasses}>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Year Filter */}
            <div className="flex items-center">
              <label htmlFor="year-filter" className="mr-2 text-sm font-medium text-gray-700">Year:</label>
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  // Reset month when year changes to prevent invalid combinations
                  setSelectedMonth('');
                }}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option
                    key={year}
                    value={year}
                    disabled={parseInt(year) > currentYear} // Disable future years
                  >
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center">
              <label htmlFor="month-filter" className="mr-2 text-sm font-medium text-gray-700">Month:</label>
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={!selectedYear} // Disable if no year is selected
              >
                <option value="">All Months</option>
                {months.map(month => {
                  // Disable future months for the current year
                  const isDisabled =
                    selectedYear === currentYear.toString() &&
                    parseInt(month.value) > new Date().getMonth() + 1;

                  return (
                    <option
                      key={month.value}
                      value={month.value}
                      disabled={isDisabled}
                    >
                      {month.label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Reset Filters Button */}
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Filters
            </button>
          </div>

          <div className={searchContainerClasses}>
            <input
              type="text"
              placeholder="Search by ID, status, username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={searchInputClasses}
            />
            <button className={searchButtonClasses}>
              <span className={searchIconClasses}>🔍</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-md bg-red-50 text-red-800 border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-800"></div>
          </div>
        ) : (
          <>
            <div className={tableContainerClasses}>
              <table className={dataTableClasses}>
                <thead>
                  <tr>
                    <th className={tableHeaderCellClasses}>ID</th>
                    <th className={tableHeaderCellClasses}>File Name</th>
                    <th className={tableHeaderCellClasses}>File Size</th>
                    <th className={tableHeaderCellClasses}>Upload Date</th>
                    <th className={tableHeaderCellClasses}>Status</th>
                    <th className={tableHeaderCellClasses}>Verification Officer</th>
                    <th className={tableHeaderCellClasses}>Comment</th>
                    <th className={tableHeaderCellClasses}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentItems().map((voucher) => (
                    <tr key={voucher.id} className={tableRowHoverClasses}>
                      <td className={tableDataCellClasses}>{voucher.id}</td>
                      <td className={tableDataCellClasses}>{voucher.url_data?.fileName || 'Unnamed File'}</td>
                      <td className={tableDataCellClasses}>{formatFileSize(voucher.url_data?.size)}</td>
                      <td className={tableDataCellClasses}>{formatDateForDisplay(voucher.created_at)}</td>
                      <td className={tableDataCellClasses}>
                        <span className={`${statusBadgeBaseClasses} ${getStatusBadgeClass(voucher.status)}`}>
                          {voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}
                        </span>
                      </td>
                      <td className={tableDataCellClasses}>{voucher.vo_full_name || voucher.vo_username || 'Not Assigned'}</td>
                      <td className={tableDataCellClasses}>{voucher.comment || 'No comment'}</td>
                      <td className={tableDataCellClasses}>
                        <button
                          onClick={() => handlePreviewPdf(voucher.url_data.downloadURL)}
                          className={actionButtonViewClasses}
                        >
                          View PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={paginationContainerClasses}>
              <div className={paginationInfoClasses}>
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredVouchers.length)} to {Math.min(currentPage * itemsPerPage, filteredVouchers.length)} of {filteredVouchers.length} entries
              </div>
              <div className={paginationButtonsClasses}>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`${paginationButtonBaseClasses} ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`${paginationButtonBaseClasses} ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum = currentPage;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`${paginationButtonBaseClasses} ${currentPage === pageNum ? paginationButtonActiveClasses : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`${paginationButtonBaseClasses} ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`${paginationButtonBaseClasses} ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Last
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );