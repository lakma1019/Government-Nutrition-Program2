'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FormNew1 from '@/components/deo_dashboard/FormNew1';
import FormNew2 from '@/components/deo_dashboard/FormNew2';

export default function GenerateVoucherPage() {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // VoucherTemplate state variables
  const [pdfLoading, setPdfLoading] = useState(false);
  const voucherContentRef = useRef<HTMLDivElement>(null);

  // State variables for PDF upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    message: string;
  }>({ type: null, message: '' });

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

  // State variables for PDF preview
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // State variables to store auto-populated field values from FormNew1
  const [debitParticulars, setDebitParticulars] = useState('');
  const [payableTo, setPayableTo] = useState('');
  const [authorityDescription, setAuthorityDescription] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [checkedBy, setCheckedBy] = useState('');

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

  // Function to get current month and year (from VoucherTemplate)
  const getCurrentMonthYear = () => {
    const date = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  // Function to fetch active contractor (from VoucherTemplate)
  const fetchActiveContractor = async () => {
    try {
      // Get the token from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        console.error('Authentication required');
        return;
      }

      const userData = JSON.parse(storedUser);
      const token = userData.token;

      if (!token) {
        console.error('Authentication token not found');
        return;
      }

      const response = await fetch('http://localhost:3001/api/contractors/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        // No active contractor found, use a default value
        setPayableTo("No Active Supplier");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch active contractor: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPayableTo(result.data.full_name);
      } else {
        throw new Error(result.message || 'Failed to fetch active contractor');
      }
    } catch (err) {
      console.error('Error fetching active contractor:', err);
      setPayableTo("Unknown Supplier");
    }
  };

  // Function to fetch active DEO (from VoucherTemplate)
  const fetchActiveDEO = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/user-details/active/deo');

      if (response.status === 404) {
        setPreparedBy("No Active DEO");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch active DEO: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPreparedBy(result.data.full_name);
      } else {
        throw new Error(result.message || 'Failed to fetch active DEO');
      }
    } catch (err) {
      console.error('Error fetching active DEO:', err);
      setPreparedBy("Unknown DEO");
    }
  };

  // Function to fetch active VO (from VoucherTemplate)
  const fetchActiveVO = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/user-details/active/vo');

      if (response.status === 404) {
        setCheckedBy("No Active VO");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch active VO: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setCheckedBy(result.data.full_name);
      } else {
        throw new Error(result.message || 'Failed to fetch active VO');
      }
    } catch (err) {
      console.error('Error fetching active VO:', err);
      setCheckedBy("Unknown VO");
    }
  };

  // Set up auto-filling on component mount (from VoucherTemplate)
  useEffect(() => {
    // Simulate auth check
    console.log('Simulating auth check...');
    const timer = setTimeout(() => {
      console.log('Auth check simulation complete.');
      setLoading(false);
    }, 500);

    // Set debit particulars and authority description
    const monthYear = getCurrentMonthYear();
    const nutritionText = `Nutritional Cost of ${monthYear}`;
    setDebitParticulars(nutritionText);
    setAuthorityDescription(nutritionText);

    // Fetch data for other fields
    fetchActiveContractor();
    fetchActiveDEO();
    fetchActiveVO();

    return () => clearTimeout(timer);
  }, []);

  // Pagination functions removed as we're showing both pages at once

  // PDF generation function with improved implementation
  const generatePDF = async () => {
    if (!voucherContentRef.current) {
      alert('Voucher content not found. Cannot generate PDF.');
      return;
    }

    setPdfLoading(true);

    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;

      // Create a container with proper styling
      const container = document.createElement('div');
      container.style.width = '850px';
      container.style.margin = '0 auto';
      container.style.backgroundColor = '#fff';
      // Add specific styles to prevent blank pages
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '0'; // No gap between forms

      // Clone original forms
      const clone1 = voucherContentRef.current.querySelector('.page1')!.cloneNode(true) as HTMLElement;
      const clone2 = voucherContentRef.current.querySelector('.page2')!.cloneNode(true) as HTMLElement;

      // Replace inputs with static content
      const replaceInputsWithValues = (element: HTMLElement) => {
        element.querySelectorAll('input').forEach(input => {
          const value = input.value || input.placeholder;
          const span = document.createElement('span');
          span.textContent = value;
          span.style.display = 'inline-block';
          span.style.minWidth = '100px';
          span.style.fontWeight = 'bold';
          span.style.padding= '4px';

          // Check if this is a rupees input with Sinhala text
          if (input.classList.contains('rupees-line') && input.hasAttribute('data-sinhala-text')) {
            const sinhalaText = input.getAttribute('data-sinhala-text');
            if (sinhalaText) {
              const sinhalaSpan = document.createElement('span');
              sinhalaSpan.textContent = `(${sinhalaText})`;
              sinhalaSpan.style.display = 'block';
              sinhalaSpan.style.fontFamily = "'Noto Sans Sinhala', Arial, sans-serif";
              sinhalaSpan.style.fontSize = '10pt';
              sinhalaSpan.style.fontWeight = 'normal';
              sinhalaSpan.style.marginTop = '5px';
              sinhalaSpan.style.textAlign = 'center';

              // Create a container for both spans
              const container = document.createElement('div');
              container.style.display = 'inline-block';
              container.style.position = 'relative';
              container.appendChild(span);
              container.appendChild(sinhalaSpan);

              input.parentNode?.replaceChild(container, input);
              return;
            }
          }

          input.parentNode?.replaceChild(span, input);
        });
      };

      // Process both forms
      [clone1, clone2].forEach(form => {
        replaceInputsWithValues(form);
        form.style.margin = '0';
        form.style.padding = '0';
        form.style.boxShadow = 'none';
        form.querySelectorAll('.form-container').forEach(el => {
          (el as HTMLElement).style.boxShadow = 'none';
          (el as HTMLElement).style.padding = '20px';
        });


      });

      // Set page break styles to avoid blank page
      // Instead of using both breakAfter and breakBefore which can cause a blank page,
      // we'll only use breakAfter on the first form
      clone1.style.breakAfter = 'page';
      // Remove breakBefore from the second form to prevent blank page
      clone2.style.breakBefore = 'auto';

      // Add fonts
      const fontStyles = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;700&family=Noto+Sans+Tamil:wght@400;700&display=swap');

          * {
            font-family: 'Noto Sans Sinhala', 'Noto Sans Tamil', Arial, sans-serif;
            box-sizing: border-box;
          }

          .sinhala-text { font-family: 'Noto Sans Sinhala', Arial, sans-serif; }
          .tamil-text { font-family: 'Noto Sans Tamil', Arial, sans-serif; }
          .english-text { font-family: Arial, sans-serif; }
        </style>
      `;

      container.innerHTML = fontStyles;
      container.appendChild(clone1);
      container.appendChild(clone2);

      // PDF configuration with optimized settings to prevent blank pages
      const opt = {
        margin: [10, 10],
        filename: `Voucher_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: {
          scale: 2,
          logging: true,
          useCORS: true,
          letterRendering: true,
          allowTaint: false,
          backgroundColor: '#FFFFFF',
          // Add onclone function to ensure proper styling
          onclone: (clonedDoc: Document) => {
            // Add specific styles to prevent blank pages
            const styleEl = clonedDoc.createElement('style');
            styleEl.textContent = `
              .page1, .page2 {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .page1 {
                page-break-after: always !important;
                break-after: page !important;
              }
              .page2 {
                page-break-before: auto !important;
                break-before: auto !important;
              }
            `;
            clonedDoc.head.appendChild(styleEl);
          }
        },
        jsPDF: {
          unit: 'mm',
          format: 'a3',
          orientation: 'portrait',
          compress: false
        },
        pagebreak: {
          mode: ['css', 'avoid-all'],
          // Avoid breaking inside these elements
          avoid: ['.form-container', '.voucher-page']
        }
      };
      try {
        // Generate and save PDF with a simpler approach
        // Using any type to avoid TypeScript errors with html2pdf.js
        const worker = (html2pdf() as any)
          .from(container)
          .set(opt)
          .save();

        await worker;
        console.log('PDF generation completed successfully');
      } catch (error) {
        console.error('PDF generation error:', error);
        alert('Failed to generate PDF. Please check the console for details.');
      } finally {
        setPdfLoading(false);
      }
    } catch (error) {
      console.error('Error generating PDF from HTML:', error);
      alert('Failed to generate PDF. Please try again or use the browser print function instead.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfLoading) {
      generatePDF();
    }
  };

  const handleSendToVerify = () => {
    // First generate the PDF
    generatePDF();

    // Then open the upload modal
    setUploadFile(null);
    setUploadProgress(0);
    setNotification({ type: null, message: '' });
    setShowUploadModal(true);
  };

  // Handle file change for the upload modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setNotification({ type: 'error', message: 'File size exceeds 10MB limit.' });
        setUploadFile(null);
        const fileInput = document.getElementById('voucherPdf') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        setUploadFile(file);
        setNotification({ type: null, message: '' });
      }
    } else {
      setUploadFile(null);
      if (notification.type === 'error' && notification.message.includes('size')) {
        setNotification({ type: null, message: '' });
      }
    }
  };

  // Handle upload submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadFile) {
      setNotification({ type: 'error', message: 'Please select a PDF file to upload' });
      return;
    }

    setNotification({ type: null, message: '' });
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/config/firebase');

      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileName = uploadFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `vouchers/${timestamp}_${randomString}_${fileName}`;

      console.log('[VOUCHER] Uploading file to Firebase:', filePath);

      const metadata = {
        contentType: uploadFile.type,
        customMetadata: {
          voucher_number: formData.voucherNumber || 'unknown',
          created_at: new Date().toISOString()
        }
      };

      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, uploadFile, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('[VOUCHER] Upload progress:', progress.toFixed(2), '%');
          setUploadProgress(progress);
        },
        (error) => {
          console.error('[VOUCHER] Upload error:', error);
          let errorMessage = 'Upload failed: ';

          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage += 'User doesn\'t have permission to access the storage';
              break;
            case 'storage/canceled':
              errorMessage += 'Upload was canceled';
              break;
            case 'storage/unknown':
              errorMessage += 'Unknown error occurred';
              break;
            default:
              errorMessage += error.message;
          }

          setNotification({ type: 'error', message: errorMessage });
          setIsUploading(false);
        },
        async () => {
          console.log('[VOUCHER] Upload completed successfully');

          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('[VOUCHER] Download URL:', downloadURL);

            // Get the token from localStorage
            const storedUser = localStorage.getItem('user');
            if (!storedUser) {
              console.error('Authentication required');
              setNotification({ type: 'error', message: 'Authentication required. Please log in again.' });
              setIsUploading(false);
              return;
            }

            const userData = JSON.parse(storedUser);
            const token = userData.token;
            const userId = userData.id || null;

            if (!token) {
              console.error('Authentication token not found');
              setNotification({ type: 'error', message: 'Authentication token not found. Please log in again.' });
              setIsUploading(false);
              return;
            }

            // Send voucher data to the server
            const response = await fetch('http://localhost:3001/api/vouchers', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                url_data: {
                  downloadURL: downloadURL,
                  fileName: uploadFile.name,
                  filePath: filePath,
                  contentType: uploadFile.type,
                  size: uploadFile.size,
                  uploadTime: new Date().toISOString()
                },
                deo_id: userId,
                status: 'pending'
              })
            });

            const result = await response.json();

            if (response.ok && result.success) {
              console.log('[VOUCHER] Metadata saved to database successfully:', result);
              setNotification({
                type: 'success',
                message: 'Voucher PDF uploaded and sent to Verification Officer successfully!'
              });

              // Save the PDF URL for preview
              setPdfUrl(downloadURL);

              // Close the modal after a short delay
              setTimeout(() => {
                setShowUploadModal(false);
                setUploadFile(null);
                const fileInput = document.getElementById('voucherPdf') as HTMLInputElement;
                if (fileInput) {
                  fileInput.value = '';
                }

                // Show the preview modal
                setShowPreviewModal(true);
              }, 2000);
            } else {
              console.warn('[VOUCHER] Failed to save metadata to database:', result);
              setNotification({
                type: 'warning',
                message: 'Voucher PDF uploaded but failed to save metadata to database. Please contact administrator.'
              });
            }
          } catch (err: any) {
            console.error('[VOUCHER] Error completing upload process:', err);
            setNotification({ type: 'error', message: `Error: ${err.message || 'Unknown error'}` });
          } finally {
            setIsUploading(false);
          }
        }
      );
    } catch (err: any) {
      console.error('[VOUCHER] Error starting upload:', err);
      setNotification({ type: 'error', message: `Error starting upload: ${err.message}` });
      setIsUploading(false);
    }
  };

  const handleRefresh = () => {
    setFormData(initializeFormData());
    console.log('Voucher data refreshed.');
  };

  // Function to handle PDF preview
  const handlePreviewPdf = () => {
    if (pdfUrl) {
      setShowPreviewModal(true);
    }
  };

  // Function to close the preview modal
  const closePreviewModal = () => {
    setShowPreviewModal(false);
  };

  // Function to reset filters
  const resetFilters = () => {
    setSelectedYear('');
    setSelectedMonth('');
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

        {/* Main Panel - Now takes full width */}
        <div className={mainPanelClasses}>
          {/* Voucher Template Content - Embedded directly */}
          <div className="voucher-template-container">
            {/* Filter Controls */}
            <div className="flex items-center justify-between mb-4 print:hidden">
              <div className="flex flex-wrap items-center gap-4">
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
            </div>

            <div className="voucher-controls">
              <div className="action-buttons">
                <button
                  className={`preview-button ${pdfLoading ? 'loading' : ''}`}
                  onClick={handleDownload}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <circle className="opacity-75" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="30 30" strokeDashoffset="0"></circle>
                      </svg>
                      Generating PDF...
                    </>
                  ) : (
                    'Download PDF'
                  )}
                </button>
                <button onClick={handleSendToVerify} className="send-verify-button">
                  Send to Verification
                </button>
                {pdfUrl && (
                  <button onClick={handlePreviewPdf} className="view-pdf-button">
                    View Uploaded PDF
                  </button>
                )}
              </div>
            </div>

            {/* Voucher content with ref for PDF generation - both forms shown at once */}
            <div ref={voucherContentRef} className="scrollable-forms-container">
              <div className="voucher-page page1">
                <FormNew1 selectedYear={selectedYear} selectedMonth={selectedMonth} />
              </div>
              <div className="voucher-page page2">
                <FormNew2 />
              </div>
            </div>

            {/* Styles for VoucherTemplate's own layout and controls */}
            <style jsx>{`
              /* Animation keyframes for modal */
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

              .voucher-template-container {
                background-color: #f0f0f0; /* Default background for the area holding the form */
                padding: 20px;
                border-radius: 8px;
                max-width: 100%;
              }

              .scrollable-forms-container {
                max-height: 800px; /* Set a maximum height for scrolling */
                overflow-y: auto; /* Enable vertical scrolling */
                overflow-x: auto; /* Enable horizontal scrolling if needed */
                padding-right: 10px; /* Add some padding for the scrollbar */
                scroll-behavior: smooth; /* Smooth scrolling */
                width: 100%; /* Ensure container takes full width */
              }

              /* Override form container widths to be consistent and responsive */
              :global(.form-container) {
                width: 100% !important;
                max-width: 800px !important; /* Consistent max-width for both forms */
                margin-left: auto !important;
                margin-right: auto !important;
                box-sizing: border-box !important;
              }

              /* Ensure tables fit within their containers */
              :global(.item-details-table table) {
                width: 100% !important;
                table-layout: fixed !important; /* Fixed table layout to prevent overflow */
                overflow-wrap: break-word !important; /* Allow text to wrap */
              }

              /* Adjust table column widths to prevent overflow */
              :global(.item-details-table .col-date) {
                width: 10% !important;
              }

              :global(.item-details-table .col-description) {
                width: 50% !important; /* Slightly reduced from 55% to give more space to other columns */
              }

              :global(.item-details-table .col-rate) {
                width: 10% !important;
              }

              :global(.item-details-table .col-amount) {
                width: 30% !important; /* Increased from 25% to accommodate content */
              }

              /* Fix the sub-columns in the amount column */
              :global(.item-details-table .sub-col-rs),
              :global(.item-details-table .sub-col-cts) {
                width: 15% !important; /* Adjusted from 12.5% to ensure they fit */
                text-align: center !important;
                padding: 2px !important; /* Reduce padding to save space */
              }

              :global(.item-details-table th),
              :global(.item-details-table td) {
                word-break: break-word !important; /* Allow words to break if needed */
                overflow-wrap: break-word !important;
                white-space: normal !important; /* Ensure text wraps */
              }

              .voucher-controls {
                display: flex;
                justify-content: flex-end; /* Align buttons to the right */
                margin-bottom: 20px;
                align-items: center;
              }

              .action-buttons {
                display: flex;
                gap: 10px;
              }

              .preview-button, .send-verify-button, .view-pdf-button {
                padding: 8px 15px;
                border: none;
                border-radius: 4px;
                font-weight: bold;
                cursor: pointer;
                color: white;
                margin-right: 10px; /* Consider removing if gap is sufficient */
              }
              .preview-button:last-child, .send-verify-button:last-child, .view-pdf-button:last-child {
                  margin-right: 0;
              }


              .preview-button {
                background-color: #4CAF50; /* Green */
              }

              .preview-button:hover {
                background-color: #45a049;
              }

              .send-verify-button {
                background-color: #2196F3; /* Blue */
              }

              .send-verify-button:hover {
                background-color: #0b7dda;
              }

              .view-pdf-button {
                background-color: #9c27b0; /* Purple */
              }

              .view-pdf-button:hover {
                background-color: #7b1fa2;
              }

              .voucher-page {
                /* Add spacing between the forms */
                margin-bottom: 40px;
                padding-bottom: 40px;
                border-bottom: 2px dashed #ccc;
                display: flex;
                justify-content: center; /* Center the form horizontally */
                width: 100%;
              }

              .voucher-page:last-child {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
              }

              /* Ensure the voucher content is properly centered and sized */
              :global(.voucher-page > div) {
                width: 100%;
                max-width: 800px; /* Match the form-container max-width */
              }

              /* Responsive styles for smaller screens */
              @media (max-width: 900px) {
                :global(.form-container) {
                  padding: 10px !important; /* Reduce padding on smaller screens */
                }

                :global(.item-details-table th),
                :global(.item-details-table td) {
                  padding: 3px !important; /* Reduce cell padding on smaller screens */
                  font-size: 11px !important; /* Slightly smaller font on smaller screens */
                }

                /* Adjust column widths for smaller screens */
                :global(.item-details-table .col-date) {
                  width: 12% !important;
                }

                :global(.item-details-table .col-description) {
                  width: 45% !important;
                }

                :global(.item-details-table .col-rate) {
                  width: 10% !important;
                }

                :global(.item-details-table .col-amount) {
                  width: 33% !important;
                }
              }

              /*
                IMPORTANT: The very large block of CSS that was here previously,
                which contained styles from FORM-NEW1.html and FORM-NEW2.html,
                has been REMOVED. Each form component (FormNew1, FormNew2)
                now contains its own <style jsx global> block.
              */
            `}</style>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreviewModal && pdfUrl && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl w-11/12 max-w-[90%] h-[90vh] overflow-hidden shadow-xl animate-modalSlideIn border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="m-0 text-[#6c5ce7] text-xl font-bold">Voucher PDF Preview</h2>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-600 transition-colors duration-300 w-10 h-10 flex items-center justify-center rounded-full hover:text-red-600 hover:bg-gray-100"
                onClick={closePreviewModal}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full border-none"
                title="Voucher PDF Preview"
              />
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between">
              <button
                onClick={closePreviewModal}
                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <a
                href={pdfUrl}
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl w-11/12 max-w-[550px] max-h-[90vh] overflow-y-auto shadow-xl animate-modalSlideIn border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="m-0 text-[#6c5ce7] text-xl font-bold">Upload Voucher PDF</h2>
              <button
                className="bg-none border-none text-2xl cursor-pointer text-gray-600 transition-colors duration-300 w-10 h-10 flex items-center justify-center rounded-full hover:text-red-600 hover:bg-gray-100"
                disabled={isUploading}
                onClick={() => {
                  if (!isUploading) {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setNotification({type: null, message: ''});
                  }
                }}
                style={{ opacity: isUploading ? 0.5 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}
              >
                ×
              </button>
            </div>
            <div className="p-8">
              {notification.type && (
                <div className={`flex flex-col p-4 mb-6 rounded-lg border relative ${
                  notification.type === 'success'
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : notification.type === 'warning'
                      ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <div className="flex items-center">
                    <span className="mr-3 flex-shrink-0">
                      {notification.type === 'success'
                        ? '✅'
                        : notification.type === 'warning'
                          ? '⚠️'
                          : '❌'}
                    </span>
                    <span className="flex-grow">{notification.message}</span>
                    <button
                      className="text-gray-500 hover:text-gray-700 text-xl font-bold cursor-pointer"
                      onClick={() => setNotification({type: null, message: ''})}
                    >
                      ×
                    </button>
                  </div>

                  {notification.type === 'success' && pdfUrl && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handlePreviewPdf}
                        className="py-1.5 px-3 bg-[#6c5ce7] text-white text-sm rounded-md font-medium hover:bg-[#5a4ecc] transition-colors"
                      >
                        View PDF
                      </button>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleUploadSubmit}>
                <div className="mb-7">
                  <label htmlFor="voucherPdf" className="block mb-3 font-semibold text-gray-700 text-sm">PDF File*</label>
                  <div className="relative flex flex-col w-full">
                    <input
                      type="file"
                      id="voucherPdf"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                      className={`py-3 px-4 bg-gray-50 border border-dashed border-gray-400 rounded-lg cursor-pointer transition-all duration-300 hover:bg-gray-100 hover:border-[#6c5ce7] ${uploadFile ? 'text-transparent pb-10' : ''}`}
                    />
                    {uploadFile && (
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-100 py-2 px-3 rounded-b-lg flex justify-between items-center border-t border-blue-300">
                        <span className="text-sm text-blue-700 truncate max-w-[80%]">{uploadFile.name}</span>
                        <button
                          type="button"
                          className="bg-red-500 text-white border-none rounded-full w-5 h-5 flex items-center justify-center cursor-pointer text-sm leading-none hover:bg-red-600"
                          onClick={() => {
                            setUploadFile(null);
                            const fileInput = document.getElementById('voucherPdf') as HTMLInputElement;
                            if (fileInput) {
                              fileInput.value = '';
                            }
                            if (notification.type === 'error' && notification.message.includes('size')) {
                              setNotification({ type: null, message: '' });
                            }
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-gray-600 flex items-center gap-1">Only PDF files are allowed (max 10MB)</p>
                </div>

                {isUploading && (
                  <div className="mt-4 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Progress: {uploadProgress.toFixed(0)}%
                    </label>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-[#6c5ce7] h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between gap-4 mt-8">
                  <button
                    type="submit"
                    className="bg-[#6c5ce7] text-white border-none py-3 px-7 rounded-lg font-semibold cursor-pointer transition-all duration-300 flex-1 hover:bg-[#5a4ecc] shadow-md"
                    disabled={!uploadFile || isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload & Send to Verification'}
                  </button>
                  <button
                    type="button"
                    className="bg-gray-100 text-gray-700 border border-gray-300 py-3 px-7 rounded-lg font-semibold cursor-pointer transition-all duration-300 flex-1 hover:bg-gray-200"
                    disabled={isUploading}
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFile(null);
                      setNotification({type: null, message: ''});
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

