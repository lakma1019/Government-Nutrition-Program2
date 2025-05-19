// components/FormNew1.tsx
import React, { useState, useEffect } from 'react';

// Function to convert numbers to Sinhala words
const numberToSinhalaWords = (num: number): string => {
  if (isNaN(num)) return '';

  const units = ['', 'එක', 'දෙක', 'තුන', 'හතර', 'පහ', 'හය', 'හත', 'අට', 'නවය'];
  const teens = ['දහය', 'එකොළහ', 'දොළහ', 'දහතුන', 'දහහතර', 'පහළොව', 'දහසය', 'දහහත', 'දහඅට', 'දහනවය'];
  const tens = ['', 'දහය', 'විස්ස', 'තිහ', 'හතළිහ', 'පනහ', 'හැට', 'හැත්තෑව', 'අසූව', 'අනූව'];

  // Function to convert numbers less than 100
  const convertLessThan100 = (n: number): string => {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return unit === 0 ? tens[ten] : `${tens[ten]} ${units[unit]}`;
  };

  // Function to convert numbers less than 1000
  const convertLessThan1000 = (n: number): string => {
    if (n < 100) return convertLessThan100(n);
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    return remainder === 0
      ? `${units[hundred]} සිය`
      : `${units[hundred]} සිය ${convertLessThan100(remainder)}`;
  };

  // Function to convert numbers less than 100,000
  const convertLessThan100000 = (n: number): string => {
    if (n < 1000) return convertLessThan1000(n);
    const thousand = Math.floor(n / 1000);
    const remainder = n % 1000;
    return remainder === 0
      ? `${convertLessThan1000(thousand)} දහස`
      : `${convertLessThan1000(thousand)} දහස ${convertLessThan1000(remainder)}`;
  };

  // Function to convert numbers less than 10,000,000 (1 crore)
  const convertLessThan10000000 = (n: number): string => {
    if (n < 100000) return convertLessThan100000(n);
    const lakh = Math.floor(n / 100000);
    const remainder = n % 100000;
    return remainder === 0
      ? `${convertLessThan100(lakh)} ලක්ෂ`
      : `${convertLessThan100(lakh)} ලක්ෂ ${convertLessThan100000(remainder)}`;
  };

  // Main conversion function
  if (num === 0) return 'බිංදුව';
  if (num < 0) return `ඍණ ${convertLessThan10000000(Math.abs(num))}`;
  return convertLessThan10000000(num);
};

// Define props interface for FormNew1
interface FormNew1Props {
  selectedYear?: string;
  selectedMonth?: string;
}

const FormNew1: React.FC<FormNew1Props> = ({ selectedYear, selectedMonth }) => {
  // State for auto-filled fields
  const [debitParticulars, setDebitParticulars] = useState('');
  const [payableTo, setPayableTo] = useState('');
  const [authorityDescription, setAuthorityDescription] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [checkedBy, setCheckedBy] = useState('');
  const [totalAmount, setTotalAmount] = useState('0.00');
  const [currentDate, setCurrentDate] = useState('');
  const [totalCents, setTotalCents] = useState('00');
  const [totalAmountInSinhala, setTotalAmountInSinhala] = useState('');

  // Function to get current month and year
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

  // Function to format current date for the voucher
  const formatCurrentDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Function to fetch total amount from progress report data
  const fetchTotalAmount = async () => {
    try {
      // Build URL with query parameters for year and month filters
      let url = 'http://localhost:3001/api/daily-data';
      const params = new URLSearchParams();

      if (selectedYear) {
        params.append('year', selectedYear);
      }

      if (selectedMonth) {
        params.append('month', selectedMonth);
      }

      // Append query parameters if any exist
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Calculate total amount
        const sum = result.data.reduce((total: number, row: any) => {
          const amount = parseFloat(row.amount) || 0;
          return total + amount;
        }, 0);

        // Format the total with 2 decimal places
        const formattedTotal = sum.toFixed(2);

        // Split into rupees and cents
        const [rupees, cents] = formattedTotal.split('.');

        setTotalAmount(rupees);
        setTotalCents(cents);

        // Convert the total amount to Sinhala words
        const rupeesNumber = parseInt(rupees, 10);
        const sinhalaWords = numberToSinhalaWords(rupeesNumber);
        setTotalAmountInSinhala(sinhalaWords);
      }
    } catch (error) {
      console.error('Error fetching total amount:', error);
      setTotalAmount('0');
      setTotalCents('00');
      setTotalAmountInSinhala('බිංදුව');
    }
  };

  // Function to fetch active contractor
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

  // Function to fetch active DEO
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

  // Function to fetch active VO
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

  // Set up auto-filling on component mount
  useEffect(() => {
    // Set debit particulars and authority description
    const monthYear = getCurrentMonthYear();
    const nutritionText = `Nutritional Cost of ${monthYear}`;
    setDebitParticulars(nutritionText);
    setAuthorityDescription(nutritionText);

    // Set current date
    setCurrentDate(formatCurrentDate());

    // Fetch data for other fields
    fetchActiveContractor();
    fetchActiveDEO();
    fetchActiveVO();
  }, []);

  // Fetch total amount when year or month filters change
  useEffect(() => {
    // Fetch total amount from progress report
    fetchTotalAmount();
  }, [selectedYear, selectedMonth]);
  return (
    <>
      <div className="form-container">
        <header className="form-header-section">
            <div className="form-header-top">
                <div className="payment-terms">
                    <p className="sinhala-text">නිකුත් කළ දින පටන් 30 දවසක් ඇතුළත දී ගෙවිය යුතුයි.</p>
                    <p className="tamil-text">வழங்கப்பட்ட திகதிவியிலிருந்து 30 நாட்களுக்குலுக் செத்தப்படல் வேண்டும்</p>
                    <p className="english-text">Payable within 30 days from the date of issue</p>
                </div>
                <div className="reference-numbers">
                    <div className="ref-item">
                        <div className="ref-labels">
                            <span className="ref-label sinhala-text">වවුචර් අංකය</span>
                            <span className="ref-label tamil-text">வவுச்சர் இல</span>
                            <span className="ref-label english-text">Voucher No.</span>
                        </div>
                        <span className="ref-brace">{'}'}</span>
                        <input type="text" className="ref-box" />
                    </div>
                    <div className="ref-item">
                        <div className="ref-labels">
                            <span className="ref-label sinhala-text">චෙක්පත් අංකය</span>
                            <span className="ref-label tamil-text">காசோலை இல</span>
                            <span className="ref-label english-text">Cheque No.</span>
                        </div>
                        <span className="ref-brace">{'}'}</span>
                        <input type="text" className="ref-box" />
                    </div>
                    <div className="ref-item general-ref-item">
                        <div className="ref-labels">
                            <span className="sinhala-text">පොදු</span>
                            <span className="tamil-text">பொது</span>
                            <span className="english-text">General</span>
                        </div>
                        <span className="ref-brace">{'}'}</span>
                        <input type="text" className="ref-value" defaultValue="35" />
                    </div>
                </div>
            </div>
            <div className="form-main-title-block">
                <h1 className="main-title-text">
                    <span className="title-sinhala sinhala-text">ශ්‍රී ලංකාව</span><span
                        className="title-tamil tamil-text">/இலங்கை</span>
                        <span className="title-english english-text">/SRI LANKA</span>
                </h1>
            </div>
        </header>

        <section className="station-details">
            <div className="detail-line">
                <span className="label sinhala-text">ස්ථානය</span>
                <span className="label tamil-text">/நிலையயும்</span>
                <span className="label english-text">/Station:</span>
                <span className="label english-text">  H/Heendeliya Model School</span>
            </div>
            <div className="detail-line">
                <span className="label sinhala-text">වැය විස්තරය</span><span className="label tamil-text">/செலவு
                    விபரம்</span><span className="label english-text">/Debit Particulars :</span>
                <input type="text" className="input-line" value={debitParticulars} onChange={(e) => setDebitParticulars(e.target.value)} />
            </div>
            <div className="detail-line">
                <span className="label english-text">PAYABLE TO :</span>
                <input type="text" className="input-line" value={payableTo} onChange={(e) => setPayableTo(e.target.value)} />
                <span className="suffix-text sinhala-text">ට ගෙවිය යුතුය</span><span className="suffix-text tamil-text">/செலுத்த
                    வேண்டும்.</span>
            </div>
        </section>

        <section className="item-details-table">
            <table>
                <thead>
                    <tr>
                        <th className="col-date" rowSpan={2}>
                            <span className="sinhala-text">දිනය</span>
                            <span className="tamil-text">திகதி</span>
                            <span className="english-text">Date</span>
                        </th>
                        <th className="col-description" rowSpan={2}>
                            <span className="sinhala-text">ඉටු කළ සේවයේ හෝ කරන ලද වැඩයේ හෝ සැපයූ බඩුවල විස්තරයක් හා අවශ්‍ය
                                නම් අනුමත කරන නිලධාරියාගේ සහතිකයක්</span>
                            <span className="tamil-text">வழங்கிய சேவை, செய்த வேலைகள் அல்லது வழங்கிய பொருட்களின் முழு விபரம்.
                                தேவையாயின் அங்கீகரிக்கும் அலுவலரின் அத்தாட்சிப் பத்திரமும்</span>
                            <span className="english-text">Detailed description of service rendered, work executed, or goods
                                supplied and Certificate of Approving officer, where necessary</span>
                        </th>
                        <th className="col-rate" rowSpan={2}>
                            <span className="sinhala-text">ගාස්තු</span><br /><span className="sinhala-text">ප්‍රමාණය</span>
                            <span className="tamil-text">பெறுமதி</span>
                            <span className="english-text">Rate</span>
                        </th>
                        <th className="col-amount" colSpan={2}>
                            <span className="sinhala-text">මුදල</span>
                            <span className="tamil-text">தொகை</span>
                            <span className="english-text">Amount</span>
                        </th>
                    </tr>
                    <tr>
                        <th className="sub-col-rs">
                            <span className="sinhala-text">රු.</span>
                            <span className="tamil-text">ரூ</span>
                            <span className="english-text">Rs.</span>
                        </th>
                        <th className="sub-col-cts">
                            <span className="sinhala-text">ශත</span>
                            <span className="tamil-text">சதம்</span>
                            <span className="english-text">cts.</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="authority-row">
                        <td className="input-cell"><input type="text" className="table-input" placeholder="Date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} /></td>
                        <td className="authority-text-cell">
                            <input type="text" className="input-line"
                                value={authorityDescription}
                                onChange={(e) => setAuthorityDescription(e.target.value)} />
                            <div className="payment-authority-text-block">
                                <p className="sinhala-text">ගෙවීමට ඇති බලය සහ ගොනු සම්බන්ධය</p>
                                <p className="tamil-text">கொடுப்பனவுக்கு உரிய அதிகாரமும் கோவை விபரமும்</p>
                                <p className="english-text">Authority for payment and reference to file</p>
                            </div>
                        </td>
                        <td className="input-cell"><input type="text" className="table-input" placeholder="Rate" /></td>
                        <td className="input-cell"><input type="text" className="table-input" placeholder="Rs." /></td>
                        <td className="input-cell"><input type="text" className="table-input" placeholder="cts." /></td>
                    </tr>
                    <tr className="preparation-total-row">
                        <td colSpan={2} className="preparation-cell">
                            <div className="prep-line">
                                <span className="label english-text">Prepared by:</span>
                                <input type="text" className="input-line" value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} />
                                <span className="annotation sinhala-text">විසින් සකස් කරන ලදී </span><span
                                    className="annotation tamil-text">/ ஆல் தயாரிக்கப் பெற்றது.</span>
                            </div>
                            <div className="prep-line">
                                <span className="label english-text">Checked by:</span>
                                <input type="text" className="input-line" value={checkedBy} onChange={(e) => setCheckedBy(e.target.value)} />
                                <span className="annotation sinhala-text">විසින් පරීක්ෂා කරන ලදී </span><span
                                    className="annotation tamil-text">/ ஆல் பரிசோதிக்கப் பெற்றது.</span>
                            </div>
                        </td>
                        <td className="total-label-cell">
                            <span className="label sinhala-text">මුළු ගණන</span>
                            <span className="label tamil-text">மொத்தம்</span>
                            <span className="label english-text">Total</span>
                        </td>
                        <td className="total-value-cell input-cell" data-value={totalAmount}>
                            <input
                                type="text"
                                className="table-input"
                                placeholder="Total Rs."
                                value={totalAmount}
                                onChange={(e) => setTotalAmount(e.target.value)}
                            />
                        </td>
                        <td className="total-value-cell input-cell" data-value={totalCents}>
                            <input
                                type="text"
                                className="table-input"
                                placeholder="Total cts."
                                value={totalCents}
                                onChange={(e) => setTotalCents(e.target.value)}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section className="certification">
            <p className="sinhala-text">
                ඉහත කී සැපයීම්*/සේවාවන්*/වැඩ* විධි වූ පරිදි අනුමැතිය ඇතිව කරන ලද බවත්, ඒ සඳහා රුපියල්<input type="text"
                    className="input-line rupees-line"
                    onChange={(e) => {
                      const rupeesNumber = parseInt(e.target.value, 10);
                      setTotalAmountInSinhala(numberToSinhalaWords(rupeesNumber));
                    }}
                    data-sinhala-text={totalAmountInSinhala} />කුත්, ශත.<input type="text" className="input-line cents-line" value={totalCents} onChange={(e) => setTotalCents(e.target.value)} />ගෙවීම
                රෙගුලාසිවලට*/කොන්ත්‍රාත්තුවට*/අනුකූලවන බවත්*/සාධාරණ සහ යුක්ති සහගත වන බවත්*/මගේම දැනුම අනුව*/මීට අදාල වන
                ගොනුවල ඇති සහතික අනුව*/සහතික කරමි.
            </p>
            <p className="tamil-text">
                சம்பந்தப்பட்ட கோவைகளில் உள்ள அத்தாட்சிகளின்படி மேலே வழங்கப்பட்ட பொருட்கள்*/சேவைகள்*/வேலைகள்* உரிய
                அதிகாரனளிக்கப்பட்ட நிபந்தனைகளுக்கும் ஒப்பந்தங்களுக்கும் ஏற்றவாறு நிறைவேற்றப்பட்டு செலுத்தப்பட்ட
                கொடுப்பனவாகிய ரூபா.<input type="text"
                    className="input-line rupees-line"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    />சதம்<input type="text"
                    className="input-line cents-line" value={totalCents} onChange={(e) => setTotalCents(e.target.value)} />எனது அறிவுக்கு எட்டிய வரை நியாயமானதும் சரியானதும் என நான் இத்தால்
                அத்தாட்சிப்படுத்து கிறேன்.
            </p>
            <p className="english-text">
                I certify from personal knowledge*/ from the certificates in the relevant files*/ that the above
                supplies*/ services*/ works* were duly authorised and performed and that the payment of Rupees<input
                    type="text"
                    className="input-line rupees-line"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    />and cents<input type="text"
                    className="input-line cents-line" value={totalCents} onChange={(e) => setTotalCents(e.target.value)} />is in accordance with regulations*/ contract*/ fair and reasonable.
            </p>
        </section>

        <section className="signature-section-container">
            <div className="date-line">
                <span className="label sinhala-text">දිනය</span><span className="label tamil-text">/திகதி</span><span
                    className="label english-text">/Date:</span>
                <input type="text" className="input-line" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} />
            </div>
            <div className="signature-title-block">
                <input type="text" className="input-line signature-input-field"/>
                <div className="signature-title-text">
                    <p className="sinhala-text">වියදම සහතික කරන නිලධාරියාගේ අත්සන සහ පදවිය.</p>
                    <p className="tamil-text">செலவிளங்களை அத்தாட்சிப்படுத்தும் அலுவலரிள் கையொப்பமும் பதவியும்.</p>
                    <p className="english-text">Signature and Title of Officer Certifying Expenditure.</p>
                </div>
            </div>
        </section>

        <footer className="form-footer">
            <div className="guidance-text">
                <p>
                    <span className="sinhala-text">සහතික කිරීමට හෝ ගෙවීමට පෙර මු.රෙ.135-140 දක්වා අවධානය යොමු
                        කරන්න.</span><br />
                    <span className="tamil-text">அத்தாட்சிப் படுத்துவதற்கு முன்/கொடுப்பனவு செய்ய முன் நிதி ஒழுங்குகள்
                        135-140 இற்கு கவனம் கோரப்படுகின்றது.</span><br />
                    <span className="english-text">Before certifying / paying, draw attention to F.R.R. 135-140.</span>
                </p>
            </div>
            <div className="strike-note">
                <p>
                    <span className="sinhala-text">සටහන - * අනවශ්‍ය වචන කපා හරින්න. </span>
                    <span className="tamil-text">/ குறிப்பு :- தேவையற்ற சொற்களை வெட்டவும். </span>
                    <span className="english-text">/ Note. – Strike out words inapplicable.</span>
                </p>
            </div>
            <div className="pto-mark">
                <span className="sinhala-text">අ.පි.ස.</span><span className="tamil-text">/ ம.பா.செ.</span><span
                    className="english-text">/ P.T.O.</span>
            </div>
        </footer>
      </div>
      <style jsx global>{`
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

        @media print {
          .form-container {
            box-shadow: none !important;
            border: 1px solid #000 !important;
            margin: 0 !important;
            padding: 20px !important;
          }

          .item-details-table {
            break-inside: avoid-page;
          }

          input, button, .action-buttons {
            display: none !important;
          }

          .static-value {
            display: inline-block;
            border-bottom: 1px solid #000;
            min-width: 100px;
          }

          /* Add data attributes for PDF rendering */
          input[value]:before {
            content: attr(value);
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            padding-left: 5px;
            color: #000;
            font-weight: normal;
            font-size: 12pt;
            font-family: 'Noto Sans Sinhala', 'Noto Sans Tamil', Arial, sans-serif;
            z-index: 999;
            background: white;
          }

          /* Display Sinhala text representation for rupees */
          .rupees-line[data-sinhala-text]:after {
            content: "(" attr(data-sinhala-text) ")";
            display: block;
            position: absolute;
            left: 0;
            bottom: -20px;
            width: 100%;
            font-family: 'Noto Sans Sinhala', Arial, sans-serif;
            font-size: 10pt;
            color: #000;
            text-align: center;
            font-weight: normal;
            z-index: 1000;
          }

          /* Remove any extra lines around input fields */
          .input-line, .table-input {
            border: none !important;
            border-bottom: 1px solid #000 !important;
            box-shadow: none !important;
            outline: none !important;
          }

          /* Ensure total amount and date are clearly visible */
          .total-value-cell:after {
            content: attr(data-value);
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
            font-weight: bold;
            font-size: 12pt;
          }


        }

        body { /* Applied globally when this component is active */
            font-family: var(--font-family-english);
            font-size: var(--font-size-normal);
            color: var(--primary-text-color);
            background-color: #e0e0e0;
            margin: 0;
            padding: calc(var(--spacing-unit) * 2);
            line-height: var(--line-height-normal);
            display: flex;
            justify-content: center;
        }

        .form-container {
            width: var(--form-width);
            margin: calc(var(--spacing-unit) * 2) auto;
            padding: calc(var(--spacing-unit) * 3);
            border: 1px solid var(--border-color);
            background-color: var(--background-color);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        .sinhala-text {
            font-family: var(--font-family-sinhala);
        }

        .tamil-text {
            font-family: var(--font-family-tamil);
        }

        .english-text {
            font-family: var(--font-family-english);
        }

        /* Header Section */
        .form-header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: calc(var(--spacing-unit) * 1.5);
        }

        .payment-terms {
            flex: 2;
            border: 1px solid var(--border-color);
            background-color: var(--light-grey-background);
            padding: var(--spacing-unit);
            margin-right: calc(var(--spacing-unit) * 2);
        }

        .payment-terms p {
            margin: 0 0 calc(var(--spacing-unit) / 4) 0;
            font-size: var(--font-size-small);
            line-height: var(--line-height-condensed);
        }

        .reference-numbers {
            flex: 1.5;
            font-size: var(--font-size-small);
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        .ref-item {
            display: flex;
            align-items: center;
            margin-bottom: calc(var(--spacing-unit) / 2);
            justify-content: flex-end;
            width: 100%;
        }

        .ref-item .ref-labels {
            text-align: left;
            margin-right: calc(var(--spacing-unit) / 2);
            flex-shrink: 0;
        }

        .ref-item .ref-labels .ref-label {
            display: block;
            line-height: var(--line-height-condensed);
            font-size: var(--font-size-xsmall);
            white-space: nowrap;
        }

        .ref-item .ref-brace {
            font-size: calc(var(--font-size-large) * 1.8);
            line-height: 0.5;
            font-family: var(--font-family-brace);
            margin-right: calc(var(--spacing-unit) / 2);
            color: var(--primary-text-color);
            font-weight: lighter;
            align-self: center;
        }

        .ref-item input.ref-box,
        .ref-item input.ref-value {
            font-family: var(--font-family-english);
            color: var(--primary-text-color);
            border: 1px solid var(--border-color);
            background-color: var(--light-grey-background);
            box-sizing: border-box;
            padding: calc(var(--spacing-unit) / 4) calc(var(--spacing-unit) / 2);
            height: 28px;
        }

        .ref-item input.ref-box {
            width: 180px;
            font-size: var(--font-size-normal);
        }

        .ref-item input.ref-value {
            font-size: var(--font-size-xlarge);
            font-weight: bold;
            min-width: 45px;
            width: auto;
            text-align: left;
            padding-left: calc(var(--spacing-unit));
        }

        .ref-item.general-ref-item input.ref-value {
            background-color: transparent;
            border: none;
            padding-left: calc(var(--spacing-unit) / 2);
        }


        .form-main-title-block {
            margin-bottom: calc(var(--spacing-unit) * 2);
            border-bottom: 2px solid var(--border-color);
            padding-bottom: var(--spacing-unit);
        }

        .main-title-text {
            font-weight: bold;
            font-size: var(--font-size-large);
        }

        .main-title-text .title-sinhala,
        .main-title-text .title-tamil,
        .main-title-text .title-english {
            margin-right: calc(var(--spacing-unit) /2);
        }

        input.input-line {
            flex-grow: 1;
            min-width: 30px;
            vertical-align: baseline;
            background-color: var(--background-color);
            padding: calc(var(--spacing-unit));
            margin: calc(var(--spacing-unit));
            font-family: inherit;
            font-size: inherit;
            color: inherit;
            box-sizing: border-box;
            height: calc(var(--font-size-normal) + var(--spacing-unit) + 2px);
            line-height: 150%;
        }

        .station-details {
            margin-bottom: calc(var(--spacing-unit) * 2);
        }

        .detail-line {
            display: flex;
            align-items: baseline;
            margin-bottom: var(--spacing-unit);
            font-size: var(--font-size-normal);
        }

        .detail-line .label {
            white-space: nowrap;
            margin-right: var(--spacing-unit);
            flex-shrink: 0;
        }

        .detail-line .suffix-text {
            margin-left: var(--spacing-unit);
            white-space: nowrap;
            font-size: var(--font-size-small);
            flex-shrink: 0;
        }

        .item-details-table {
            margin-bottom: calc(var(--spacing-unit) * 2);
        }

        .item-details-table table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid var(--border-color);
        }

        .item-details-table th,
        .item-details-table td {
            border: 1px solid var(--border-color);
            padding: calc(var(--spacing-unit) / 1.5);
            text-align: left;
            vertical-align: top;
            font-size: var(--font-size-small);
        }

        .item-details-table th {
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
        }
        .item-details-table th span {
            display: block;
            line-height: var(--line-height-condensed);
        }

        .item-details-table .col-date {
            width: 10%;
        }

        .item-details-table .col-description {
            width: 55%;
        }

        .item-details-table .col-rate {
            width: 10%;
            text-align: center;
        }

        .item-details-table .col-amount {
            width: 25%;
        }

        .item-details-table .sub-col-rs,
        .item-details-table .sub-col-cts {
            width: 12.5%;
            text-align: center;
        }

        .item-details-table tbody td {
            height: calc(var(--spacing-unit) * 4);
        }

        .item-details-table .col-description span {
            text-align: left;
        }

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

        .preparation-cell {
            padding: var(--spacing-unit);
            vertical-align: top;
            height: auto;
        }

        .preparation-cell .prep-line {
            display: flex;
            align-items: baseline;
            margin-bottom: var(--spacing-unit);
            font-size: var(--font-size-normal);
        }

        .preparation-cell .prep-line .label {
            white-space: nowrap;
            margin-right: var(--spacing-unit);
            flex-shrink: 0;
        }

        .preparation-cell .prep-line input.input-line {
            min-width: 200px;
        }

        .preparation-cell .prep-line .annotation {
            margin-left: var(--spacing-unit);
            font-size: var(--font-size-xsmall);
            white-space: nowrap;
            flex-shrink: 0;
        }

        .total-label-cell {
            vertical-align: top;
            padding: calc(var(--spacing-unit) / 1.5);
            font-weight: bold;
            font-size: var(--font-size-small);
            height: auto;
        }

        .total-label-cell .label {
            display: block;
            line-height: var(--line-height-condensed);
            text-align: left;
        }

        .total-value-cell {
            vertical-align: top;
            height: auto;
        }

        .item-details-table td.input-cell {
            padding: 0;
            vertical-align: middle;
        }

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

        .certification {
            margin-bottom: calc(var(--spacing-unit) * 2);
            font-size: var(--font-size-small);
            line-height: var(--line-height-loose);
        }

        .certification p {
            margin-bottom: var(--spacing-unit);
        }

        .certification input.input-line {
            display: inline-block;
            vertical-align: baseline;
            margin: 0 calc(var(--spacing-unit) / 4);
        }

        .certification .rupees-line {
            width: 200px;
        }

        .certification .cents-line {
            width: 100px;
        }

        .signature-section-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: calc(var(--spacing-unit) * 2);
            font-size: var(--font-size-normal);
        }

        .signature-section-container .date-line {
            flex-basis: 30%;
            display: flex;
            align-items: baseline;
            margin-right: calc(var(--spacing-unit) * 2);
        }

        .signature-section-container .date-line .label {
            margin-right: var(--spacing-unit);
            white-space: nowrap;
        }

        .signature-section-container .date-line input.input-line {
            flex-grow: 1;
        }

        .signature-section-container .signature-title-block {
            flex-basis: 65%;
            text-align: left;
        }

        .signature-title-block input.input-line.signature-input-field {
            width: 100%;
            margin-bottom: calc(var(--spacing-unit) / 2);
        }

        .signature-section-container .signature-title-text p {
            margin: 0 0 calc(var(--spacing-unit) / 4) 0;
            line-height: var(--line-height-condensed);
            font-size: var(--font-size-small);
        }

        .form-footer {
            padding-top: var(--spacing-unit);
            font-size: var(--font-size-xsmall);
            line-height: var(--line-height-condensed);
        }

        .form-footer .guidance-text p {
            margin-bottom: var(--spacing-unit);
            font-size: var(--font-size-small);
            line-height: var(--line-height-normal);
        }

        .form-footer .strike-note p {
            margin-bottom: var(--spacing-unit);
            font-size: var(--font-size-small);
            line-height: var(--line-height-normal);
        }

        .pto-mark {
            text-align: right;
            font-weight: bold;
            margin-top: var(--spacing-unit);
            font-size: var(--font-size-small);
        }
      `}</style>
    </>
  );
};

export default FormNew1;