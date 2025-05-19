'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface UrlData {
  downloadURL: string;
  fileName?: string;
  filePath?: string;
  contentType?: string;
  size?: number;
  uploadTime?: string;
}

interface Voucher {
  id: number;
  url_data: UrlData | string;
  file_path?: string; // For backward compatibility
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

export default function VOVoucherPage() {
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'approved' | 'rejected'>('approved');
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const pathname = usePathname();

  // PDF Preview state variables
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Fetch vouchers on component mount
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        // Get the token from localStorage
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          console.error('Authentication required');
          setLoading(false);
          return;
        }

        const userData = JSON.parse(storedUser);
        const token = userData.token;

        if (!token) {
          console.error('Authentication token not found');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:3001/api/vouchers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch vouchers: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setVouchers(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch vouchers');
        }
      } catch (err) {
        console.error('Error fetching vouchers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  const handleViewVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    // Reset form when selecting a new voucher
    setVerificationStatus('approved');
    setComment('');

    // If the voucher has url_data with downloadURL, set it for preview
    if (voucher.url_data) {
      let urlData: UrlData;
      if (typeof voucher.url_data === 'string') {
        try {
          urlData = JSON.parse(voucher.url_data);
        } catch (e) {
          console.error('Error parsing URL data:', e);
          urlData = { downloadURL: voucher.url_data };
        }
      } else {
        urlData = voucher.url_data;
      }

      if (urlData.downloadURL) {
        setPreviewUrl(urlData.downloadURL);
      } else if (voucher.file_path) {
        // Fallback to file_path for backward compatibility
        setPreviewUrl(voucher.file_path);
      }
    } else if (voucher.file_path) {
      setPreviewUrl(voucher.file_path);
    }
  };



  const handleVerifyVoucher = async () => {
    if (!selectedVoucher) return;

    setActionLoading(true);

    try {
      // Get the token from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        console.error('Authentication required');
        alert('Authentication required. Please log in again.');
        setActionLoading(false);
        return;
      }

      const userData = JSON.parse(storedUser);
      const token = userData.token;

      if (!token) {
        console.error('Authentication token not found');
        alert('Authentication token not found. Please log in again.');
        setActionLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:3001/api/vouchers/${selectedVoucher.id}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: verificationStatus,
          comment: comment
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`Voucher ${verificationStatus === 'approved' ? 'approved' : 'rejected'} successfully!`);

        // Update the voucher in the list
        setVouchers(vouchers.map(v =>
          v.id === selectedVoucher.id
            ? { ...v, status: verificationStatus, comment: comment }
            : v
        ));

        // Reset form
        setSelectedVoucher(null);
        setVerificationStatus('approved');
        setComment('');
      } else {
        throw new Error(result.message || `Failed to ${verificationStatus} voucher`);
      }
    } catch (err: any) {
      console.error(`Error ${verificationStatus} voucher:`, err);
      alert(`Failed to ${verificationStatus} voucher: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
  const linkTextHighlightClasses = "bg-[#f0e0f0] border-2 border-[#d070d0] !text-black";
  const dashboardContentClasses = "flex bg-white rounded-xl overflow-hidden shadow-lg border-2 border-[#0070f3]";
  const mainPanelClasses = "flex-1 p-5 bg-white";

  return (
    <div className={containerClasses}>
      {/* Add animation styles */}
      <style jsx>{styles}</style>
      {/* Navigation Bar */}
      <nav className={navbarClasses}>
        <div className={brandClasses}>Government Nutrition Program</div>
        <div className={navLinksClasses}>
          <Link href="/vo_dashboard" className={`${navLinkBaseClasses} ${pathname === "/vo_dashboard" ? linkTextHighlightClasses : ""}`}>
            <span className={linkTextBaseClasses}>Dashboard</span>
          </Link>
          <Link href="/vo_dashboard/profile" className={`${navLinkBaseClasses} ${pathname === "/vo_dashboard/profile" ? linkTextHighlightClasses : ""}`}>
            <span className={linkTextBaseClasses}>Profile</span>
          </Link>
          <Link href="/" className={navLinkBaseClasses}>
            <span className={linkTextBaseClasses}>Logout</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className={dashboardContentClasses}>
        <div className={mainPanelClasses}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Voucher Verification</h1>
            <p className="text-gray-600">Review and verify vouchers submitted by Data Entry Officers.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vouchers List */}
            <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Vouchers</h2>

              {vouchers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No vouchers found
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {vouchers.map((voucher) => (
                    <div
                      key={voucher.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedVoucher?.id === voucher.id
                          ? 'bg-blue-50 border-blue-300'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => handleViewVoucher(voucher)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">Voucher #{voucher.id}</div>
                        {getStatusBadge(voucher.status)}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        From: {voucher.deo_full_name || voucher.deo_username || 'Unknown DEO'}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          {formatDate(voucher.created_at)}
                        </div>

                        {/* Quick Preview Button */}
                        {(voucher.url_data || voucher.file_path) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the parent onClick

                              // Set the selected voucher first
                              handleViewVoucher(voucher);

                              // Then open the preview modal
                              setTimeout(() => {
                                setShowPreviewModal(true);
                              }, 100);
                            }}
                            className="text-xs px-2 py-1 bg-[#6c5ce7] text-white rounded hover:bg-[#5a4ecc] transition-colors"
                          >
                            Preview
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Voucher Details and Verification Form */}
            <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow border border-gray-200">
              {selectedVoucher ? (
                <div>
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Voucher Details</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Voucher ID</p>
                        <p className="font-medium">{selectedVoucher.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p>{getStatusBadge(selectedVoucher.status)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Submitted By</p>
                        <p className="font-medium">{selectedVoucher.deo_full_name || selectedVoucher.deo_username || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Submitted On</p>
                        <p className="font-medium">{formatDate(selectedVoucher.created_at)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">File Information</p>
                        {previewUrl ? (
                          <div>
                            <p className="font-medium break-all mb-1">
                              {typeof selectedVoucher.url_data === 'object' && selectedVoucher.url_data.fileName ? (
                                <>File Name: {selectedVoucher.url_data.fileName}</>
                              ) : (
                                <>Download URL: {previewUrl}</>
                              )}
                            </p>
                            {typeof selectedVoucher.url_data === 'object' && (
                              <div className="text-xs text-gray-500 mt-1">
                                {selectedVoucher.url_data.uploadTime && (
                                  <p>Uploaded: {new Date(selectedVoucher.url_data.uploadTime).toLocaleString()}</p>
                                )}
                                {selectedVoucher.url_data.size && (
                                  <p>Size: {Math.round(selectedVoucher.url_data.size / 1024)} KB</p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="font-medium break-all">{selectedVoucher.file_path || 'No file information available'}</p>
                        )}
                      </div>
                      {selectedVoucher.comment && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Previous Comment</p>
                          <p className="italic">{selectedVoucher.comment}</p>
                        </div>
                      )}
                    </div>

                    {/* Voucher Preview */}
                    <div className="border rounded-lg p-4 mb-6 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-md font-semibold">Voucher Preview</h3>
                        {previewUrl && (
                          <button
                            onClick={() => setShowPreviewModal(true)}
                            className="px-3 py-1.5 bg-[#6c5ce7] text-white rounded-md text-sm font-medium hover:bg-[#5a4ecc] transition-colors"
                          >
                            Open PDF Preview
                          </button>
                        )}
                      </div>

                      {previewUrl ? (
                        <div className="h-64 border rounded overflow-hidden bg-white">
                          <iframe
                            src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            className="w-full h-full border-none"
                            title="Voucher PDF Preview"
                          />
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-500 mb-2">No PDF available for preview</p>
                          <p className="text-sm text-gray-400">
                            The voucher does not have an associated PDF file
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Verification Form */}
                    {selectedVoucher.status === 'pending' ? (
                      <div>
                        <h3 className="text-md font-semibold mb-3">Verify Voucher</h3>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Verification Status
                          </label>
                          <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                className="form-radio text-blue-600"
                                name="status"
                                value="approved"
                                checked={verificationStatus === 'approved'}
                                onChange={() => setVerificationStatus('approved')}
                              />
                              <span className="ml-2">Approve</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                className="form-radio text-red-600"
                                name="status"
                                value="rejected"
                                checked={verificationStatus === 'rejected'}
                                onChange={() => setVerificationStatus('rejected')}
                              />
                              <span className="ml-2">Reject</span>
                            </label>
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comment {verificationStatus === 'rejected' && <span className="text-red-500">*</span>}
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={verificationStatus === 'rejected' ? "Please provide a reason for rejection" : "Optional comment"}
                            required={verificationStatus === 'rejected'}
                          ></textarea>
                        </div>
                        <div className="flex justify-end">
                          <button
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-2 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            onClick={() => setSelectedVoucher(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 ${
                              verificationStatus === 'approved'
                                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                            }`}
                            onClick={handleVerifyVoucher}
                            disabled={actionLoading || (verificationStatus === 'rejected' && !comment)}
                          >
                            {actionLoading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="30 30" strokeDashoffset="0"></circle>
                                </svg>
                                Processing...
                              </>
                            ) : (
                              verificationStatus === 'approved' ? 'Approve Voucher' : 'Reject Voucher'
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-center text-gray-600">
                          This voucher has already been {selectedVoucher.status}.
                          {selectedVoucher.comment && (
                            <span className="block mt-2 italic">
                              "{selectedVoucher.comment}"
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p className="text-gray-500 text-lg">Select a voucher to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl w-11/12 max-w-[90%] h-[90vh] overflow-hidden shadow-xl animate-modalSlideIn border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="m-0 text-[#6c5ce7] text-xl font-bold">Voucher PDF Preview</h2>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-600 transition-colors duration-300 w-10 h-10 flex items-center justify-center rounded-full hover:text-red-600 hover:bg-gray-100"
                onClick={() => setShowPreviewModal(false)}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full border-none"
                title="Voucher PDF Preview"
              />
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-4 bg-[#6c5ce7] text-white rounded-md font-medium hover:bg-[#5a4ecc] transition-colors"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add keyframe animations for modal
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalSlideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

.animate-modalSlideIn {
  animation: modalSlideIn 0.3s ease-out forwards;
}
`;