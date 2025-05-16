'use client';

import React, { useEffect, useState } from 'react';

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
  const [page1Html, setPage1Html] = useState<string>('');
  const [page2Html, setPage2Html] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Format date for display (DD/MM/YYYY)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Format amount to display rupees and cents
  const formatAmount = (amount: number) => {
    const [rupees, cents] = amount.toFixed(2).split('.');
    return { rupees, cents };
  };

  // Load HTML templates on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        // Fetch the HTML templates
        const page1Response = await fetch('/FORM-NEW1.html');
        const page2Response = await fetch('/FORM-NEW2.html');

        if (!page1Response.ok || !page2Response.ok) {
          throw new Error('Failed to load template files');
        }

        const page1Text = await page1Response.text();
        const page2Text = await page2Response.text();

        setPage1Html(page1Text);
        setPage2Html(page2Text);
      } catch (error) {
        console.error('Error loading voucher templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Navigate to previous page
  const goToPreviousPage = () => {
    if (currentPage === 2) {
      setCurrentPage(1);
    }
  };

  // Navigate to next page
  const goToNextPage = () => {
    if (currentPage === 1) {
      setCurrentPage(2);
    }
  };

  // Format the current year for the voucher
  const currentYear = new Date().getFullYear().toString().slice(2); // Get last 2 digits of year

  // Format the amount for display
  const { rupees, cents } = formatAmount(formData.totalAmount);

  // If loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="voucher-template-container">
        <div className="loading-message">Loading voucher templates...</div>
      </div>
    );
  }

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
          <button onClick={onPreview} className="preview-button">
            Preview
          </button>
          <button onClick={onSendToVerify} className="send-verify-button">
            To Send Verify
          </button>
        </div>
      </div>

      {currentPage === 1 ? (
        <div className="voucher-page page1">
          <div
            className="form-container"
            dangerouslySetInnerHTML={{ __html: page1Html }}
          />
        </div>
      ) : (
        <div className="voucher-page page2">
          <div
            className="form-container"
            dangerouslySetInnerHTML={{ __html: page2Html }}
          />
        </div>
      )}

      <style jsx>{`
        .voucher-template-container {
          background-color: #f0f0f0;
          padding: 20px;
          border-radius: 8px;
          max-width: 100%;
          overflow: auto;
        }

        .loading-message {
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
          margin-right: 10px;
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
          background-color: white;
          padding: 20px;
        }

        /* Styles from FORM-NEW1.html */
        :root {
          --primary-text-color: #000000;
          --border-color: #333333;
          --background-color: #ffffff;
          --light-grey-background: #f0f0f0;
          --form-width: 850px;
          --spacing-unit: 8px;
          --font-size-normal: 13px;
          --font-size-small: 11px;
          --font-size-xsmall: 9px;
          --font-size-large: 18px;
          --font-size-xlarge: 24px;

          --font-family-sinhala: 'Noto Sans Sinhala', 'Iskoola Pota', Arial, sans-serif;
          --font-family-tamil: 'Noto Sans Tamil', 'Latha', Arial, sans-serif;
          --font-family-english: Arial, Helvetica, sans-serif;
          --font-family-brace: 'Times New Roman', Times, serif;

          --line-height-condensed: 1.2;
          --line-height-normal: 1.5;
          --line-height-loose: 1.7;
        }

        .form-container {
          width: var(--form-width);
          margin: calc(var(--spacing-unit) * 2) auto;
          padding: calc(var(--spacing-unit) * 3);
          border: 1px solid var(--border-color);
          background-color: var(--background-color);
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        .sinhala-text { font-family: var(--font-family-sinhala); }
        .tamil-text { font-family: var(--font-family-tamil); }
        .english-text { font-family: var(--font-family-english); }

        /* Header Section */
        .form-header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: calc(var(--spacing-unit) * 1.5); }
        .payment-terms { flex: 2; border: 1px solid var(--border-color); background-color: var(--light-grey-background); padding: var(--spacing-unit); margin-right: calc(var(--spacing-unit) * 2); }
        .payment-terms p { margin: 0 0 calc(var(--spacing-unit) / 4) 0; font-size: var(--font-size-small); line-height: var(--line-height-condensed); }

        .reference-numbers { flex: 1.5; font-size: var(--font-size-small); display: flex; flex-direction: column; align-items: flex-end; }
        .ref-item { display: flex; align-items: center; margin-bottom: calc(var(--spacing-unit) / 2); justify-content: flex-end; width: 100%; }
        .ref-item .ref-labels { text-align: left; margin-right: calc(var(--spacing-unit) / 2); flex-shrink: 0;}
        .ref-item .ref-labels .ref-label { display: block; line-height: var(--line-height-condensed); font-size: var(--font-size-xsmall); white-space: nowrap; }
        .ref-item .ref-brace {
            font-size: calc(var(--font-size-large) * 1.8); /* Approx 32px */
            line-height: 0.5; /* Adjusted for better vertical centering with multi-line labels */
            font-family: var(--font-family-brace);
            margin-right: calc(var(--spacing-unit) / 2);
            color: var(--primary-text-color);
            font-weight: lighter;
            align-self: center; /* Helps with vertical alignment */
        }

        .ref-item input.ref-box,
        .ref-item input.ref-value {
            font-family: var(--font-family-english);
            color: var(--primary-text-color);
            border: 1px solid var(--border-color);
            background-color: var(--light-grey-background);
            box-sizing: border-box;
            padding: calc(var(--spacing-unit) / 4) calc(var(--spacing-unit) / 2);
            height: 28px; /* Slightly increased for better fit with brace */
        }
        .ref-item input.ref-box {
            width: 180px;  /* Adjusted width */
            font-size: var(--font-size-normal); /* Slightly larger font for better readability */
        }
        .ref-item input.ref-value {
            font-size: var(--font-size-xlarge);
            font-weight: bold;
            min-width: 45px; /* Adjusted min-width */
            width: auto; /* Allow it to size based on content and min-width */
            text-align: left;
            padding-left: calc(var(--spacing-unit)); /* Increased padding */
        }
        .ref-item.general-ref-item input.ref-value {
             background-color: transparent; /* As per typical "value" display */
             border: none;
             padding-left: calc(var(--spacing-unit) / 2);
        }

        .form-main-title-block { margin-bottom: calc(var(--spacing-unit) * 2); border-bottom: 2px solid var(--border-color); padding-bottom: var(--spacing-unit); }
        .main-title-text { font-weight: bold; font-size: var(--font-size-large); }
        .main-title-text .title-sinhala, .main-title-text .title-tamil, .main-title-text .title-english { margin-right: calc(var(--spacing-unit) /2); }

        /* Station Details Section */
        .station-details { margin-bottom: calc(var(--spacing-unit) * 2); }
        .detail-line { display: flex; align-items: baseline; margin-bottom: var(--spacing-unit); font-size: var(--font-size-normal); }
        .detail-line .label { white-space: nowrap; margin-right: var(--spacing-unit); flex-shrink: 0; }
        .detail-line .suffix-text { margin-left: var(--spacing-unit); white-space: nowrap; font-size: var(--font-size-small); flex-shrink: 0; }

        /* General Input Line Styling */
        input.input-line {
          flex-grow: 1;
          min-width: 30px;
          vertical-align: baseline;
          background-color: var(--background-color);
          border: 1px solid var(--border-color);
          padding: calc(var(--spacing-unit) / 2);
          font-family: inherit;
          font-size: inherit;
          color: inherit;
          box-sizing: border-box;
          height: calc(var(--font-size-normal) + var(--spacing-unit) + 2px);
          line-height: normal;
        }

        /* Item Details Table */
        .item-details-table { margin-bottom: calc(var(--spacing-unit) * 2); }
        .item-details-table table { width: 100%; border-collapse: collapse; border: 2px solid var(--border-color); }
        .item-details-table th, .item-details-table td { border: 1px solid var(--border-color); padding: calc(var(--spacing-unit) / 1.5); text-align: left; vertical-align: top; font-size: var(--font-size-small); }
        .item-details-table th { font-weight: bold; text-align: center; vertical-align: middle; }
        .item-details-table th span { display: block; line-height: var(--line-height-condensed); }
        .item-details-table .col-date { width: 10%; }
        .item-details-table .col-description { width: 55%; }
        .item-details-table .col-rate { width: 10%; text-align: center;}
        .item-details-table .col-amount { width: 25%; }
        .item-details-table .sub-col-rs, .item-details-table .sub-col-cts { width: 12.5%; text-align: center;}
        .item-details-table tbody td { height: calc(var(--spacing-unit) * 4); }
        .item-details-table .col-description span { text-align: left; }

        .authority-text-cell {
          padding: var(--spacing-unit);
          vertical-align: top;
          height: auto;
        }
        .authority-text-cell input.input-line.authority-description-line {
          width: 100%;
          margin-bottom: var(--spacing-unit);
        }
        .authority-text-cell .payment-authority-text-block p {
          margin: 0 0 calc(var(--spacing-unit) / 2) 0;
          font-size: var(--font-size-normal);
          line-height: var(--line-height-condensed);
        }

        .preparation-cell { padding: var(--spacing-unit); vertical-align: top; height: auto; }
        .preparation-cell .prep-line { display: flex; align-items: baseline; margin-bottom: var(--spacing-unit); font-size: var(--font-size-normal); }
        .preparation-cell .prep-line .label { white-space: nowrap; margin-right: var(--spacing-unit); flex-shrink: 0; }
        .preparation-cell .prep-line input.input-line { min-width: 200px; }
        .preparation-cell .prep-line .annotation { margin-left: var(--spacing-unit); font-size: var(--font-size-xsmall); white-space: nowrap; flex-shrink: 0; }

        .total-label-cell { vertical-align: top; padding: calc(var(--spacing-unit) / 1.5); font-weight: bold; font-size: var(--font-size-small); height: auto; }
        .total-label-cell .label { display: block; line-height: var(--line-height-condensed); text-align: left; }
        .total-value-cell { vertical-align: top; height: auto; }

        .item-details-table td.input-cell { padding: 0; vertical-align: middle; }
        .item-details-table td.input-cell input.table-input {
          width: 100%;
          height: 100%;
          min-height: calc(var(--spacing-unit) * 4);
          box-sizing: border-box;
          border: none;
          padding: calc(var(--spacing-unit) / 1.5);
          font-size: var(--font-size-small);
          font-family: inherit;
          color: var(--primary-text-color);
          background-color: var(--background-color);
          outline: none;
        }

        /* Certification Section */
        .certification { margin-bottom: calc(var(--spacing-unit) * 2); font-size: var(--font-size-small); line-height: var(--line-height-loose); }
        .certification p { margin-bottom: var(--spacing-unit); }
        .certification input.input-line { display: inline-block; vertical-align: baseline; margin: 0 calc(var(--spacing-unit) / 4); }
        .certification .rupees-line { width: 200px; }
        .certification .cents-line { width: 100px; }

        /* Signature Section */
        .signature-section-container { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: calc(var(--spacing-unit) * 2); font-size: var(--font-size-normal); }
        .signature-section-container .date-line { flex-basis: 30%; display: flex; align-items: baseline; margin-right: calc(var(--spacing-unit) * 2); }
        .signature-section-container .date-line .label { margin-right: var(--spacing-unit); white-space: nowrap; }
        .signature-section-container .date-line input.input-line { flex-grow: 1; }

        .signature-section-container .signature-title-block { flex-basis: 65%; text-align: left; }
        .signature-title-block input.input-line.signature-input-field {
          width: 100%;
          margin-bottom: calc(var(--spacing-unit) / 2);
        }
        .signature-section-container .signature-title-text p { margin: 0 0 calc(var(--spacing-unit) / 4) 0; line-height: var(--line-height-condensed); font-size: var(--font-size-small); }

        /* Footer */
        .form-footer { padding-top: var(--spacing-unit); font-size: var(--font-size-xsmall); line-height: var(--line-height-condensed); }
        .form-footer .guidance-text p { margin-bottom: var(--spacing-unit); font-size: var(--font-size-small); line-height: var(--line-height-normal); }
        .form-footer .strike-note p { margin-bottom: var(--spacing-unit); font-size: var(--font-size-small); line-height: var(--line-height-normal); }
        .pto-mark { text-align: right; font-weight: bold; margin-top: var(--spacing-unit); font-size: var(--font-size-small); }

        /* Page 2 Styles */
        .form-section {
          margin-bottom: calc(var(--spacing-unit) * 1.25);
        }
        .form-section:last-of-type {
          margin-bottom: 0;
        }

        .form-line {
          display: flex;
          align-items: baseline;
          margin-bottom: calc(var(--spacing-unit) * 0.4);
          flex-wrap: nowrap;
        }

        .form-line > span,
        .form-line > div {
          white-space: nowrap;
          margin-right: calc(var(--spacing-unit) * 0.35);
        }
        .form-line > span:last-child,
        .form-line > div:last-child {
          margin-right: 0;
        }

        .label-fixed {
          flex-shrink: 0;
        }
        .label-fixed-sm { width: 25px; flex-shrink: 0; }
        .label-fixed-md { width: 45px; flex-shrink: 0; }

        .dots-fill {
          flex-grow: 1;
          border-bottom: 0.75px dotted var(--line-color);
          margin-left: calc(var(--spacing-unit) * 0.25);
          margin-right: calc(var(--spacing-unit) * 0.25);
          margin-bottom: -4px;
          min-width: 10px;
          height: 0.8em;
        }
        .dots-short { flex-grow: 0.2; min-width: 30px; }
        .dots-medium { flex-grow: 0.5; min-width: 50px; }
        .dots-long { flex-grow: 2; }

        .labels-group {
          line-height: 1.25;
        }
        .labels-group p {
          margin: 1px 0;
          font-size: 10pt;
        }

        .curly-brace {
          font-size: 3.8em;
          line-height: 0.7;
          font-weight: lighter;
          margin-left: 8px;
          color: #000000;
        }

        .hr-separator {
          border: 0;
          border-top: 0.75px solid #cccccc;
          margin: 20px 0;
        }

        .warrant-section .form-line {
          margin-bottom: calc(var(--spacing-unit) * 0.3);
        }
        .warrant-text-block {
          line-height: 1.25;
          margin-right: calc(var(--spacing-unit) * 0.5);
        }

        .indented-line {
          padding-left: calc(var(--spacing-unit) * 2);
        }
        .indented-line .label-fixed {
          margin-left: calc(var(--spacing-unit) * -2);
        }

        .witnesses-section {
          display: flex;
          align-items: center;
          margin-bottom: calc(var(--spacing-unit) * 3);
        }

        .stamp-and-signature-area-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          width: fit-content;
          margin-left: auto;
          margin-bottom: calc(var(--spacing-unit) * 2.5);
        }

        .stamp-box {
          border: 1px dotted #333333;
          padding: calc(var(--spacing-unit) * 0.75) var(--spacing-unit);
          text-align: center;
          font-size: 7.5pt;
          line-height: 1.1;
          width: 170px;
          flex-shrink: 0;
          margin-bottom: var(--spacing-unit);
        }
        .stamp-box p {
          margin: calc(var(--spacing-unit) * 0.25) 0;
        }

        .signature-line-and-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 220px;
        }

        .external-signature-dotted-line {
          width: 100%;
          border-bottom: 0.75px dotted #333333;
          margin-bottom: calc(var(--spacing-unit) * 0.5);
        }

        .signature-text-block {
          text-align: center;
          font-size: 8pt;
          line-height: 1.25;
        }
        .signature-text-block p {
          margin: 0;
        }

        .paying-officer-boxed-section {
          border: 1px solid #000000;
          padding: var(--spacing-unit);
          margin-top: calc(var(--spacing-unit) * 1.5);
        }

        .paying-officer-content {
          display: flex;
          align-items: center;
        }
        .paying-officer-content .curly-brace {
          margin-right: calc(var(--spacing-unit) * 0.5);
        }
        .paying-officer-content .dots-fill {
          margin-left: 0;
        }
        input.input-line {
          flex-grow: 1;
          min-width: 30px;
          vertical-align: baseline;
          background-color: var(--background-color);
          border: 1px solid var(--border-color);
          padding: calc(var(--spacing-unit) / 2);
          font-family: inherit;
          font-size: inherit;
          color: inherit;
          box-sizing: border-box;
          height: calc(var(--font-size-normal) + var(--spacing-unit) + 2px);
          line-height: normal;
        }

        /* Item Details Table */
        .item-details-table { margin-bottom: calc(var(--spacing-unit) * 2); }
        .item-details-table table { width: 100%; border-collapse: collapse; border: 2px solid var(--border-color); }
        .item-details-table th, .item-details-table td { border: 1px solid var(--border-color); padding: calc(var(--spacing-unit) / 1.5); text-align: left; vertical-align: top; font-size: var(--font-size-small); }
        .item-details-table th { font-weight: bold; text-align: center; vertical-align: middle; }
        .item-details-table th span { display: block; line-height: var(--line-height-condensed); }
        .item-details-table .col-date { width: 10%; }
        .item-details-table .col-description { width: 55%; }
        .item-details-table .col-rate { width: 10%; text-align: center;}
        .item-details-table .col-amount { width: 25%; }
        .item-details-table .sub-col-rs, .item-details-table .sub-col-cts { width: 12.5%; text-align: center;}
        .item-details-table tbody td { height: calc(var(--spacing-unit) * 4); }
        .item-details-table .col-description span { text-align: left; }

        .authority-text-cell {
          padding: var(--spacing-unit);
          vertical-align: top;
          height: auto;
        }
        .authority-text-cell input.input-line.authority-description-line {
          width: 100%;
          margin-bottom: var(--spacing-unit);
        }
        .authority-text-cell .payment-authority-text-block p {
          margin: 0 0 calc(var(--spacing-unit) / 2) 0;
          font-size: var(--font-size-normal);
          line-height: var(--line-height-condensed);
        }

        .preparation-cell { padding: var(--spacing-unit); vertical-align: top; height: auto; }
        .preparation-cell .prep-line { display: flex; align-items: baseline; margin-bottom: var(--spacing-unit); font-size: var(--font-size-normal); }
        .preparation-cell .prep-line .label { white-space: nowrap; margin-right: var(--spacing-unit); flex-shrink: 0; }
        .preparation-cell .prep-line input.input-line { min-width: 200px; }
        .preparation-cell .prep-line .annotation { margin-left: var(--spacing-unit); font-size: var(--font-size-xsmall); white-space: nowrap; flex-shrink: 0; }

        .total-label-cell { vertical-align: top; padding: calc(var(--spacing-unit) / 1.5); font-weight: bold; font-size: var(--font-size-small); height: auto; }
        .total-label-cell .label { display: block; line-height: var(--line-height-condensed); text-align: left; }
        .total-value-cell { vertical-align: top; height: auto; }

        .item-details-table td.input-cell { padding: 0; vertical-align: middle; }
        .item-details-table td.input-cell input.table-input {
          width: 100%;
          height: 100%;
          min-height: calc(var(--spacing-unit) * 4);
          box-sizing: border-box;
          border: none;
          padding: calc(var(--spacing-unit) / 1.5);
          font-size: var(--font-size-small);
          font-family: inherit;
          color: var(--primary-text-color);
          background-color: var(--background-color);
          outline: none;
        }

        /* Certification Section */
        .certification { margin-bottom: calc(var(--spacing-unit) * 2); font-size: var(--font-size-small); line-height: var(--line-height-loose); }
        .certification p { margin-bottom: var(--spacing-unit); }
        .certification input.input-line { display: inline-block; vertical-align: baseline; margin: 0 calc(var(--spacing-unit) / 4); }
        .certification .rupees-line { width: 200px; }
        .certification .cents-line { width: 100px; }

        /* Signature Section */
        .signature-section-container { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: calc(var(--spacing-unit) * 2); font-size: var(--font-size-normal); }
        .signature-section-container .date-line { flex-basis: 30%; display: flex; align-items: baseline; margin-right: calc(var(--spacing-unit) * 2); }
        .signature-section-container .date-line .label { margin-right: var(--spacing-unit); white-space: nowrap; }
        .signature-section-container .date-line input.input-line { flex-grow: 1; }

        .signature-section-container .signature-title-block { flex-basis: 65%; text-align: left; }
        .signature-title-block input.input-line.signature-input-field {
          width: 100%;
          margin-bottom: calc(var(--spacing-unit) / 2);
        }
        .signature-section-container .signature-title-text p { margin: 0 0 calc(var(--spacing-unit) / 4) 0; line-height: var(--line-height-condensed); font-size: var(--font-size-small); }

        /* Footer */
        .form-footer { padding-top: var(--spacing-unit); font-size: var(--font-size-xsmall); line-height: var(--line-height-condensed); }
        .form-footer .guidance-text p { margin-bottom: var(--spacing-unit); font-size: var(--font-size-small); line-height: var(--line-height-normal); }
        .form-footer .strike-note p { margin-bottom: var(--spacing-unit); font-size: var(--font-size-small); line-height: var(--line-height-normal); }
        .pto-mark { text-align: right; font-weight: bold; margin-top: var(--spacing-unit); font-size: var(--font-size-small); }

        /* Page 2 Styles */
        .form-section {
          margin-bottom: calc(var(--spacing-unit) * 1.25);
        }
        .form-section:last-of-type {
          margin-bottom: 0;
        }

        .form-line {
          display: flex;
          align-items: baseline;
          margin-bottom: calc(var(--spacing-unit) * 0.4);
          flex-wrap: nowrap;
        }

        .form-line > span,
        .form-line > div {
          white-space: nowrap;
          margin-right: calc(var(--spacing-unit) * 0.35);
        }
        .form-line > span:last-child,
        .form-line > div:last-child {
          margin-right: 0;
        }

        .label-fixed {
          flex-shrink: 0;
        }
        .label-fixed-sm { width: 25px; flex-shrink: 0; }
        .label-fixed-md { width: 45px; flex-shrink: 0; }

        .dots-fill {
          flex-grow: 1;
          border-bottom: 0.75px dotted var(--line-color);
          margin-left: calc(var(--spacing-unit) * 0.25);
          margin-right: calc(var(--spacing-unit) * 0.25);
          margin-bottom: -4px;
          min-width: 10px;
          height: 0.8em;
        }
        .dots-short { flex-grow: 0.2; min-width: 30px; }
        .dots-medium { flex-grow: 0.5; min-width: 50px; }
        .dots-long { flex-grow: 2; }

        .labels-group {
          line-height: 1.25;
        }
        .labels-group p {
          margin: 1px 0;
          font-size: 10pt;
        }

        .curly-brace {
          font-size: 3.8em;
          line-height: 0.7;
          font-weight: lighter;
          margin-left: 8px;
          color: #000000;
        }

        .hr-separator {
          border: 0;
          border-top: 0.75px solid #cccccc;
          margin: 20px 0;
        }

        .warrant-section .form-line {
          margin-bottom: calc(var(--spacing-unit) * 0.3);
        }
        .warrant-text-block {
          line-height: 1.25;
          margin-right: calc(var(--spacing-unit) * 0.5);
        }

        .indented-line {
          padding-left: calc(var(--spacing-unit) * 2);
        }
        .indented-line .label-fixed {
          margin-left: calc(var(--spacing-unit) * -2);
        }

        .witnesses-section {
          display: flex;
          align-items: center;
          margin-bottom: calc(var(--spacing-unit) * 3);
        }

        .stamp-and-signature-area-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          width: fit-content;
          margin-left: auto;
          margin-bottom: calc(var(--spacing-unit) * 2.5);
        }

        .stamp-box {
          border: 1px dotted #333333;
          padding: calc(var(--spacing-unit) * 0.75) var(--spacing-unit);
          text-align: center;
          font-size: 7.5pt;
          line-height: 1.1;
          width: 170px;
          flex-shrink: 0;
          margin-bottom: var(--spacing-unit);
        }
        .stamp-box p {
          margin: calc(var(--spacing-unit) * 0.25) 0;
        }

        .signature-line-and-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 220px;
        }

        .external-signature-dotted-line {
          width: 100%;
          border-bottom: 0.75px dotted #333333;
          margin-bottom: calc(var(--spacing-unit) * 0.5);
        }

        .signature-text-block {
          text-align: center;
          font-size: 8pt;
          line-height: 1.25;
        }
        .signature-text-block p {
          margin: 0;
        }

        .paying-officer-boxed-section {
          border: 1px solid #000000;
          padding: var(--spacing-unit);
          margin-top: calc(var(--spacing-unit) * 1.5);
        }

        .paying-officer-content {
          display: flex;
          align-items: center;
        }
        .paying-officer-content .curly-brace {
          margin-right: calc(var(--spacing-unit) * 0.5);
        }
        .paying-officer-content .dots-fill {
          margin-left: 0;
        }
      `}</style>
    </div>
  );
};

export default VoucherTemplate;
