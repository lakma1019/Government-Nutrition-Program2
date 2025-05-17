'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Define interface for DailyData
interface DailyData {
  id?: number;
  date: string; // Store as YYYY-MM-DD string
  female: number;
  male: number;
  total: number;
  unit_price: number; // Store as number, format for display/input
  amount: number;     // Store as number, format for display/input
  method_of_rice_received: 'donated' | 'purchased';
  meal_recipe: string;
  number_of_eggs: number;
  fruits?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Form data will often use strings for inputs, then convert
interface DailyDataFormData {
  date: string;
  female: string;
  male: string;
  unit_price: string;
  method_of_rice_received: 'donated' | 'purchased';
  meal_recipe: string;
  number_of_eggs: string;
  fruits?: string;
}

export default function DailyDataManagement() {
  const [dailyEntries, setDailyEntries] = useState<DailyData[]>([]);
  const [filteredDailyEntries, setFilteredDailyEntries] = useState<DailyData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<DailyData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDeleteId, setEntryToDeleteId] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, token } = useAuth();

  const initialFormData: DailyDataFormData = {
    date: new Date().toISOString().split('T')[0], // Default to today
    female: '0',
    male: '0',
    unit_price: '0.00',
    method_of_rice_received: 'purchased',
    meal_recipe: '',
    number_of_eggs: '0',
    fruits: '',
  };

  const [formData, setFormData] = useState<DailyDataFormData>(initialFormData);

  // Calculated values based on formData
  const calculatedTotal = (parseInt(formData.female) || 0) + (parseInt(formData.male) || 0);
  const calculatedAmount =
    formData.method_of_rice_received === 'purchased'
      ? (calculatedTotal * (parseFloat(formData.unit_price) || 0))
      : 0;

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user is authenticated
        if (!user || !token) {
          router.push('/login');
          return;
        }

        // Check if user is a data entry officer
        if (user.role !== 'dataEntryOfficer') {
          alert('Access denied. Only Data Entry Officers can access this page.');
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [user, token, router]);

  const fetchDailyData = useCallback(async () => {
    if (!token) {
      showNotification('error', 'Authentication required. Please log in.');
      return;
    }

    try {
      setDailyEntries([]);
      setFilteredDailyEntries([]);

      const response = await fetch('http://localhost:3001/api/daily-data', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch daily data: ${response.status} - ${data.message || responseText}`);
      }

      if (data.success && Array.isArray(data.data)) {
        const processedData = data.data.map((d: any) => ({
            ...d,
            // Ensure numbers are numbers, not strings from DB if that happens
            female: Number(d.female),
            male: Number(d.male),
            total: Number(d.total),
            unit_price: parseFloat(d.unit_price),
            amount: parseFloat(d.amount),
            number_of_eggs: Number(d.number_of_eggs),
            date: d.date ? new Date(d.date).toISOString().split('T')[0] : '', // Format date
        }));
        setDailyEntries(processedData);
        setFilteredDailyEntries(processedData);
      } else {
        throw new Error(data.message || 'Failed to fetch daily data (API reported failure)');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Could not fetch daily data: ${errorMessage}. Check API connection.`);
      setDailyEntries([]);
      setFilteredDailyEntries([]);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDailyData();
    }
  }, [fetchDailyData, token]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDailyEntries(dailyEntries);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = dailyEntries.filter(entry =>
        entry.date.includes(lowercaseQuery) || // Simple date string search
        entry.meal_recipe.toLowerCase().includes(lowercaseQuery) ||
        (entry.fruits && entry.fruits.toLowerCase().includes(lowercaseQuery))
      );
      setFilteredDailyEntries(filtered);
    }
  }, [searchQuery, dailyEntries]);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditMode(false);
    setCurrentEntry(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showNotification = (type: 'success' | 'error' | null, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: null, message: '' }), 5000);
  };

  const formatDateForDisplay = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      // Assuming dateString is YYYY-MM-DD
      const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues with just date
      if (isNaN(date.getTime())) return dateString; // If invalid, return original
      return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format, good for consistency
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || formData.meal_recipe.trim() === '') {
      showNotification('error', 'Date and Meal Recipe are required.');
      return;
    }
    if ((parseInt(formData.female) || 0) < 0 || (parseInt(formData.male) || 0) < 0) {
        showNotification('error', 'Female and Male counts cannot be negative.');
        return;
    }
    if ((parseInt(formData.number_of_eggs) || 0) < 0) {
        showNotification('error', 'Number of eggs cannot be negative.');
        return;
    }
    if (formData.method_of_rice_received === 'purchased' && (parseFloat(formData.unit_price) || 0) <= 0) {
        showNotification('error', 'Unit price must be positive if rice is purchased.');
        return;
    }


    const entryPayload: Omit<DailyData, 'id' | 'created_at' | 'updated_at'> = {
      date: formData.date,
      female: parseInt(formData.female) || 0,
      male: parseInt(formData.male) || 0,
      total: calculatedTotal,
      unit_price: formData.method_of_rice_received === 'donated' ? 0 : (parseFloat(formData.unit_price) || 0),
      amount: formData.method_of_rice_received === 'donated' ? 0 : calculatedAmount,
      method_of_rice_received: formData.method_of_rice_received,
      meal_recipe: formData.meal_recipe,
      number_of_eggs: parseInt(formData.number_of_eggs) || 0,
      fruits: formData.fruits?.trim() || null,
    };

    try {
      if (!token) {
        showNotification('error', 'Authentication required. Please log in.');
        return;
      }

      let response;
      let responseText;
      let data;

      if (editMode && currentEntry?.id) {
        response = await fetch(`http://localhost:3001/api/daily-data/${currentEntry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(entryPayload),
        });
      } else {
        response = await fetch('http://localhost:3001/api/daily-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(entryPayload),
        });
      }

      responseText = await response.text();
      try { data = JSON.parse(responseText); } catch (e) { throw new Error(`Server returned invalid JSON: ${responseText}`); }

      if (!response.ok) throw new Error(`Server returned ${response.status}: ${data.message || responseText}`);

      if (data.success) {
        showNotification('success', data.message || `Daily entry ${editMode ? 'updated' : 'added'} successfully!`);
        fetchDailyData();
        resetForm();
        setShowForm(false);
      } else {
        throw new Error(data.message || `Failed to ${editMode ? 'update' : 'add'} entry`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Failed to save entry: ${errorMessage}`);
    }
  };

  const handleEdit = (entry: DailyData) => {
    setCurrentEntry(entry);
    setFormData({
      date: entry.date,
      female: String(entry.female),
      male: String(entry.male),
      unit_price: String(entry.unit_price.toFixed(2)),
      method_of_rice_received: entry.method_of_rice_received,
      meal_recipe: entry.meal_recipe,
      number_of_eggs: String(entry.number_of_eggs),
      fruits: entry.fruits || '',
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = (id: number | undefined) => {
    if (id === undefined) {
        showNotification('error', 'Cannot delete entry without ID.');
        return;
    }
    setEntryToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!entryToDeleteId) {
      setShowDeleteConfirm(false);
      showNotification('error', 'No entry selected for deletion.');
      return;
    }

    if (!token) {
      showNotification('error', 'Authentication required. Please log in.');
      setShowDeleteConfirm(false);
      return;
    }

    setShowDeleteConfirm(false);
    try {
      const response = await fetch(`http://localhost:3001/api/daily-data/${entryToDeleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      let data;
      try { data = JSON.parse(responseText); } catch (e) { throw new Error(`Server returned invalid JSON: ${responseText}`); }

      if (!response.ok) throw new Error(`Server returned ${response.status}: ${data.message || responseText}`);

      if (data.success) {
        showNotification('success', data.message || 'Entry deleted successfully!');
        fetchDailyData();
      } else {
        throw new Error(data.message || 'Failed to delete entry');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Failed to delete entry: ${errorMessage}`);
    }
    setEntryToDeleteId(null);
  };

  // --- Reusing Tailwind Class Mappings from your example ---
  const containerClasses = "w-full min-h-screen flex flex-col bg-[#ebd9eb] font-sans";
  const navbarClasses = "flex justify-between items-center py-4 px-6 mb-5 bg-[#e6b3d9] rounded-lg shadow-md";
  const brandClasses = "text-xl font-bold text-gray-800";
  const navLinksClasses = "flex space-x-4";
  const navLinkBaseClasses = "inline-flex group";
  const linkTextBaseClasses = "inline-block py-1.5 px-4 bg-white rounded-full text-black text-sm font-bold transition-all duration-200 ease-in-out";
  const linkTextHoverClasses = "group-hover:bg-[#f0e0f0]";
  const linkTextHighlightClasses = "bg-[#f0e0f0] border-2 border-[#d070d0] !text-black";
  const mainContentClasses = "flex-1 p-8 max-w-screen-xl mx-auto w-full";
  const pageHeaderClasses = "mb-8";
  const pageHeaderH1Classes = "text-purple-800 text-2xl font-bold mb-1";
  const pageHeaderPClasses = "text-gray-600 text-base";
  const controlsSectionClasses = "flex justify-between items-center mb-8 flex-wrap gap-4";
  const searchContainerClasses = "flex items-center w-full max-w-md border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm flex-grow";
  const searchInputClasses = "flex-1 py-2.5 px-3 border-none outline-none text-sm";
  const searchButtonClasses = "bg-gray-100 border-none py-2.5 px-4 cursor-pointer transition-colors duration-300 hover:bg-gray-200 text-gray-600";
  const searchIconClasses = "text-base";
  const addButtonClasses = "py-2.5 px-6 bg-purple-800 text-white border-none rounded-md cursor-pointer font-semibold transition-colors duration-300 hover:bg-purple-900";
  const notificationBaseClasses = "flex items-center p-4 my-2 rounded-lg shadow-sm animate-slideIn relative";
  const notificationSuccessClasses = `${notificationBaseClasses} bg-green-100 border-l-4 border-green-500 text-green-800`;
  const notificationErrorClasses = `${notificationBaseClasses} bg-red-100 border-l-4 border-red-500 text-red-800`;
  const notificationIconClasses = "mr-3 text-xl";
  const closeNotificationClasses = "absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none text-xl cursor-pointer opacity-60 hover:opacity-100";
  const formContainerClasses = "bg-white rounded-lg shadow-md mb-8 overflow-hidden";
  const formHeaderClasses = "flex justify-between items-center p-6 border-b border-gray-200";
  const formHeaderH2Classes = "m-0 text-xl font-semibold text-purple-800";
  const closeFormClasses = "bg-none border-none text-2xl cursor-pointer text-gray-600 hover:text-red-600";
  const dataFormClasses = "p-6"; // Renamed from contractorFormClasses
  const formRowClasses = "flex flex-col md:flex-row gap-4 mb-4";
  const formGroupClasses = "flex-1 mb-4 md:mb-0";
  const formLabelClasses = "block mb-1.5 font-medium text-gray-700 text-sm";
  const formInputBaseClasses = "w-full py-2.5 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-800 focus:ring focus:ring-purple-800/20";
  const formActionsClasses = "flex justify-end gap-4 mt-6";
  const saveButtonClasses = "py-2.5 px-6 bg-purple-800 text-white border-none rounded-md cursor-pointer font-semibold transition-colors duration-300 hover:bg-purple-900";
  const cancelButtonClasses = "py-2.5 px-6 bg-gray-200 text-gray-800 border border-gray-300 rounded-md cursor-pointer font-semibold transition-colors duration-300 hover:bg-gray-300";
  const tableContainerClasses = "bg-white rounded-lg shadow-md overflow-x-auto";
  const dataTableClasses = "w-full border-collapse"; // Renamed
  const tableHeaderCellClasses = "px-6 py-3 text-left border-b border-gray-200 bg-purple-100 font-semibold text-purple-800 text-sm uppercase tracking-wider whitespace-nowrap";
  const tableDataCellClasses = "px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-200";
  const tableRowHoverClasses = "hover:bg-gray-50";
  const actionsCellClasses = `${tableDataCellClasses} text-right space-x-2`;
  const actionButtonBaseClasses = "inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150";
  const actionButtonEditClasses = `${actionButtonBaseClasses} bg-yellow-400 text-black hover:bg-yellow-500 focus:ring-yellow-400`;
  const actionButtonDeleteClasses = `${actionButtonBaseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
  const noDataCellClasses = "px-6 py-4 text-center text-gray-500 italic";
  const modalOverlayClasses = "fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm";
  const modalContentClasses = "bg-white rounded-lg w-11/12 max-w-sm shadow-xl overflow-hidden";
  const modalHeaderClasses = "bg-gray-100 py-4 px-5 border-b border-gray-200 flex justify-between items-center";
  const modalHeaderH2Classes = "m-0 text-lg font-semibold text-gray-800";
  const closeModalClasses = "bg-none border-none text-2xl cursor-pointer text-gray-600 hover:text-red-600";
  const modalBodyClasses = "p-6 text-gray-700 text-sm";
  const modalFormActionsClasses = "flex justify-end gap-3 mt-4";
  const deleteConfirmButtonClasses = `${actionButtonBaseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
  const modalCancelButtonClasses = `${actionButtonBaseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-200`;
  const readOnlyInputClasses = `${formInputBaseClasses} bg-gray-100 cursor-not-allowed`;


  return (
    <div className={containerClasses}>
      <nav className={navbarClasses}>
        <div className={brandClasses}>Government Nutrition Program</div>
        <div className={navLinksClasses}>
          <Link href="/DEO_login" className={`${navLinkBaseClasses} ${pathname === "/DEO_login" ? linkTextHighlightClasses : ""}`}>
            <span className={linkTextBaseClasses}>Dashboard</span>
          </Link>
          <Link href="/" className={navLinkBaseClasses}>
            <span className={linkTextBaseClasses}>Logout</span>
          </Link>
        </div>
      </nav>

      <div className={mainContentClasses}>
        <div className={pageHeaderClasses}>
          <h1 className={pageHeaderH1Classes}>Daily Data Management</h1>
          <p className={pageHeaderPClasses}>Manage daily meal program information</p>
        </div>

        <div className={controlsSectionClasses}>
          <div className={searchContainerClasses}>
            <input
              type="text"
              placeholder="Search by date (YYYY-MM-DD), recipe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={searchInputClasses}
            />
            <button className={searchButtonClasses}>
              <span className={searchIconClasses}>🔍</span>
            </button>
          </div>
          <button
            className={addButtonClasses}
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            Add New Entry
          </button>
        </div>

        {notification.type && (
          <div className={`${notificationBaseClasses} ${notification.type === 'success' ? notificationSuccessClasses : notificationErrorClasses}`}>
            <span className={notificationIconClasses}>
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="flex-grow">{notification.message}</span>
            <button
              className={closeNotificationClasses}
              onClick={() => setNotification({type: null, message: ''})}
            >
              ×
            </button>
          </div>
        )}

        {showForm && (
          <div className={formContainerClasses}>
            <div className={formHeaderClasses}>
              <h2 className={formHeaderH2Classes}>{editMode ? 'Edit Daily Entry' : 'Add New Daily Entry'}</h2>
              <button
                className={closeFormClasses}
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <form className={dataFormClasses} onSubmit={handleSubmit}>
              <div className={formRowClasses}>
                <div className={formGroupClasses}>
                  <label htmlFor="date" className={formLabelClasses}>Date*</label>
                  <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} required className={formInputBaseClasses} />
                </div>
                <div className={formGroupClasses}>
                    <label htmlFor="method_of_rice_received" className={formLabelClasses}>Method of Rice Received*</label>
                    <select id="method_of_rice_received" name="method_of_rice_received" value={formData.method_of_rice_received} onChange={handleInputChange} className={formInputBaseClasses}>
                        <option value="purchased">Purchased</option>
                        <option value="donated">Donated</option>
                    </select>
                </div>
              </div>

              <div className={formRowClasses}>
                <div className={formGroupClasses}>
                  <label htmlFor="female" className={formLabelClasses}>Female Count*</label>
                  <input type="number" id="female" name="female" value={formData.female} onChange={handleInputChange} required min="0" className={formInputBaseClasses} />
                </div>
                <div className={formGroupClasses}>
                  <label htmlFor="male" className={formLabelClasses}>Male Count*</label>
                  <input type="number" id="male" name="male" value={formData.male} onChange={handleInputChange} required min="0" className={formInputBaseClasses} />
                </div>
                <div className={formGroupClasses}>
                  <label htmlFor="total" className={formLabelClasses}>Total Beneficiaries</label>
                  <input type="number" id="total" name="total" value={calculatedTotal} readOnly className={readOnlyInputClasses} />
                </div>
              </div>

              <div className={formRowClasses}>
                 <div className={formGroupClasses}>
                  <label htmlFor="unit_price" className={formLabelClasses}>
                    Unit Price (per beneficiary)*
                    {formData.method_of_rice_received === 'donated' && <span className="text-xs text-gray-500"> (N/A for donated)</span>}
                  </label>
                  <input
                    type="number"
                    id="unit_price"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleInputChange}
                    required={formData.method_of_rice_received === 'purchased'}
                    min="0.00"
                    step="0.01"
                    className={formData.method_of_rice_received === 'donated' ? readOnlyInputClasses : formInputBaseClasses}
                    readOnly={formData.method_of_rice_received === 'donated'}
                  />
                </div>
                <div className={formGroupClasses}>
                  <label htmlFor="amount" className={formLabelClasses}>Total Amount</label>
                  <input type="number" id="amount" name="amount" value={calculatedAmount.toFixed(2)} readOnly className={readOnlyInputClasses} />
                </div>
              </div>

              <div className={formGroupClasses}>
                <label htmlFor="meal_recipe" className={formLabelClasses}>Meal Recipe*</label>
                <textarea id="meal_recipe" name="meal_recipe" value={formData.meal_recipe} onChange={handleInputChange} rows={3} required className={`${formInputBaseClasses} resize-y`} />
              </div>

              <div className={formRowClasses}>
                <div className={formGroupClasses}>
                  <label htmlFor="number_of_eggs" className={formLabelClasses}>Number of Eggs</label>
                  <input type="number" id="number_of_eggs" name="number_of_eggs" value={formData.number_of_eggs} onChange={handleInputChange} min="0" className={formInputBaseClasses} />
                </div>
                <div className={formGroupClasses}>
                  <label htmlFor="fruits" className={formLabelClasses}>Fruits (Optional)</label>
                  <input type="text" id="fruits" name="fruits" value={formData.fruits} onChange={handleInputChange} className={formInputBaseClasses} placeholder="e.g., Apples, Bananas" />
                </div>
              </div>

              <div className={formActionsClasses}>
                <button type="submit" className={saveButtonClasses}>
                  {editMode ? 'Update Entry' : 'Save Entry'}
                </button>
                <button type="button" className={cancelButtonClasses}
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!showForm && (
          <div className={tableContainerClasses}>
            <table className={dataTableClasses}>
              <thead>
                <tr>
                  <th className={tableHeaderCellClasses}>ID</th>
                  <th className={tableHeaderCellClasses}>Date</th>
                  <th className={tableHeaderCellClasses}>Female</th>
                  <th className={tableHeaderCellClasses}>Male</th>
                  <th className={tableHeaderCellClasses}>Total</th>
                  <th className={tableHeaderCellClasses}>Unit Price</th>
                  <th className={tableHeaderCellClasses}>Amount</th>
                  <th className={tableHeaderCellClasses}>Rice Method</th>
                  <th className={tableHeaderCellClasses}>Meal Recipe</th>
                  <th className={tableHeaderCellClasses}>Eggs</th>
                  <th className={tableHeaderCellClasses}>Fruits</th>
                  <th className={tableHeaderCellClasses}>Created At</th>
                  <th className={tableHeaderCellClasses}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDailyEntries.map((entry) => (
                  <tr key={entry.id} className={tableRowHoverClasses}>
                    <td className={tableDataCellClasses}>{entry.id}</td>
                    <td className={tableDataCellClasses}>{formatDateForDisplay(entry.date)}</td>
                    <td className={tableDataCellClasses}>{entry.female}</td>
                    <td className={tableDataCellClasses}>{entry.male}</td>
                    <td className={tableDataCellClasses}>{entry.total}</td>
                    <td className={tableDataCellClasses}>${entry.unit_price.toFixed(2)}</td>
                    <td className={tableDataCellClasses}>${entry.amount.toFixed(2)}</td>
                    <td className={tableDataCellClasses}>{entry.method_of_rice_received}</td>
                    <td className={`${tableDataCellClasses} whitespace-normal max-w-xs truncate`}>{entry.meal_recipe}</td>
                    <td className={tableDataCellClasses}>{entry.number_of_eggs}</td>
                    <td className={tableDataCellClasses}>{entry.fruits || 'N/A'}</td>
                    <td className={tableDataCellClasses}>{formatDateForDisplay(entry.created_at)}</td>
                    <td className={actionsCellClasses}>
                      <button onClick={() => handleEdit(entry)} className={actionButtonEditClasses}>Edit</button>
                      <button onClick={() => handleDelete(entry.id)} className={actionButtonDeleteClasses}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filteredDailyEntries.length === 0 && (
                  <tr>
                    <td colSpan={13} className={noDataCellClasses}>
                      No daily entries found. {searchQuery ? 'Try a different search term.' : 'Add a new entry to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {showDeleteConfirm && (
              <div className={modalOverlayClasses}>
                <div className={modalContentClasses}>
                  <div className={modalHeaderClasses}>
                    <h2 className={modalHeaderH2Classes}>Confirm Deletion</h2>
                    <button className={closeModalClasses} onClick={() => setShowDeleteConfirm(false)}>×</button>
                  </div>
                  <div className={modalBodyClasses}>
                    <p className="mb-4">Are you sure you want to delete this daily entry? This action cannot be undone.</p>
                    {entryToDeleteId && (
                        <p className="font-semibold">Entry ID: <span className="font-normal">{entryToDeleteId}</span></p>
                     )}
                    <div className={modalFormActionsClasses}>
                      <button type="button" className={deleteConfirmButtonClasses} onClick={confirmDelete}>Delete Entry</button>
                      <button type="button" className={modalCancelButtonClasses} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}