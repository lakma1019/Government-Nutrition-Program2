// components/VoucherTemplate.tsx (or wherever it is)
'use client';

import React, { useState, useRef, useEffect } from 'react';
import FormNew1 from './FormNew1';
import FormNew2 from './FormNew2';

interface VoucherTemplateProps {
  onSendToVerify?: () => void;
}

const VoucherTemplate: React.FC<VoucherTemplateProps> = ({ onSendToVerify }) => {
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const voucherContentRef = useRef<HTMLDivElement>(null);

  // State variables to store auto-populated field values from FormNew1
  const [debitParticulars, setDebitParticulars] = useState('');
  const [payableTo, setPayableTo] = useState('');
  const [authorityDescription, setAuthorityDescription] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [checkedBy, setCheckedBy] = useState('');

  // Function to get current month and year (same as in FormNew1)
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

  // Function to fetch active contractor (same as in FormNew1)
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

  // Function to fetch active DEO (same as in FormNew1)
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

  // Function to fetch active VO (same as in FormNew1)
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

  // Set up auto-filling on component mount (same as in FormNew1)
  useEffect(() => {
    // Set debit particulars and authority description
    const monthYear = getCurrentMonthYear();
    const nutritionText = `Nutritional Cost of ${monthYear}`;
    setDebitParticulars(nutritionText);
    setAuthorityDescription(nutritionText);

    // Fetch data for other fields
    fetchActiveContractor();
    fetchActiveDEO();
    fetchActiveVO();
  }, []);

  // Helper functions for future use can be added here if needed

  const goToPreviousPage = () => {
    if (currentPage === 2) {
      setCurrentPage(1);
    }
  };

  const goToNextPage = () => {
    if (currentPage === 1) {
      setCurrentPage(2);
    }
  };

  // const currentYear = new Date().getFullYear().toString().slice(2); // Kept if needed

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

      // We need to ensure we capture both pages properly with all their styles
      // First, save the current page state
      const originalPage = currentPage;

      // We'll use a more direct approach to capture both pages exactly as they appear
      // First, let's capture page 1 content if we're on page 2
      if (currentPage === 2) {
        console.log('Currently on page 2, switching to page 1 first to capture it');
        setCurrentPage(1);
        // Wait for the render to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Now we should be on page 1, capture it
      console.log('Capturing page 1 content');
      const page1Content = document.querySelector('.page1');
      if (page1Content) {
        // Clone the entire page1 with all its content and styles
        form1Clone.innerHTML = page1Content.innerHTML;
      } else {
        throw new Error('Page 1 content not found');
      }

      // Now switch to page 2 to capture it
      console.log('Switching to page 2 to capture its content');
      setCurrentPage(2);

      // Wait longer for the render to complete to ensure all styles are applied
      await new Promise(resolve => setTimeout(resolve, 800));

      // Now capture the FormNew2 content with all its styles
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

      // Switch back to the original page
      console.log('Switching back to original page:', originalPage);
      setCurrentPage(originalPage);

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
          precision: 16,
          hotfixes: ['px_scaling'], // Apply hotfixes for better rendering
          putOnlyUsedFonts: true, // Only include used fonts to reduce file size
          floatPrecision: 16 // Higher precision for better rendering
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
            @page { size: A4 portrait; margin: 0.5in 0.2in; }
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

  return (
    <div className="voucher-template-container">
      <div className="voucher-controls">
        <div className="pagination-controls">
          <button
            onClick={goToPreviousPage}
            className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="page-indicator">
            <span className={`page-number ${currentPage === 1 ? 'active' : ''}`}>1</span>
            <span className="page-separator">/</span>
            <span className={`page-number ${currentPage === 2 ? 'active' : ''}`}>2</span>
          </div>
          <button
            onClick={goToNextPage}
            className={`pagination-button ${currentPage === 2 ? 'disabled' : ''}`}
            disabled={currentPage === 2}
          >
            Next
          </button>
        </div>
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
          <button onClick={onSendToVerify} className="send-verify-button">
            Send to Verification
          </button>
        </div>
      </div>

      {/* Voucher content with ref for PDF generation */}
      <div ref={voucherContentRef}>
        {/* Conditionally render the imported form components */}
        {currentPage === 1 ? (
          <div className="voucher-page page1">
            <FormNew1 />
          </div>
        ) : (
          <div className="voucher-page page2">
            <FormNew2 />
          </div>
        )}
      </div>

      {/* Styles for VoucherTemplate's own layout and controls */}
      <style jsx>{`
        .voucher-template-container {
          background-color: #f0f0f0; /* Default background for the area holding the form */
          padding: 20px;
          border-radius: 8px;
          max-width: 100%;
          overflow: auto; /* In case form content is wider */
        }

        .loading-message { /* This can be removed as loading state is removed */
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          font-size: 18px;
          color: #666;
        }

        .voucher-controls {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          align-items: center;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .pagination-button {
          padding: 8px 15px;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          color: white;
          background-color: #4CAF50;
        }

        .pagination-button:hover:not(.disabled) {
          background-color: #45a049;
        }

        .pagination-button.disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .page-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 16px;
          font-weight: bold;
        }

        .page-number {
          padding: 5px 10px;
          border-radius: 50%;
        }

        .page-number.active {
          background-color: #2196F3;
          color: white;
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
          /*
            The background of the form itself (the "paper") is white,
            controlled by .form-container inside FormNew1/FormNew2.
            This .voucher-page is a wrapper.
            If FormNew1/FormNew2's global body style sets a background (e.g. #e0e0e0),
            that will take precedence for the overall page background.
            This .voucher-page can have its own padding if needed,
            but form-container already has padding.
          */
          /* background-color: white; */ /* Likely not needed if form-container handles its own background */
          /* padding: 20px; */ /* Potentially redundant if form-container has padding */
        }

        /*
          IMPORTANT: The very large block of CSS that was here previously,
          which contained styles from FORM-NEW1.html and FORM-NEW2.html,
          has been REMOVED. Each form component (FormNew1, FormNew2)
          now contains its own <style jsx global> block.
        */
      `}</style>
    </div>
  );
};

export default VoucherTemplate;