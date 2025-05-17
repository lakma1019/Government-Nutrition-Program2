'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function GenerateProgressReportPage() {
  const [user, setUser] = useState<{id?: number; username?: string; role?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    educationZone: "Tangalle",
    schoolName: "H/Heendeliya Model  School",
    supplierName: "ABC Supplies",
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
            female: row.girls_attendance.toString(),
            male: row.boys_attendance.toString(),
            total: row.total_attendance.toString(),
            unitPrice: row.unit_price.toString(),
            amount: row.total_price.toString(),
            methodReceived: row.method_of_rice_received,
            mealRecipe: row.meal_recipe,
            eggs: row.number_of_eggs.toString(),
            fruits: row.fruits || ''
          };
        });

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

  const handleDownload = () => {
    window.print();
  };

  useEffect(() => {
    if (!loading && user) {
      fetchDailyData();
    }
  }, [loading, user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
      setTimeout(() => {
        const addRowBtn = document.getElementById('add-row-btn');
        const tbody = document.getElementById('report-tbody');
        
        // Classes for table cell content (span) and table cells (td) and rows (tr)
        const cellContentClasses = "grow min-w-[50px] py-[0.2em] px-[0.5em] box-border";
        const tdClasses = "border border-black p-2 text-center align-middle h-[1.5em]";
        const trClasses = "print:break-inside-avoid";

        const createRowHtml = () => {
          return `<tr class="${trClasses}">
            <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="date"></span></td>
            <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="female"></span></td>
            <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="male"></span></td>
            <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="total"></span></td>
            <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="unitPrice"></span></td>
            <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="amount"></span></td>
            <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="methodReceived"></span></td>
            <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="mealRecipe"></span></td>
            <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="eggs"></span></td>
            <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="fruits"></span></td>
          </tr>`;
        };

        if (addRowBtn && tbody) {
          addRowBtn.addEventListener('click', () => {
            tbody.insertAdjacentHTML('beforeend', createRowHtml());
          });

          tbody.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target.classList.contains('remove-row-btn')) {
              const row = target.closest('tr');
              if (row) {
                row.remove();
              }
            }
          });
        }

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
          const sortedData = reportData.reportRows;

          sortedData.forEach(row => {
            const newRow = document.createElement('tr');
            newRow.className = trClasses; // Apply classes to the <tr> element
            const displayDate = row.date || '';
            newRow.innerHTML = `
              <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="date">${displayDate}</span></td>
              <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="female">${row.female || ''}</span></td>
              <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="male">${row.male || ''}</span></td>
              <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="total">${row.total || ''}</span></td>
              <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="unitPrice">${row.unitPrice || ''}</span></td>
              <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="amount">${row.amount || ''}</span></td>
              <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="methodReceived">${row.methodReceived || ''}</span></td>
              <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="mealRecipe">${row.mealRecipe || ''}</span></td>
              <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="eggs">${row.eggs || ''}</span></td>
              <td class="${tdClasses}"><span class="${cellContentClasses}" data-field="fruits">${row.fruits || ''}</span></td>
            `;
            tbody.appendChild(newRow);
          });

          // Add empty rows
          for (let i = 0; i < 5; i++) {
            tbody.insertAdjacentHTML('beforeend', createRowHtml());
          }
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
            <div className="bg-white p-5 font-serif print:m-0 print:p-0"> {/* Note: This div also has p-5. Refresh button is relative to parent's p-5. */}
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
                    <span className="shrink-0 mr-2">90% = {/* Calculate or fetch this value e.g. Math.round(parseInt(reportData.approvedStudentsValue || '0') * 0.9) */}</span>
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
                <table className="w-full border-collapse min-w-[900px] print:w-full print:min-w-0">
                  <thead className="sticky top-0 bg-white z-10 print:static print:bg-transparent">
                    <tr>
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap">Date</th>
                      <th colSpan={3} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap">Number of Students</th>
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap">Unit Price</th>
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap">Amount</th>
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap">Method of Rice Received</th>
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap">Meal Recipe</th>
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap">Number of Eggs</th>
                      <th rowSpan={2} className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap">Fruits</th>
                    </tr>
                    <tr>
                      <th className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap">Female</th>
                      <th className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap">Male</th>
                      <th className="border border-black p-2 text-center align-middle font-normal align-bottom whitespace-nowrap">Total</th>
                    </tr>
                  </thead>
                  <tbody id="report-tbody">
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
              <button type="button" className="py-[10px] px-[30px] bg-[#4CAF50] border-none rounded font-bold cursor-pointer text-base text-white hover:bg-[#45a049]" onClick={handleDownload}>
                Download
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