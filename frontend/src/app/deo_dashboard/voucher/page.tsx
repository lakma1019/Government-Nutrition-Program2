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

  // PDF generation function (from VoucherTemplate)
  const generatePDF = async () => {
    if (!voucherContentRef.current) {
      alert('Voucher content not found. Cannot generate PDF.');
      return;
    }

    setPdfLoading(true);

    try {
      // Dynamically import html2pdf.js
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;

      // Create a container for both pages
      const container = document.createElement('div');

      // We need to temporarily render both pages to capture them
      // We'll handle page state during PDF generation

      // Create a temporary container to render both forms
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);

      // Instead of rendering React components, we'll directly create HTML with the auto-populated values
      // First, let's get the current visible form to use as a template
      const visibleForm = voucherContentRef.current.querySelector('.voucher-page') as HTMLElement;
      if (!visibleForm) {
        throw new Error('No visible form found');
      }

      // Create a container for both forms
      const form1Container = document.createElement('div');
      form1Container.className = 'temp-form1';
      tempContainer.appendChild(form1Container);

      // Clone the visible form as a starting point
      const form1Clone = document.createElement('div');
      form1Clone.className = 'voucher-page page1';

      // Get the FormNew1 HTML structure
      const formNew1HTML = document.querySelector('.page1') || document.createElement('div');
      form1Clone.innerHTML = formNew1HTML.innerHTML;

      // Create the second form container
      const form2Container = document.createElement('div');
      form2Container.className = 'temp-form2';
      tempContainer.appendChild(form2Container);

      // Clone the FormNew2 structure
      const form2Clone = document.createElement('div');
      form2Clone.className = 'voucher-page page2';

      // Since both pages are now visible at once, we can capture them directly
      console.log('Capturing page 1 content');
      const page1Content = document.querySelector('.page1');
      if (page1Content) {
        // Clone the entire page1 with all its content and styles
        form1Clone.innerHTML = page1Content.innerHTML;
      } else {
        throw new Error('Page 1 content not found');
      }

      console.log('Capturing page 2 content');
      const page2Content = document.querySelector('.page2');
      if (page2Content) {
        console.log('Page 2 content found, cloning it with all styles');
        // Clone the entire page including all styles
        form2Clone.innerHTML = page2Content.innerHTML;
      } else {
        console.error('Page 2 content not found');
        throw new Error('Page 2 content not found');
      }

      // Wait for the render to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Now we'll manually update the auto-populated fields in the cloned form1
      // This is more reliable than trying to render a React component in a detached DOM

      // Enhanced function to update input values in the cloned form
      // This adds both input values and visible text elements to ensure PDF capture
      const updateFormValues = (form: HTMLElement) => {
        // Helper function to update an input and add a visible text element
        const updateInputWithVisibleText = (
          selector: string,
          value: string,
          parent: HTMLElement
        ) => {
          const input = parent.querySelector(selector) as HTMLInputElement;
          if (input) {
            // Update the input value
            input.value = value;
            input.setAttribute('value', value);

            // Create a visible text element that will definitely show in the PDF
            const textDiv = document.createElement('div');
            textDiv.textContent = value;
            textDiv.style.position = 'absolute';
            textDiv.style.left = '0';
            textDiv.style.top = '0';
            textDiv.style.width = '100%';
            textDiv.style.height = '100%';
            textDiv.style.display = 'flex';
            textDiv.style.alignItems = 'center';
            textDiv.style.justifyContent = 'flex-start';
            textDiv.style.paddingLeft = '5px';
            textDiv.style.pointerEvents = 'none';
            textDiv.style.color = '#000';
            textDiv.style.fontWeight = 'normal';
            textDiv.style.fontSize = '12pt';
            textDiv.style.fontFamily = 'Arial, sans-serif';
            textDiv.style.zIndex = '999';

            // Create a wrapper to position the text properly
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';
            wrapper.style.width = '100%';
            wrapper.style.height = '100%';

            // Replace the input with our wrapper containing both input and text
            if (input.parentNode) {
              wrapper.appendChild(input.cloneNode(true));
              wrapper.appendChild(textDiv);
              input.parentNode.replaceChild(wrapper, input);
            }
          }
        };

        // Update all the auto-populated fields
        updateInputWithVisibleText('.detail-line:nth-child(2) .input-line', debitParticulars, form);
        updateInputWithVisibleText('.detail-line:nth-child(3) .input-line', payableTo, form);
        updateInputWithVisibleText('.authority-text-cell .input-line', authorityDescription, form);
        updateInputWithVisibleText('.prep-line:nth-child(1) .input-line', preparedBy, form);
        updateInputWithVisibleText('.prep-line:nth-child(2) .input-line', checkedBy, form);
      };

      // Update the values in the form1Clone
      updateFormValues(form1Clone);

      // Add the cloned forms to their containers
      form1Container.appendChild(form1Clone);
      form2Container.appendChild(form2Clone);

      // Wait for the forms to render
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create the final pages for the PDF with exact styling preservation
      console.log('Creating final pages for PDF with preserved styling');

      // Create page 1 (FormNew1)
      const page1 = document.createElement('div');
      page1.className = 'voucher-page page1';

      // Use the form1Clone directly since it already has the complete content with styles
      console.log('Adding form1 content to page1');
      // We need to extract the form-container from form1Clone
      const form1ContainerElement = form1Clone.querySelector('.form-container');
      if (form1ContainerElement) {
        // Deep clone to preserve all styles and attributes
        page1.appendChild(form1ContainerElement.cloneNode(true));
      } else {
        console.error('Form container not found in form1Clone, using innerHTML as fallback');
        // Fallback to using the innerHTML directly
        const formContainer = document.createElement('div');
        formContainer.className = 'form-container';
        formContainer.innerHTML = form1Clone.innerHTML;
        page1.appendChild(formContainer);
      }

      // Create page 2 (FormNew2)
      const page2 = document.createElement('div');
      page2.className = 'voucher-page page2';

      // Use the form2Clone directly since it already has the complete content with styles
      console.log('Adding form2 content to page2');
      // We need to extract the form-container from form2Clone
      const form2ContainerElement = form2Clone.querySelector('.form-container');
      if (form2ContainerElement) {
        // Deep clone to preserve all styles and attributes
        page2.appendChild(form2ContainerElement.cloneNode(true));
      } else {
        console.error('Form container not found in form2Clone, using innerHTML as fallback');
        // Fallback to using the innerHTML directly
        const formContainer = document.createElement('div');
        formContainer.className = 'form-container';
        formContainer.innerHTML = form2Clone.innerHTML;
        page2.appendChild(formContainer);
      }

      // Verify that the pages are different
      if (page1.innerHTML === page2.innerHTML) {
        console.error('WARNING: Page 1 and Page 2 have identical content!');
      } else {
        console.log('Verified: Page 1 and Page 2 have different content');
      }

      // Log the structure of both pages for debugging
      console.log('Page 1 structure:', page1.innerHTML.substring(0, 100) + '...');
      console.log('Page 2 structure:', page2.innerHTML.substring(0, 100) + '...');

      // Clean up temporary elements
      document.body.removeChild(tempContainer);

      // Add both pages to the container
      container.appendChild(page1);
      container.appendChild(page2);

      // We've already applied text content in the updateFormValues function
      // No need for additional text nodes here

      // Add necessary styles
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .voucher-page {
          page-break-after: always;
          background-color: white;
          margin-bottom: 20px;
        }
        .voucher-page:last-child {
          page-break-after: avoid;
          margin-bottom: 0;
        }
        .voucher-page.page1 {
          margin-bottom: 50px; /* Extra space after first page */
        }
        .voucher-page.page2 {
          padding-top: 20px; /* Space at top of second page */
        }

        /* Special styles for FormNew2 content in PDF */
        .pdf-page-2 .form-container {
          font-family: var(--primary-font);
          color: var(--text-color);
        }

        /* Ensure FormNew2 specific elements are properly styled */
        .pdf-page-2 .form-section,
        .pdf-page-2 .witnesses-section,
        .pdf-page-2 .stamp-and-signature-area-right,
        .pdf-page-2 .paying-officer-boxed-section,
        .pdf-page-2 .warrant-section,
        .pdf-page-2 .form-footer {
          display: block !important;
          visibility: visible !important;
        }
        @media print {
          .form-container {
            padding: 20px;
            background-color: white;
            box-shadow: none;
            border: none;
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
          }
          body {
            background-color: white;
          }
          /* Copy all styles from both forms to ensure they render correctly */
          :root {
            --primary-font: 'Noto Sans Sinhala', 'Noto Sans Tamil', 'Roboto', Arial, sans-serif;
            --text-color: #000000;
            --line-color: #333333;
            --border-color: #cccccc;
            --stamp-box-border-color: #333333;
            --font-size-normal: 10pt;
            --font-size-small: 8pt;
            --font-size-x-small: 7.5pt;
            --font-size-large-brace: 3.8em;
            --spacing-unit: 8px;
            --line-height-normal: 1.5;
            --line-height-tight: 1.25;
            --line-height-very-tight: 1.1;
            --dot-vertical-offset: -4px;
            --primary-text-color: #000000;
            --background-color: #ffffff;
            --light-grey-background: #f0f0f0;
            --form-width: 850px;
            --font-size-large: 18px;
            --font-size-xlarge: 24px;
            --font-family-sinhala: 'Noto Sans Sinhala', 'Iskoola Pota', Arial, sans-serif;
            --font-family-tamil: 'Noto Sans Tamil', 'Latha', Arial, sans-serif;
            --font-family-english: Arial, Helvetica, sans-serif;
            --font-family-brace: 'Times New Roman', Times, serif;
          }
        }
      `;
      container.appendChild(styleElement);

      // Copy all stylesheets from the document to ensure proper styling
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(styleSheet => {
        container.appendChild(styleSheet.cloneNode(true));
      });

      // Ensure FormNew2 styles are included
      // This is critical for proper rendering of page 2
      const formNew2Styles = document.querySelectorAll('.page2 style');
      if (formNew2Styles.length > 0) {
        console.log('Found FormNew2 styles, adding them to the container');
        formNew2Styles.forEach(styleSheet => {
          container.appendChild(styleSheet.cloneNode(true));
        });
      } else {
        console.warn('No FormNew2 styles found, page 2 may not render correctly');
      }

      // Get current date for filename
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `Voucher_${dateStr}.pdf`;

      // Enhanced options for html2pdf.js with better rendering settings
      const opt = {
        margin: [0.5, 0.2, 0.5, 0.2], // [top, right, bottom, left] in inches
        filename: filename,
        image: { type: 'jpeg', quality: 1.0 }, // Maximum quality
        html2canvas: {
          scale: 3, // Higher scale for better quality and text rendering
          useCORS: true,
          logging: true, // Enable logging for debugging
          letterRendering: true,
          allowTaint: true, // Allow cross-origin images
          backgroundColor: '#ffffff', // Ensure white background
          removeContainer: true, // Remove the cloned element after rendering
          foreignObjectRendering: false, // Disable foreignObject rendering which can cause issues
          imageTimeout: 30000, // Increase timeout for images
          onclone: function(clonedDoc: Document) {
            // Force all input values to be visible in the cloned document
            const inputs = clonedDoc.querySelectorAll('input[type="text"]') as NodeListOf<HTMLInputElement>;
            inputs.forEach(input => {
              // Create a visible text element that shows the input value
              if (input.value) {
                const textSpan = clonedDoc.createElement('span');
                textSpan.textContent = input.value;
                textSpan.style.position = 'absolute';
                textSpan.style.left = '0';
                textSpan.style.top = '0';
                textSpan.style.width = '100%';
                textSpan.style.height = '100%';
                textSpan.style.display = 'flex';
                textSpan.style.alignItems = 'center';
                textSpan.style.paddingLeft = '5px';
                textSpan.style.pointerEvents = 'none';
                textSpan.style.color = '#000';
                textSpan.style.fontWeight = 'normal';
                textSpan.style.fontSize = '12pt';
                textSpan.style.fontFamily = 'Arial, sans-serif';

                // Insert the text span as a sibling to the input
                if (input.parentNode) {
                  input.parentNode.insertBefore(textSpan, input.nextSibling);
                }
              }
            });
          }
        },
        jsPDF: {
          unit: 'in',
          format: 'a3',
          orientation: 'portrait',
          compress: false, // Disable compression for better quality
          precision: 26,
          hotfixes: ['px_scaling'], // Apply hotfixes for better rendering
          putOnlyUsedFonts: true, // Only include used fonts to reduce file size
          floatPrecision: 36 // Higher precision for better rendering
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'] // Helps with page breaks
        }
      };

      // Add a class to identify each page for page breaks
      page1.classList.add('pdf-page-1');
      page2.classList.add('pdf-page-2');

      try {
        // Add a small delay to ensure all content is fully rendered
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Use html2pdf with enhanced error handling
        // Note: We're using the simpler API to avoid TypeScript errors
        // The html2pdf library doesn't have proper TypeScript definitions for all methods
        console.log('Starting PDF generation...');

        // We can't add metadata directly due to TypeScript limitations
        // Instead, we'll focus on ensuring the content renders correctly

        await html2pdf().from(container).set(opt).save();

        console.log('PDF generation completed successfully');
      } catch (htmlToPdfError) {
        console.error('Error with html2pdf, trying fallback approach:', htmlToPdfError);

        // Fallback approach: Use browser print functionality
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          throw new Error('Could not open print window. Please check your popup blocker settings.');
        }

        // Create a print-friendly document
        const createPrintDocument = (content: HTMLElement) => {
          const html = document.createElement('html');
          const head = document.createElement('head');
          const body = document.createElement('body');

          // Copy styles from current document
          document.querySelectorAll('style, link[rel="stylesheet"]').forEach(styleSheet => {
            head.appendChild(styleSheet.cloneNode(true));
          });

          // Add print-specific styles
          const printStyle = document.createElement('style');
          printStyle.textContent = `
            @page { size: A3 portrait; margin: 0.2in 0.2in; }
            body { background-color: white; }
            .voucher-page { page-break-after: always; }
            .voucher-page:last-child { page-break-after: avoid; }
            .form-container { padding: 20px; background-color: white; box-shadow: none; border: none; }
          `;
          head.appendChild(printStyle);

          // Add content to body
          body.appendChild(content.cloneNode(true));

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
        const htmlContent = createPrintDocument(container);

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
              </div>
            </div>

            {/* Voucher content with ref for PDF generation - both forms shown at once */}
            <div ref={voucherContentRef} className="scrollable-forms-container">
              <div className="voucher-page page1">
                <FormNew1 />
              </div>
              <div className="voucher-page page2">
                <FormNew2 />
              </div>
            </div>

            {/* Styles for VoucherTemplate's own layout and controls */}
            <style jsx>{`
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

              .preview-button, .send-verify-button {
                padding: 8px 15px;
                border: none;
                border-radius: 4px;
                font-weight: bold;
                cursor: pointer;
                color: white;
                margin-right: 10px; /* Consider removing if gap is sufficient */
              }
              .preview-button:last-child, .send-verify-button:last-child {
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
    </div>
  );
}