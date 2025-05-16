'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DataEntryOfficerDashboard() {
  const [user, setUser] = useState<{id?: number; username?: string; role?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState('enterDailyData');
  const [formValid, setFormValid] = useState(false);
  // Form errors state is declared but not actively used for validation display in the provided code.
  // Keeping it for potential future use.
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const pathname = usePathname();
  const router = useRouter();

  // Function to get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Function to handle input focus - selects all text when input is focused
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // Initial default values for attendance and unit price
  const defaultAttendanceGirls = 22;
  const defaultAttendanceBoys = 31;
  const defaultUnitPrice = 85.00;

  // Calculate default total attendance and total price
  const defaultTotalAttendance = defaultAttendanceGirls + defaultAttendanceBoys;
  const defaultTotalPrice = defaultTotalAttendance * defaultUnitPrice;


  // Form state for daily data entry
  const [formData, setFormData] = useState({
    date: getCurrentDate(), // Current date in YYYY-MM-DD format
    attendance: {
      girls: defaultAttendanceGirls,
      boys: defaultAttendanceBoys,
      total: defaultTotalAttendance // Calculated total
    },
    unitPrice: defaultUnitPrice, // Default unit price
    totalPrice: defaultTotalPrice, // Calculated total price
    methodOfRiceReceived: 'Direct Delivery',
    meal: 'Rice',
    numberOfEggs: 0, // Default to 0
    fruits: '-' // Default to '-'
  });

  // Check if user is authenticated and is a data entry officer
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          router.push('/login'); // Redirect to login if no user data
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData); // Set user data

        // Check if user's role is 'dataEntryOfficer'
        if (userData.role !== 'dataEntryOfficer') {
          alert('Access denied. Only Data Entry Officers can access this page.');
          router.push('/'); // Redirect to home or another page if not DEO
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login'); // Redirect to login on auth error
      } finally {
        setLoading(false); // Stop loading once auth check is complete
      }
    };

    checkAuth();
  }, [router]); // Depend on router

  // Validate form on initial load and whenever formData changes
  useEffect(() => {
    validateForm(formData);
  }, [formData]); // Dependency array: validate form whenever formData changes


  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData };

    // Handle nested properties for attendance
    if (name.startsWith('attendance.')) {
      const child = name.split('.')[1]; // Get 'girls' or 'boys'
      if (child === 'girls' || child === 'boys') {
        // Clean input: allow only digits
        const numericValue = value.replace(/[^0-9]/g, '');
        // Convert to number, default to 0 if empty string
        const attendanceValue = numericValue === '' ? 0 : parseInt(numericValue, 10);

        // Ensure it's a valid number (not NaN)
        if (!isNaN(attendanceValue)) {
           // Create updated attendance object
            const updatedAttendance = {
              ...formData.attendance,
              [child]: attendanceValue // Update girls or boys attendance
            };

            // Calculate total attendance
            const girlsValue = child === 'girls' ? attendanceValue : formData.attendance.girls;
            const boysValue = child === 'boys' ? attendanceValue : formData.attendance.boys;
            updatedAttendance.total = girlsValue + boysValue; // Recalculate total

            // Calculate new total price based on updated total attendance and current unit price
            const newTotalPrice = updatedAttendance.total * formData.unitPrice;

            // Update form data with new attendance and total price
            updatedFormData = {
              ...formData,
              attendance: updatedAttendance,
              totalPrice: newTotalPrice
            };
        } else {
           // If input is not a valid number after cleaning, keep the old value for that field
           // But still update the rest of the form data
           updatedFormData = {
              ...formData,
              //attendance: { ...formData.attendance, [child]: formData.attendance[child] } // Keep old attendance value
           };
           // Optionally, show an error message for invalid input
           console.warn(`Invalid input for ${name}: "${value}". Keeping previous value.`);
           return; // Exit the handler if input is invalid
        }
      }
    } else if (name === 'unitPrice') {
      // Clean input: allow digits and a single decimal point
      const numericValue = value.replace(/[^0-9.]/g, '');
      // Convert to number, default to 0 if empty string or ends with '.'
      const unitPriceValue = numericValue === '' || numericValue.endsWith('.') ? 0 : parseFloat(numericValue);

       // Allow typing a single '.' but don't update price until it's a valid number
       if (numericValue === '' || numericValue === '.' || !isNaN(unitPriceValue)) {
            const newUnitPrice = numericValue === '' ? 0 : unitPriceValue;

            // Calculate new total price based on updated unit price and current total attendance
            const newTotalPrice = formData.attendance.total * newUnitPrice;

            // Update form data with new unit price and total price
            updatedFormData = {
              ...formData,
              unitPrice: newUnitPrice,
              totalPrice: newTotalPrice
            };
       } else {
          // If input is not a valid number after cleaning, keep the old value for unitPrice
           console.warn(`Invalid input for ${name}: "${value}". Keeping previous value.`);
           return; // Exit the handler if input is invalid
       }
    } else {
      // Handle other form fields
      updatedFormData = {
        ...formData,
        [name]: value
      };
    }

    // Update the state with the potentially modified form data
    setFormData(updatedFormData);
    // Validation will be triggered by the useEffect hook that depends on formData
  };


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission

    // Perform final validation before sending
    if (!validateForm(formData)) {
      alert('Please fill in all required fields correctly before submitting.');
      return;
    }

    try {
      // Prepare data for API - ensure correct data types
      const dailyData = {
        date: formData.date,
        girls_attendance: parseInt(formData.attendance.girls.toString(), 10), // Ensure integer
        boys_attendance: parseInt(formData.attendance.boys.toString(), 10), // Ensure integer
        total_attendance: parseInt(formData.attendance.total.toString(), 10), // Ensure integer
        unit_price: parseFloat(formData.unitPrice.toString()), // Ensure float
        total_price: parseFloat(formData.totalPrice.toString()), // Ensure float
        method_of_rice_received: formData.methodOfRiceReceived,
        meal_recipe: formData.meal,
        number_of_eggs: parseInt(formData.numberOfEggs.toString(), 10) || 0, // Ensure integer, default to 0 if conversion fails
        fruits: formData.fruits
      };

      console.log('Submitting daily data:', dailyData);

      // Send data to backend API endpoint
      const response = await fetch('http://localhost:3001/api/daily-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Specify JSON content type
        },
        body: JSON.stringify(dailyData), // Send data as JSON string
      });

      // Check if the HTTP response was successful (status 2xx)
      if (!response.ok) {
        // Read response body for error details
        const errorData = await response.json();
        console.error('API submission failed:', errorData);
        throw new Error(errorData.message || `Server responded with ${response.status}`);
      }

      // Parse successful response
      const result = await response.json();
      console.log('Daily data submitted successfully:', result);

      // Show success message to the user
      alert('Data submitted successfully!');

      // Reset form to initial values after successful submission
      handleDiscard();
    } catch (error) {
      // Catch any errors during fetch or response processing
      console.error('Error submitting data:', error);
      // Show error message to the user
      alert(`Failed to submit data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Validate form and update form validity state
  const validateForm = useCallback((data: typeof formData) => {
    const errors: {[key: string]: string} = {};
    let isValid = true;

    // Basic required field checks
    if (!data.date) {
      errors.date = 'Date is required';
      isValid = false;
    }

    // Check if attendance numbers are valid integers (optional, depends on strictness)
    // The input handler already cleans non-digits, so just checking for non-null/non-undefined might be enough
    if (data.attendance.girls === null || data.attendance.girls === undefined) {
       errors['attendance.girls'] = 'Number of girls is required';
       isValid = false;
    }
     if (data.attendance.boys === null || data.attendance.boys === undefined) {
        errors['attendance.boys'] = 'Number of boys is required';
        isValid = false;
     }

    // Check if unit price is a valid number > 0 (or >= 0 depending on requirement)
     if (data.unitPrice === null || data.unitPrice === undefined || isNaN(data.unitPrice) || data.unitPrice < 0) { // Assuming price cannot be negative
        errors.unitPrice = 'Valid unit price is required';
        isValid = false;
     }


    if (!data.methodOfRiceReceived.trim()) { // Check for non-empty string after trimming whitespace
      errors.methodOfRiceReceived = 'Method of rice received is required';
      isValid = false;
    }

    if (!data.meal.trim()) { // Check for non-empty string after trimming whitespace
      errors.meal = 'Meal recipe is required';
      isValid = false;
    }

    // Check if number of eggs is a non-negative integer
    if (data.numberOfEggs === null || data.numberOfEggs === undefined || isNaN(data.numberOfEggs) || parseInt(data.numberOfEggs.toString(), 10) < 0) {
       errors.numberOfEggs = 'Valid number of eggs (non-negative) is required';
       // isValid = false; // Decide if eggs is strictly required for form validity
       // Currently, it's not marked as required in the original code, so don't make form invalid just for this
    }


    // Update state for errors and overall form validity
    setFormErrors(errors);
    setFormValid(isValid);

    return isValid; // Return boolean validity
  }, []); // Empty dependency array means this function is created once

  // Handle discard button click
  const handleDiscard = () => {
    // Recalculate default values based on initial constants
    const calculatedTotal = defaultAttendanceGirls + defaultAttendanceBoys;
    const calculatedTotalPrice = calculatedTotal * defaultUnitPrice;

    // Reset form state to initial values (current date, default attendance, calculated price)
    const newFormData = {
      date: getCurrentDate(), // Get current date
      attendance: {
        girls: defaultAttendanceGirls,
        boys: defaultAttendanceBoys,
        total: calculatedTotal // Recalculate total
      },
      unitPrice: defaultUnitPrice, // Use default unit price
      totalPrice: calculatedTotalPrice, // Recalculate total price
      methodOfRiceReceived: 'Direct Delivery',
      meal: 'Rice',
      numberOfEggs: 0,
      fruits: '-'
    };

    setFormData(newFormData); // Update form data state
    validateForm(newFormData); // Re-validate the form after resetting
  };

  // Show loading state while checking authentication
  if (loading) {
    // Use Tailwind classes for loading message
    return (
      <div className="flex justify-center items-center h-screen text-2xl text-purple-700">
        Loading...
      </div>
    );
  }

  // --- Tailwind Class Mapping ---
  // Container and general layout
  // Mapping #f8e6f3 to bg-[#f8e6f3]
  const containerClasses = "w-full min-h-screen p-5 bg-[#f8e6f3] font-sans flex flex-col";

  // Navigation Bar
  // Mapping #e6b3d9 to bg-[#e6b3d9]
  // Mapping #333 to text-gray-800 (or text-[#333])
  // Mapping #f0e0f0 to hover:bg-[#f0e0f0]
  // Mapping #d070d0 to border-[#d070d0]
  const navbarClasses = "flex justify-between items-center py-4 px-6 mb-5 bg-[#e6b3d9] rounded-lg shadow-md";
  const brandClasses = "text-xl font-bold text-gray-800"; // Using gray-800 for #333
  const navLinksClasses = "flex space-x-4";
  const navLinkBaseClasses = "inline-flex group"; // Group for hover effect on span
  const linkTextBaseClasses = "inline-block py-1.5 px-4 bg-white rounded-full text-black text-sm font-bold transition-all duration-200 ease-in-out";
  const linkTextHoverClasses = "group-hover:bg-[#f0e0f0]";
  const linkTextHighlightClasses = "bg-[#f0e0f0] border-2 border-[#d070d0] !text-black"; // Explicit border, force text-black

  // Welcome Header
  const welcomeHeaderClasses = "text-center mb-5 py-2 bg-[#f8e6f3] rounded-lg";
  const welcomeHeaderH1Classes = "text-xl font-semibold text-gray-800";

  // Dashboard Content Layout
  // Mapping #fff to bg-white
  // Mapping #0070f3 to border-[#0070f3] (using arbitrary for exact match)
  const dashboardContentClasses = "flex bg-white rounded-xl overflow-hidden shadow-lg border-2 border-[#0070f3] flex-col md:flex-row"; // Added responsive flex

  // Sidebar
  // Mapping #f8e1f4 to bg-[#f8e1f4]
  // Mapping #0070f3 to border-r-2 border-[#0070f3]
  const sidebarClasses = "w-full md:w-52 bg-[#f8e1f4] py-5 border-r-0 md:border-r-2 border-[#0070f3] flex-shrink-0"; // Responsive width and border

  // Sidebar Item
  // Mapping #f0d0f0 to hover:bg-[#f0d0f0]
  // Mapping #e6b3d9 to active:bg-[#e6b3d9]
  const sidebarItemClasses = "flex items-center py-3 px-5 cursor-pointer transition-colors duration-200 hover:bg-[#f0d0f0]";
  const sidebarItemActiveClass = "bg-[#e6b3d9] font-bold"; // Keep font-bold explicitly
  const sidebarIconClasses = "mr-2.5 text-xl";
  const sidebarTextClasses = "text-base";

  // Main Panel
  // Mapping #fff to bg-white
  const mainPanelClasses = "flex-1 p-5 bg-white";

  // Data Entry Form
  const dataEntryFormClasses = "max-w-full"; // Use max-w-full

  const formRowClasses = "flex flex-col md:flex-row mb-4 items-start md:items-center gap-2 md:gap-4"; // Responsive flex, items, gap
  const formGroupClasses = "flex-1 mr-0 md:mr-4 last:mr-0"; // Flex-1, responsive margin-right
  const formLabelClasses = "block mb-1.5 font-semibold text-gray-700 text-sm"; // Adjusted margin, color, size
  const formInputBaseClasses = "w-full py-2 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"; // Base input styles with focus

  // Date Input Container
  const dateInputContainerClasses = "relative flex items-center";
  const dateTextInputClasses = `${formInputBaseClasses} pr-8 bg-white cursor-default`; // Added padding-right for icon space
  const calendarInputClasses = "absolute right-0 top-0 w-8 h-full opacity-0 cursor-pointer";
   // Icon simulation for date input (requires custom CSS or an icon component)
   // For now, keep the original ::after logic or replace with an explicit icon span if possible with Tailwind
   // Example using a span and relative/absolute:
   const dateIconClasses = "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-base text-gray-600";


  // Price Input Container
  const priceInputContainerClasses = "relative";
  const priceInputClasses = `${formInputBaseClasses} text-transparent caret-transparent focus:text-gray-800 focus:caret-gray-800`; // Hide text/caret when not focused
  const priceFormatClasses = "absolute inset-0 py-2 px-3 pointer-events-none text-gray-800 bg-transparent border border-transparent select-none"; // Overlay text

  // Attendance Container
  const attendanceContainerClasses = "flex items-center gap-1.5 flex-wrap sm:flex-nowrap"; // Added flex-wrap/nowrap and small gap
  const attendanceLabelBoxClasses = "border border-gray-300 py-1.5 px-2 bg-white rounded text-center text-sm w-[80px] flex-shrink-0"; // Adjusted padding, width, flex-shrink
  const attendanceInputClasses = "w-10 py-1.5 px-2 text-center border border-gray-300 rounded text-sm"; // Adjusted width, padding, size

  // Total Attendance Input
  const totalAttendanceInputClasses = "w-16 text-center bg-gray-200 border border-gray-400 cursor-not-allowed py-1.5 px-2 rounded text-sm"; // Adjusted width, colors, cursor

  // Helper Text
  const helperTextClasses = "text-xs text-gray-600 mt-1 italic";

  // Form Actions (Buttons)
  const formActionsClasses = "mt-5 mb-5"; // Margin top/bottom
  const addButtonClasses = "w-full p-2.5 bg-violet-600 text-white rounded font-bold cursor-pointer text-base hover:bg-violet-700 disabled:bg-violet-300 disabled:cursor-not-allowed transition-colors"; // Adjusted color, added disabled states
  const formFooterClasses = "flex justify-between mt-5 gap-4"; // Justify between, margin-top, gap

  const actionButtonBaseClasses = "py-2 px-5 rounded cursor-pointer text-sm transition-colors"; // Base styles
  const discardButtonClasses = `${actionButtonBaseClasses} bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 flex-1`; // Added border, flex-1
  const backButtonClasses = `${actionButtonBaseClasses} bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 flex-1`; // Added border, flex-1

  // Placeholder Content
  const placeholderContentClasses = "p-5 text-center text-gray-600"; // Padding, text alignment/color
  const placeholderContentH2Classes = "mb-2.5 text-lg font-semibold text-gray-800"; // Margin, size, weight, color


   // Manual simulation for the calendar icon in the date input
   // This requires a span inside the date-input-container
   // and applying the `dateIconClasses` to it.
   // Original ::after is removed.


  return (
    <div className={containerClasses}>
      {/* Navigation Bar */}
      <nav className={navbarClasses}>
        <div className={brandClasses}>Goverment Nutrition Program</div>
        <div className={navLinksClasses}>
          <Link href="/" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/" ? linkTextHighlightClasses : ""}`}>
              Home
            </span>
          </Link>
          <Link href="/about" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/about" ? linkTextHighlightClasses : ""}`}>
              About Program
            </span>
          </Link>
          <Link href="/login" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/login" ? linkTextHighlightClasses : ""}`}>
              Login
            </span>
          </Link>
          <Link href="/gazette" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/gazette" ? linkTextHighlightClasses : ""}`}>
              Gazette
            </span>
          </Link>
        </div>
      </nav>

      {/* Welcome Header */}
      <div className={welcomeHeaderClasses}>
        <h1 className={welcomeHeaderH1Classes}>Welcome to Data Entry Officer login</h1>
      </div>

      {/* Main Content */}
      <div className={dashboardContentClasses}>
        {/* Sidebar */}
        <div className={sidebarClasses}>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'enterDailyData' ? sidebarItemActiveClass : ''}`}
            onClick={() => setActiveMenuItem('enterDailyData')}
          >
            <div className={sidebarIconClasses}>📝</div>
            <div className={sidebarTextClasses}>Enter Daily Data</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'contractors' ? sidebarItemActiveClass : ''}`}
            onClick={() => {
              router.push('/DEO_login/DEO_contractors');
            }}
          >
            <div className={sidebarIconClasses}>👥</div>
            <div className={sidebarTextClasses}>Contractors</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'generateVoucher' ? sidebarItemActiveClass : ''}`}
            onClick={() => {
              router.push('/DEO_login/generate_voucher');
            }}
          >
            <div className={sidebarIconClasses}>📄</div>
            <div className={sidebarTextClasses}>Generate General 35 Voucher</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'generateProgressReport' ? sidebarItemActiveClass : ''}`}
            onClick={() => {
              router.push('/DEO_login/generate_progress_report');
            }}
          >
            <div className={sidebarIconClasses}>📈</div>
            <div className={sidebarTextClasses}>Generate Progress Report</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'viewProfile' ? sidebarItemActiveClass : ''}`}
            onClick={() => setActiveMenuItem('viewProfile')}
          >
            <div className={sidebarIconClasses}>👤</div>
            <div className={sidebarTextClasses}>View profile</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'reports' ? sidebarItemActiveClass : ''}`}
            onClick={() => setActiveMenuItem('reports')}
          >
            <div className={sidebarIconClasses}>📊</div>
            <div className={sidebarTextClasses}>Reports</div>
          </div>
          <div
            className={`${sidebarItemClasses} ${activeMenuItem === 'history' ? sidebarItemActiveClass : ''}`}
            onClick={() => setActiveMenuItem('history')}
          >
            <div className={sidebarIconClasses}>📜</div>
            <div className={sidebarTextClasses}>History</div>
          </div>
        </div>

        {/* Main Panel */}
        <div className={mainPanelClasses}>
          {activeMenuItem === 'enterDailyData' && (
            <div className={dataEntryFormClasses}>
              {/* Add a header for the form */}
              <h2 className={placeholderContentH2Classes}>Daily Data Entry</h2>
              <form onSubmit={handleSubmit}>
                <div className={formRowClasses}>
                  <div className={formGroupClasses}>
                    <label htmlFor="date" className={formLabelClasses}>Date</label>
                    <div className={dateInputContainerClasses}>
                      {/* Text input to display the date */}
                      <input
                        type="text"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange} // Keep handler just in case, though readOnly
                        readOnly // Make it read-only as the date picker controls it
                        className={dateTextInputClasses}
                      />
                       {/* Hidden date input to open calendar */}
                      <input
                        type="date"
                        id="calendar-date"
                        value={formData.date}
                        onChange={(e) => {
                          // Ensure date format is YYYY-MM-DD
                           const selectedDate = e.target.value;
                           setFormData({
                             ...formData,
                             date: selectedDate // e.target.value is already YYYY-MM-DD
                           });
                        }}
                        className={calendarInputClasses}
                      />
                      {/* Manual calendar icon span */}
                       <span className={dateIconClasses}>📅</span>
                    </div>
                    {/* Optional: Display date validation error if exists */}
                    {formErrors.date && <p className="text-red-500 text-xs mt-1">{formErrors.date}</p>}
                  </div>
                </div>

                <div className={formRowClasses}> {/* Using form-row just for layout consistency */}
                  <div className={formGroupClasses}>
                    <label className={formLabelClasses}>Attendance</label> {/* No htmlFor as it's a general label */}
                  </div>
                </div>

                <div className={formRowClasses}>
                  <div className={attendanceContainerClasses}>
                    <div className={attendanceLabelBoxClasses}>Girls</div>
                    <input
                      type="text"
                      id="attendance-girls"
                      name="attendance.girls"
                      value={formData.attendance.girls === 0 ? '' : formData.attendance.girls} // Display empty for 0 unless it's the default? Decide UX. Displaying 0 is fine.
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      className={attendanceInputClasses}
                      maxLength={3}
                      inputMode="numeric" // Hint for numeric keyboard on mobile
                       pattern="[0-9]*" // Pattern for numeric input
                    />
                    {/* Optional: Display girls attendance error if exists */}
                     {formErrors['attendance.girls'] && <p className="text-red-500 text-xs mt-1">{formErrors['attendance.girls']}</p>}

                    <div className="w-5"></div> {/* Spacer div */}

                    <div className={attendanceLabelBoxClasses}>Boys</div>
                    <input
                      type="text"
                      id="attendance-boys"
                      name="attendance.boys"
                      value={formData.attendance.boys === 0 ? '' : formData.attendance.boys}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      className={attendanceInputClasses}
                      maxLength={3}
                       inputMode="numeric"
                       pattern="[0-9]*"
                    />
                     {/* Optional: Display boys attendance error if exists */}
                     {formErrors['attendance.boys'] && <p className="text-red-500 text-xs mt-1">{formErrors['attendance.boys']}</p>}

                  </div>
                </div>

                <div className={formRowClasses}>
                  <div className={formGroupClasses}>
                    <label htmlFor="total" className={formLabelClasses}>Total Attendance</label> {/* Updated label text */}
                    <input
                      type="text"
                      id="total"
                      name="attendance.total" // Name reflects the nested property, but it's readOnly
                      value={formData.attendance.total}
                      readOnly // Make it read-only as it's calculated
                      maxLength={3}
                      className={totalAttendanceInputClasses}
                    />
                  </div>
                </div>

                <div className={formRowClasses}>
                  <div className={formGroupClasses}>
                    <label htmlFor="unitPrice" className={formLabelClasses}>Unit price</label>
                    <div className={priceInputContainerClasses}>
                      {/* Input for typing the number */}
                      <input
                        type="text"
                        id="unitPrice"
                        name="unitPrice"
                         value={formData.unitPrice === 0 && formData.unitPrice !== defaultUnitPrice ? '' : formData.unitPrice} // Display empty if 0 and not the default
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        placeholder="Enter amount"
                        className={priceInputClasses}
                        inputMode="decimal" // Hint for decimal keyboard
                         pattern="[0-9]*[.]?[0-9]*" // Pattern for decimal numbers
                      />
                      {/* Overlay div to format the price */}
                      <div className={priceFormatClasses}>Rs. {formData.unitPrice.toFixed(2)}</div>
                    </div>
                     {/* Optional: Display unit price error if exists */}
                     {formErrors.unitPrice && <p className="text-red-500 text-xs mt-1">{formErrors.unitPrice}</p>}
                  </div>
                </div>

                <div className={formRowClasses}>
                  <div className={formGroupClasses}>
                    <label htmlFor="totalPrice" className={formLabelClasses}>Total price</label>
                    <div className={priceInputContainerClasses}>
                      {/* Input to hold the calculated value (read-only) */}
                      <input
                        type="text"
                        id="totalPrice"
                        name="totalPrice" // Name reflects the nested property, but it's readOnly
                        value={formData.totalPrice}
                        readOnly // Make it read-only
                        placeholder=""
                         className={`${formInputBaseClasses} bg-gray-200 cursor-not-allowed text-transparent caret-transparent focus:text-gray-800 focus:caret-gray-800`} // Reuse base styles + read-only/price styling
                      />
                      {/* Overlay div to format the price */}
                      <div className={priceFormatClasses}>Rs. {formData.totalPrice.toFixed(2)} only</div>
                    </div>
                  </div>
                </div>

                <div className={formRowClasses}>
                  <div className={formGroupClasses}>
                    <label htmlFor="methodOfRiceReceived" className={formLabelClasses}>Method of Rice Received</label>
                    <input
                      type="text"
                      id="methodOfRiceReceived"
                      name="methodOfRiceReceived"
                      value={formData.methodOfRiceReceived}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      className={formInputBaseClasses}
                    />
                     {/* Optional: Display error if exists */}
                     {formErrors.methodOfRiceReceived && <p className="text-red-500 text-xs mt-1">{formErrors.methodOfRiceReceived}</p>}
                  </div>
                </div>

                <div className={formRowClasses}>
                  <div className={formGroupClasses}>
                    <label htmlFor="meal" className={formLabelClasses}>Meal Recipe</label> {/* Updated label text */}
                    <input
                      type="text"
                      id="meal"
                      name="meal"
                      value={formData.meal}
                      onChange={handleInputChange}
                      onFocus={(e) => {
                        // Position cursor at the end of the text
                        const value = e.target.value;
                        e.target.setSelectionRange(value.length, value.length);
                      }}
                      placeholder="Rice is default, add more items if needed"
                      className={formInputBaseClasses}
                    />
                    <div className={helperTextClasses}>
                      Rice is included by default. Add additional items separated by commas (e.g., Rice, Dal, Green leaves).
                    </div>
                     {/* Optional: Display error if exists */}
                     {formErrors.meal && <p className="text-red-500 text-xs mt-1">{formErrors.meal}</p>}
                  </div>
                </div>

                <div className={formRowClasses}>
                  <div className={formGroupClasses}>
                    <label htmlFor="numberOfEggs" className={formLabelClasses}>Number of Eggs</label>
                    <input
                      type="text"
                      id="numberOfEggs"
                      name="numberOfEggs"
                       value={formData.numberOfEggs === 0 && formData.numberOfEggs !== 0 ? '' : formData.numberOfEggs} // Display empty if 0 unless it's explicitly set to 0
                      onChange={(e) => {
                         // Allow only non-negative digits for eggs
                         const numericValue = e.target.value.replace(/[^0-9]/g, '');
                          if (numericValue === '' || !isNaN(parseInt(numericValue))) {
                             setFormData({
                                ...formData,
                                numberOfEggs: numericValue === '' ? 0 : parseInt(numericValue, 10)
                             });
                          }
                      }}
                      onFocus={handleInputFocus}
                      className={formInputBaseClasses}
                       inputMode="numeric"
                       pattern="[0-9]*"
                    />
                     {/* Optional: Display error if exists */}
                     {formErrors.numberOfEggs && <p className="text-red-500 text-xs mt-1">{formErrors.numberOfEggs}</p>}
                  </div>
                </div>

                <div className={formRowClasses}>
                  <div className={formGroupClasses}>
                    <label htmlFor="fruits" className={formLabelClasses}>Fruits</label>
                    <input
                      type="text"
                      id="fruits"
                      name="fruits"
                      value={formData.fruits}
                      onChange={handleInputChange}
                      onFocus={handleInputFocus}
                      className={formInputBaseClasses}
                    />
                  </div>
                </div>

                <div className={formActionsClasses}>
                  <button
                    type="submit"
                    className={addButtonClasses}
                    disabled={!formValid} // Button is disabled if form is not valid
                  >
                    ADD
                  </button>
                </div>

                <div className={formFooterClasses}>
                  <button type="button" className={discardButtonClasses} onClick={handleDiscard}>
                    Discard
                  </button>
                  <button type="button" className={backButtonClasses} onClick={() => router.back()}>
                    Back
                  </button>
                </div>
              </form>
            </div>
          )}

           {/* Placeholder content for other menu items */}
          {activeMenuItem !== 'enterDailyData' && activeMenuItem !== 'contractors' && activeMenuItem !== 'generateVoucher' && activeMenuItem !== 'generateProgressReport' && (
              <div className={placeholderContentClasses}>
                <h2 className={placeholderContentH2Classes}>
                  {activeMenuItem === 'viewProfile' ? 'User Profile' :
                   activeMenuItem === 'reports' ? 'Reports' :
                   activeMenuItem === 'history' ? 'History' : 'Selected Feature'} {/* Default text */}
                </h2>
                <p>This feature is coming soon.</p>
              </div>
          )}

        </div>
      </div>

      {/* The original <style jsx> and <style jsx global> blocks are removed */}
      {/* Ensure you have Tailwind CSS configured globally in your project */}
    </div>
  );
}