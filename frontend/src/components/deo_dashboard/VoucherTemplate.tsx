// components/VoucherTemplate.tsx (or wherever it is)
'use client';

import React, { useState } from 'react';
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
          <button className="preview-button" onClick={onPreview}> {/* Added onPreview if it was intended */}
            Download
          </button>
          <button onClick={onSendToVerify} className="send-verify-button">
            Send to Verification
          </button>
        </div>
      </div>

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