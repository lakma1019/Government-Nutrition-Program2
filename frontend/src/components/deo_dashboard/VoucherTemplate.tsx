// components/VoucherTemplate.tsx (or wherever it is)
'use client';

import React, { useState, useRef } from 'react';
import FormNew1 from './FormNew1'; // Adjust path if necessary
import FormNew2 from './FormNew2'; // Adjust path if necessary

interface VoucherTemplateProps {
  formData: {
    date: string;
    schoolName: string;
    schoolAddress: string;
    principalName: string;
    voucherNumber: string;
    totalAmount: number;
    description: string;
  };
  onPreview?: () => void;
  onSendToVerify?: () => void;
}

const VoucherTemplate: React.FC<VoucherTemplateProps> = ({ formData, onPreview, onSendToVerify }) => {
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const voucherContentRef = useRef<HTMLDivElement>(null);

  // Format date for display (DD/MM/YYYY) - Kept if needed for future data binding
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Format amount to display rupees and cents - Kept if needed for future data binding
  const formatAmount = (amount: number) => {
    const [rupees, centsValue] = amount.toFixed(2).split('.');
    return { rupees, cents: centsValue }; // ensure 'cents' is always two digits if needed
  };

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
  // const { rupees, cents } = formatAmount(formData.totalAmount); // Kept if needed

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

      // Clone the current page
      const currentPageElement = voucherContentRef.current.querySelector('.voucher-page') as HTMLElement;
      if (!currentPageElement) {
        throw new Error('Voucher page element not found');
      }

      // Create copies of both pages
      const page1 = document.createElement('div');
      page1.className = 'voucher-page page1';
      page1.innerHTML = document.querySelector('.page1 .form-container')?.outerHTML || '';

      const page2 = document.createElement('div');
      page2.className = 'voucher-page page2';
      page2.innerHTML = document.querySelector('.page2 .form-container')?.outerHTML || '';

      // Add both pages to the container
      container.appendChild(page1);
      container.appendChild(page2);

      // Add necessary styles
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .voucher-page {
          page-break-after: always;
          background-color: white;
        }
        .voucher-page:last-child {
          page-break-after: avoid;
        }
        @media print {
          .form-container {
            padding: 20px;
            background-color: white;
            box-shadow: none;
            border: none;
          }
        }
      `;
      container.appendChild(styleElement);

      // Get current date for filename
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const filename = `Voucher_${dateStr}.pdf`;

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
        },
        jsPDF: {
          unit: 'in',
          format: 'a3',
          orientation: 'portrait',
          compress: true,
          precision: 16
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'] // Helps with page breaks
        }
      };

      try {
        // Use html2pdf to generate and download the PDF
        await html2pdf().from(container).set(opt).save();
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