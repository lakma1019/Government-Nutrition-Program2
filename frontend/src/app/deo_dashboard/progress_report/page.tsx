'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { processElementStyles } from '@/lib/colorUtils';

export default function GenerateProgressReportPage() {
  const [user, setUser] = useState<{id?: number; username?: string; role?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [reportData, setReportData] = useState({
    educationZone: "Tangalle",
    schoolName: "H/Heendeliya Model  School",
    supplierName: "", // Will be populated with active contractor name
    reportRows: [] as any[],
    principalSignature: "",
    principalDate: "",
    treasurerSignature: "",
    deputyDirectorSignature: "",
    zonalDirectorSignature: "",
    accountantSignature: "",
    approvedStudentsValue: "112" // Added for consistency, assuming it's a string
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Check if user is authenticated and is a data entry officer
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);

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

  // Fetch the active contractor
  const fetchActiveContractor = async () => {
    try {
      // Get the token from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        throw new Error('Authentication required');
      }

      const userData = JSON.parse(storedUser);
      const token = userData.token;

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('http://localhost:3001/api/contractors/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        // No active contractor found, use a default value
        setReportData(prev => ({
          ...prev,
          supplierName: "No Active Supplier"
        }));
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch active contractor: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setReportData(prev => ({
          ...prev,
          supplierName: result.data.full_name
        }));
      } else {
        throw new Error(result.message || 'Failed to fetch active contractor');
      }
    } catch (err) {
      console.error('Error fetching active contractor:', err);
      // Don't show this error to the user, just use a default value
      setReportData(prev => ({
        ...prev,
        supplierName: "Unknown Supplier"
      }));
    }
  };

  // Fetch daily data for the progress report
  const fetchDailyData = async () => {
    try {
      setDataLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/daily-data');

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const formattedData = result.data.map((row: any) => {
          let formattedDate = row.date;
          if (typeof row.date === 'string' && row.date.includes('T')) {
            const dateObj = new Date(row.date);
            dateObj.setDate(dateObj.getDate() + 1);
            formattedDate = dateObj.toISOString().split('T')[0];
          } else if (row.date instanceof Date) {
            const dateObj = new Date(row.date);
            dateObj.setDate(dateObj.getDate() + 1);
            formattedDate = dateObj.toISOString().split('T')[0];
          }

          return {
            id: row.id,
            date: formattedDate,
            female: row.female.toString(), // Changed from girls_attendance to female
            male: row.male.toString(), // Changed from boys_attendance to male
            total: row.total.toString(), // Changed from total_attendance to total
            unitPrice: row.unit_price.toString(),
            amount: row.amount.toString(), // Changed from total_price to amount
            methodReceived: row.method_of_rice_received,
            mealRecipe: row.meal_recipe,
            eggs: row.number_of_eggs.toString(),
            fruits: row.fruits || ''
          };
        });

        // Data is already sorted by date (oldest to newest) from the backend
        setReportData(prev => ({
          ...prev,
          reportRows: formattedData
        }));
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching daily data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setDataLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!reportContentRef.current) {
      alert('Report content not found. Cannot generate PDF.');
      return;
    }

    setPdfLoading(true);

    try {
      // Dynamically import html2pdf.js
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;

      // Clone the element to avoid modifying the original DOM
      const element = reportContentRef.current.cloneNode(true) as HTMLElement;

      // Process the element to replace OKLCH colors with HEX equivalents
      const replaceOklchColors = (element: HTMLElement) => {
        // Use our utility function to process all OKLCH colors
        processElementStyles(element);

        // Add additional inline styles for specific elements
        const addInlineStyles = () => {
          // Set explicit colors for the report content
          if (element.classList.contains('bg-white')) {
            element.style.backgroundColor = '#ffffff';
          }

          // Set text color for all text elements
          const textElements = element.querySelectorAll('p, h1, h2, h3, span, td, th');
          textElements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.color = '#000000';
            }
          });

          // Set border colors for table cells
          const tableCells = element.querySelectorAll('td, th');
          tableCells.forEach(cell => {
            if (cell instanceof HTMLElement) {
              cell.style.borderColor = '#000000';
            }
          });
        };

        // Apply inline styles
        addInlineStyles();

        return element;
      };

      // Process the element to replace oklch colors
      const processedElement = replaceOklchColors(element);

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const filename = `Monthly_Financial_Progress_Report_${dateStr}.pdf`;

      // Options for html2pdf.js
      const opt = {
        margin: [0.5, 0.2, 0.5, 0.2], // [top, right, bottom, left] in inches
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2, // Higher scale for better quality
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: true, // Allow cross-origin images
          backgroundColor: '#ffffff', // Ensure white background
          removeContainer: true, // Remove the cloned element after rendering
          foreignObjectRendering: false, // Disable foreignObject rendering which can cause issues
          imageTimeout: 15000, // Increase timeout for images
          onclone: (clonedDoc: Document) => {
            // Additional processing on the cloned document
            const styleElement = clonedDoc.createElement('style');
            styleElement.textContent = `
              * {
                color: #000000 !important;
                background-color: transparent !important;
                border-color: #000000 !important;
                font-family: serif !important;
              }
              table, th, td {
                border: 1px solid black !important;
                border-collapse: collapse !important;
              }
              th, td {
                padding: 8px !important;
                text-align: center !important;
              }
              body {
                background-color: white !important;
              }
              /* Preserve custom header heights */
              th[rowspan="2"]:nth-of-type(4) {
                height: 2.5em !important; /* Unit Price - 2 rows */
              }
              th[rowspan="2"]:nth-of-type(5) {
                height: 7em !important; /* Amount - 6 rows */
              }
              th[rowspan="2"]:nth-of-type(6) {
                height: 5em !important; /* Method of Rice Received - 4 rows */
              }
              th[rowspan="2"]:nth-of-type(7) {
                height: 2.5em !important; /* Meal Recipe - 2 rows */
              }
              tr:nth-child(2) th:nth-of-type(1) {
                height: 7em !important; /* Female - 6 rows */
              }
              tr:nth-child(2) th:nth-of-type(2) {
                height: 5em !important; /* Male - 4 rows */
              }
              tr:nth-child(2) th:nth-of-type(3) {
                height: 6em !important; /* Total - 5 rows */
              }
              /* Ensure column headers display vertically */
              th .flex-col {
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                height: 100% !important;
              }
            `;
            clonedDoc.head.appendChild(styleElement);
          }
        },
        jsPDF: {
          unit: 'in',
          format: 'a3',
          orientation: 'portrait',
          compress: true,
          precision: 16
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } // Helps with page breaks
      };

      try {
        // Use html2pdf to generate and download the PDF
        await html2pdf().from(processedElement).set(opt).save();
      } catch (htmlToPdfError) {
        console.error('Error with html2pdf, trying fallback approach:', htmlToPdfError);

        // Fallback approach: Use browser print functionality
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          throw new Error('Could not open print window. Please check your popup blocker settings.');
        }

        // Create a new HTML document for printing
        const createPrintDocument = (contentElement: HTMLElement) => {
          // Create the basic HTML structure
          const html = document.createElement('html');
          const head = document.createElement('head');
          const body = document.createElement('body');

          // Create and set the title
          const title = document.createElement('title');
          title.textContent = 'Monthly Financial Progress Report';
          head.appendChild(title);

          // Create and add the style element
          const style = document.createElement('style');
          style.textContent = `
            body {
              font-family: serif;
              color: black;
              background-color: white;
              padding: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid black;
              padding: 8px;
              text-align: center;
            }
            th {
              background-color: #f0f0f0;
            }
            h1, h2 {
              text-align: center;
              margin: 5px 0;
            }
            p {
              margin: 5px 0;
            }
            /* Custom header heights */
            th[rowspan="2"]:nth-of-type(4) {
              height: 2.5em; /* Unit Price - 2 rows */
            }
            th[rowspan="2"]:nth-of-type(5) {
              height: 7em; /* Amount - 6 rows */
            }
            th[rowspan="2"]:nth-of-type(6) {
              height: 5em; /* Method of Rice Received - 4 rows */
            }
            th[rowspan="2"]:nth-of-type(7) {
              height: 2.5em; /* Meal Recipe - 2 rows */
            }
            tr:nth-child(2) th:nth-of-type(1) {
              height: 7em; /* Female - 6 rows */
            }
            tr:nth-child(2) th:nth-of-type(2) {
              height: 5em; /* Male - 4 rows */
            }
            tr:nth-child(2) th:nth-of-type(3) {
              height: 6em; /* Total - 5 rows */
            }
            /* Ensure column headers display vertically */
            th div {
              display: flex;
              flex-direction: column;
              justify-content: center;
              height: 100%;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              button {
                display: none;
              }
            }
          `;
          head.appendChild(style);

          // Add the content to the body
          body.innerHTML = contentElement.innerHTML;

          // Create and add the print script
          const script = document.createElement('script');
          script.textContent = `
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 500);
            };
          `;
          body.appendChild(script);

          // Assemble the document
          html.appendChild(head);
          html.appendChild(body);

          return '<!DOCTYPE html>' + html.outerHTML;
        };

        // Generate the HTML content
        const htmlContent = createPrintDocument(processedElement);

        // Use a more modern approach to set the document content
        if (printWindow.document) {
          try {
            // Create a blob from the HTML content
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);

            // Navigate the window to the blob URL
            printWindow.location.href = blobUrl;

            // Set up a handler to revoke the URL after the window is loaded
            printWindow.onload = () => {
              // Focus the window to bring it to front
              printWindow.focus();

              // Clean up the blob URL after a delay to ensure it's loaded
              setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
              }, 1000);
            };
          } catch (blobError) {
            console.error('Error creating blob URL:', blobError);

            // Fallback to direct printing if blob approach fails
            window.print();
          }
        }
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

  useEffect(() => {
    if (!loading && user) {
      fetchActiveContractor();
      fetchDailyData();
    }
  }, [loading, user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
      setTimeout(() => {
        // Removed addRowBtn since we no longer need to add empty rows
        const tbody = document.getElementById('report-tbody');

        // Classes for table cell content (span) and table cells (td) and rows (tr)
        const cellContentClasses = "grow min-w-[50px] py-[0.2em] px-[0.5em] box-border";
        const tdClasses = "border border-black p-2 text-center align-middle h-[1.5em]";
        const trClasses = "print:break-inside-avoid";

        // Add inline styles for better PDF rendering
        const trStyleStr = `page-break-inside: avoid; page-break-after: auto;`;
        const tdStyleStr = `border: 1px solid black; padding: 8px; text-align: center; vertical-align: middle; height: 1.5em;`;

        // Removed code for adding empty rows and row removal functionality
        // since we only want to display actual data rows

        const educationZoneEl = document.getElementById('education-zone-value');
        const schoolNameEl = document.getElementById('school-name-value');
        const supplierNameEl = document.getElementById('supplier-name-value');
        const approvedStudentsEl = document.getElementById('approved-students-value'); // This ID is not present in the JSX.

        if (educationZoneEl) educationZoneEl.textContent = reportData.educationZone;
        if (schoolNameEl) schoolNameEl.textContent = reportData.schoolName;
        if (supplierNameEl) supplierNameEl.textContent = reportData.supplierName;
        // The original code had reportData.approvedStudentsValue which wasn't in state.
        // It also refers to an element with ID 'approved-students-value' which is not in the JSX.
        // I'll leave this as is, as it's an existing potential issue.
        if (approvedStudentsEl && reportData.approvedStudentsValue) approvedStudentsEl.textContent = reportData.approvedStudentsValue;


        if (tbody) {
          tbody.innerHTML = ''; // Clear existing rows
          // Data is already sorted by date (oldest to newest) from the backend
          const sortedData = reportData.reportRows;

          sortedData.forEach(row => {
            const newRow = document.createElement('tr');
            newRow.className = trClasses; // Apply classes to the <tr> element
            newRow.setAttribute('style', trStyleStr); // Apply inline styles for PDF
            const displayDate = row.date || '';
            newRow.innerHTML = `
              <td class="${tdClasses}" style="${tdStyleStr}"><span class="${cellContentClasses}" data-field="date">${displayDate}</span></td>
              <td class="${tdClasses}" style="${tdStyleStr}"><span class="${cellContentClasses}" data-field="female">${row.female || ''}</span></td>
              <td class="${tdClasses}" style="${tdStyleStr}"><span class="${cellContentClasses}" data-field="male">${row.male || ''}</span></td>
              <td class="${tdClasses}" style="${tdStyleStr}"><span class="${cellContentClasses}" data-field="total">${row.total || ''}</span></td>
              <td class="${tdClasses}" style="${tdStyleStr}"><span class="${cellContentClasses}" data-field="unitPrice">${row.unitPrice || ''}</span></td>
              <td class="${tdClasses}" style="${tdStyleStr}"><span class="${cellContentClasses}" data-field="amount">${row.amount || ''}</span></td>
              <td class="${tdClasses}" style="${tdStyleStr}"><span class="${cellContentClasses}" data-field="methodReceived">${row.methodReceived || ''}</span></td>
              <td class="${tdClasses}" style="${tdStyleStr}"><span class="${cellContentClasses}" data-field="mealRecipe">${row.mealRecipe || ''}</span></td>
              <td class="${tdClasses}" style="${tdStyleStr}"><span class="${cellContentClasses}" data-field="eggs">${row.eggs || ''}</span></td>
              <td class="${tdClasses}" style="${tdStyleStr}"><span class="${cellContentClasses}" data-field="fruits">${row.fruits || ''}</span></td>
            `;
            tbody.appendChild(newRow);
          });

          // Empty rows have been removed to make the report cleaner and more concise
        }
      }, 100);
    }
  }, [loading, reportData, user]); // Added user to dependency array as it might affect reportData indirectly or if used inside

  if (loading) {
    return (
      <div className="max-w-full min-h-screen p-5 bg-[#f8e6f3]">
        <div className="flex justify-center items-center h-screen text-2xl text-[#6c5ce7]">Loading...</div>
      </div>
    );
  }

  const reportValueBaseClasses = "grow min-w-[50px] py-[0.2em] px-[0.5em] box-border";
  const signatureValueBaseClasses = "border-b border-black w-full mb-2 py-[0.2em] box-border text-center block";


  return (
    <div className="max-w-full min-h-screen p-5 bg-[#f8e6f3] print:m-[1cm] print:text-black print:bg-white print:print-color-adjust-exact">
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center py-[15px] px-[25px] mb-5 bg-[#e6b3d9] rounded-lg shadow-[0_2px_5px_rgba(0,0,0,0.1)] print:hidden">
        <div className="text-xl font-bold text-[#333]">Government Nutrition Program</div>
        <div className="flex gap-[15px]">
          <Link href="/" className={`no-underline`}>
            <span className={`inline-block py-[5px] px-[15px] bg-white rounded-[20px] text-black text-sm font-bold transition-all duration-200 hover:bg-[#f0e0f0] ${pathname === "/" ? "bg-[#f0e0f0] border-2 border-[#d070d0]" : ""}`}>Home</span>
          </Link>
          <Link href="/about" className={`no-underline`}>
            <span className={`inline-block py-[5px] px-[15px] bg-white rounded-[20px] text-black text-sm font-bold transition-all duration-200 hover:bg-[#f0e0f0] ${pathname === "/about" ? "bg-[#f0e0f0] border-2 border-[#d070d0]" : ""}`}>About Program</span>
          </Link>
          <Link href="/login" className={`no-underline`}>
            <span className={`inline-block py-[5px] px-[15px] bg-white rounded-[20px] text-black text-sm font-bold transition-all duration-200 hover:bg-[#f0e0f0] ${pathname === "/login" ? "bg-[#f0e0f0] border-2 border-[#d070d0]" : ""}`}>Login</span>
          </Link>
          <Link href="/gazette" className={`no-underline`}>
            <span className={`inline-block py-[5px] px-[15px] bg-white rounded-[20px] text-black text-sm font-bold transition-all duration-200 hover:bg-[#f0e0f0] ${pathname === "/gazette" ? "bg-[#f0e0f0] border-2 border-[#d070d0]" : ""}`}>Gazett</span>
          </Link>
        </div>
      </nav>

      {/* Main Content wrapper */}
      <div className="flex bg-white rounded-[15px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.1)] border-2 border-[#0070f3] print:block print:border-none print:shadow-none">
        {/* Sidebar REMOVED */}
        {/*
        <div className="w-[200px] bg-[#f8e1f4] py-5 border-r-2 border-[#0070f3] print:hidden">
          ... sidebar content ...
        </div>
        */}

        {/* Main Panel */}
        <div className="flex-1 p-5 bg-white overflow-auto print:p-0 relative"> {/* Added relative positioning context */}

          {/* New Refresh Button */}
          <div className="absolute top-5 right-5 print:hidden z-20">
            <button
              onClick={fetchDailyData}
              disabled={dataLoading}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>

          <div className="max-w-full">
            {/* Report Template */}
            <div
              ref={reportContentRef}
              className="bg-white p-5 font-serif print:m-0 print:p-0"
              style={{
                pageBreakInside: 'auto',
                pageBreakAfter: 'auto',
                pageBreakBefore: 'auto'
              }}
            > {/* Note: This div also has p-5. Refresh button is relative to parent's p-5. */}
              <header className="text-center mb-4">
                <div className="header-title">
                  <h1 className="text-[1.4em] m-0">Government Nutrition Program for School Children</h1>
                  <h2 className="text-[1.2em] m-0">Monthly Financial Progress Report</h2>
                </div>
              </header>

              <section className="mb-4">
                <p className="my-2 flex items-center"><span className="shrink-0 mr-2">Education Zone :</span> <span id="education-zone-value" className={reportValueBaseClasses}>{reportData.educationZone}</span></p>
                <p className="my-2 flex items-center"><span className="shrink-0 mr-2">School Name :</span> <span id="school-name-value" className={reportValueBaseClasses}>{reportData.schoolName}</span></p>
                <div className="flex justify-between items-end flex-wrap">
                  <p className="my-2 grow min-w-[200px] flex items-center"><span className="shrink-0 mr-2">Supplier Name :</span> <span id="supplier-name-value" className={reportValueBaseClasses}>{reportData.supplierName}</span></p>
                  <p className="flex items-center whitespace-nowrap ml-8 shrink-0 min-w-[300px] my-2">
                    {/* The approvedStudentsValue was not in initial state. Assuming fixed values for example or fetch it too. */}
                    <span className="shrink-0 mr-2">Approved Number of Students = {reportData.approvedStudentsValue || '112'} Students</span>
                    <span className="shrink-0 mr-2">90% = 125</span>
                  </p>
                </div>
              </section>

              {/* Container for loading/error messages (old refresh button was here) */}
              <div className="flex items-center mb-4 print:hidden">
                {dataLoading && <span className="text-[#2196F3] font-bold">Loading data...</span>}
                {error && <span className="text-[#f44336] font-bold">Error: {error}</span>}
                {/* Old "Refresh Data" button REMOVED from here */}
              </div>

              <main className="overflow-x-auto mb-4 report-table">
                <table
                  className="w-full border-collapse min-w-[900px] print:w-full print:min-w-0"
                  style={{
                    pageBreakInside: 'auto',
                    borderSpacing: 0,
                    borderCollapse: 'collapse'
                  }}
                >
                  <thead className="sticky top-0 bg-white z-10 print:static print:bg-transparent" style={{ backgroundColor: 'white' }}>
                    <tr style={{ pageBreakInside: 'avoid', pageBreakAfter: 'auto' }}>
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap" style={{ border: '1px solid black', padding: '8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'normal', whiteSpace: 'nowrap', backgroundColor: '#f0f0f0' }}>Date</th>
                      <th colSpan={3} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap" style={{ border: '1px solid black', padding: '8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'normal', whiteSpace: 'nowrap', backgroundColor: '#f0f0f0' }}>Number of Students</th>
                      {/* Unit Price - 2 rows */}
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap" style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        fontWeight: 'normal',
                        whiteSpace: 'nowrap',
                        backgroundColor: '#f0f0f0',
                        height: '2.5em' // 2 rows height
                      }}>
                        <div className="flex-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                          <div>Unit</div>
                          <div>Price</div>
                        </div>
                      </th>
                      {/* Amount - 6 rows (one letter per row) */}
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap" style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        fontWeight: 'normal',
                        whiteSpace: 'nowrap',
                        backgroundColor: '#f0f0f0',
                        height: '7em' // 6 rows height
                      }}>
                        <div className="flex-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                          <div>A</div>
                          <div>m</div>
                          <div>o</div>
                          <div>u</div>
                          <div>n</div>
                          <div>t</div>
                        </div>
                      </th>
                      {/* Method of Rice Received - 4 rows */}
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap" style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        fontWeight: 'normal',
                        whiteSpace: 'nowrap',
                        backgroundColor: '#f0f0f0',
                        height: '5em' // 4 rows height
                      }}>
                        <div className="flex-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                          <div>Method</div>
                          <div>of</div>
                          <div>Rice</div>
                          <div>Received</div>
                        </div>
                      </th>
                      {/* Meal Recipe - 2 rows */}
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap" style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        fontWeight: 'normal',
                        whiteSpace: 'nowrap',
                        backgroundColor: '#f0f0f0',
                        height: '2.5em' // 2 rows height
                      }}>
                        <div className="flex-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                          <div>Meal</div>
                          <div>Recipe</div>
                        </div>
                      </th>
                      {/* Number of Eggs */}
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap" style={{ border: '1px solid black', padding: '8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'normal', whiteSpace: 'nowrap', backgroundColor: '#f0f0f0' }}>No. of Eggs</th>
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap" style={{ border: '1px solid black', padding: '8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'normal', whiteSpace: 'nowrap', backgroundColor: '#f0f0f0' }}>Fruits</th>
                    </tr>
                    <tr style={{ pageBreakInside: 'avoid', pageBreakAfter: 'auto' }}>
                      {/* Female - 6 rows */}
                      <th className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap" style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        fontWeight: 'normal',
                        whiteSpace: 'nowrap',
                        backgroundColor: '#f0f0f0',
                        height: '7em' // 6 rows height
                      }}>
                        <div className="flex-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                          <div>F</div>
                          <div>e</div>
                          <div>m</div>
                          <div>a</div>
                          <div>l</div>
                          <div>e</div>
                        </div>
                      </th>
                      {/* Male - 4 rows */}
                      <th className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap" style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        fontWeight: 'normal',
                        whiteSpace: 'nowrap',
                        backgroundColor: '#f0f0f0',
                        height: '5em' // 4 rows height
                      }}>
                        <div className="flex-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                          <div>M</div>
                          <div>a</div>
                          <div>l</div>
                          <div>e</div>
                        </div>
                      </th>
                      {/* Total - 5 rows */}
                      <th className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap" style={{
                        border: '1px solid black',
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                        fontWeight: 'normal',
                        whiteSpace: 'nowrap',
                        backgroundColor: '#f0f0f0',
                        height: '6em' // 5 rows height
                      }}>
                        <div className="flex-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                          <div>T</div>
                          <div>o</div>
                          <div>t</div>
                          <div>a</div>
                          <div>l</div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    id="report-tbody"
                    style={{
                      pageBreakInside: 'avoid',
                      pageBreakAfter: 'auto'
                    }}
                  >
                    {/* Rows populated by JS. TD and TR classes are now applied by the useEffect hook. */}
                  </tbody>
                </table>
              </main>

              <section className="mt-4 certification">
                <p className="mb-8">I certify that meals were provided every day as per the given meal plan, that they were included in the
                documents and that this was prepared accordingly.</p>

                <div className="flex justify-between mb-4 flex-wrap signature-block">
                  <div className="flex-1 mr-8 min-w-[200px] flex flex-col last:mr-0 signature-line">
                    <span id="principal-signature-value" className={signatureValueBaseClasses}></span>
                    <p className="my-[0.2em] text-center">Signature of the Principal</p>
                  </div>
                  <div className="flex-1 mr-8 min-w-[200px] flex flex-col last:mr-0 signature-line">
                    <span id="principal-date-value" className={`${signatureValueBaseClasses} w-auto min-w-[150px] inline-block`}></span>
                    <p className="my-[0.2em] text-center">Date</p>
                  </div>
                </div>

                <div className="flex justify-between mb-4 flex-wrap signature-block">
                  <div className="flex-1 mr-8 min-w-[200px] flex flex-col last:mr-0 signature-line basis-full grow-0 shrink-0 !mr-0">
                    <span id="treasurer-signature-value" className={signatureValueBaseClasses}></span>
                    <p className="my-[0.2em] text-center">Signature of the Treasurer of the School Development Society</p>
                  </div>
                </div>

                <div className="flex justify-between mt-8 flex-wrap recommend-approve-certify">
                  <div className="flex-1 mr-8 min-w-[180px] flex flex-col last:mr-0 signature-line">
                    <p className="my-[0.2em] text-center">I recommend.</p>
                    <span id="deputy-director-signature-value" className={signatureValueBaseClasses}></span>
                    <p className="my-[0.2em] text-center">Deputy Director of Education</p>
                    <p className="my-[0.2em] text-center">(Nutrition)</p>
                  </div>
                  <div className="flex-1 mr-8 min-w-[180px] flex flex-col last:mr-0 signature-line">
                    <p className="my-[0.2em] text-center">I approve.</p>
                    <span id="zonal-director-signature-value" className={signatureValueBaseClasses}></span>
                    <p className="my-[0.2em] text-center">Zonal Director of Education</p>
                  </div>
                  <div className="flex-1 mr-8 min-w-[180px] flex flex-col last:mr-0 signature-line">
                    <p className="my-[0.2em] text-center">I certify the expenditure.</p>
                    <span id="accountant-signature-value" className={signatureValueBaseClasses}></span>
                    <p className="my-[0.2em] text-center">Accountant</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center mt-5 print:hidden">
              <button
                type="button"
                className={`py-[10px] px-[30px] border-none rounded font-bold cursor-pointer text-base text-white flex items-center gap-2 ${pdfLoading ? 'bg-[#8bc34a] cursor-wait' : 'bg-[#4CAF50] hover:bg-[#45a049]'}`}
                onClick={handleDownload}
                disabled={pdfLoading}
              >
                {pdfLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-file-earmark-pdf" viewBox="0 0 16 16">
                      <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                      <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"/>
                    </svg>
                    Download as PDF
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-end mt-5 print:hidden">
              <button type="button" className="py-2 px-5 bg-white border border-[#ccc] rounded cursor-pointer hover:bg-gray-100" onClick={() => router.push('/deo_dashboard')}>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}