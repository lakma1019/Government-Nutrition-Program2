'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Define interfaces for Supporter and Contractor data structure
interface Supporter {
  supporter_nic_number: string;
  supporter_name: string;
  supporter_contact_number: string;
  supporter_address?: string;
  contractor_nic_number: string;
  created_at?: string;
  updated_at?: string;
}

interface Contractor {
  nic_number: string;
  full_name: string;
  contact_number: string;
  address?: string;
  agreement_start_date?: string;
  agreement_end_date?: string;
  has_supporter: 'yes' | 'no';
  supporter?: Supporter | null;
  created_at?: string;
  updated_at?: string;
}


export default function ContractorsManagement() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [filteredContractors, setFilteredContractors] = useState<Contractor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentContractor, setCurrentContractor] = useState<Contractor | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contractorToDelete, setContractorToDelete] = useState<string | null>(null);
  const pathname = usePathname();

  const [formData, setFormData] = useState({
    full_name: '',
    contact_number: '',
    address: '',
    nic_number: '',
    agreement_start_date: '',
    agreement_end_date: '',
    has_supporter: 'no' as 'yes' | 'no',
    supporter_name: '',
    supporter_contact_number: '',
    supporter_address: '',
    supporter_nic_number: ''
  });

  const fetchContractors = useCallback(async () => {
    try {
      setContractors([]);
      setFilteredContractors([]);
      try {
        console.log('Fetching contractors from backend...');
        const response = await fetch('http://localhost:3001/api/contractors?username=dataeo1&password=dataeo1123');
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          throw new Error('Invalid JSON response from server');
        }
        if (!response.ok) {
           throw new Error(`Failed to fetch contractors: ${response.status} - ${data.message || responseText}`);
        }
        if (data.success && Array.isArray(data.data)) {
           const processedData = data.data.map((c: any) => ({
              ...c,
              has_supporter: c.has_supporter ? 'yes' : 'no',
              supporter: c.supporter_nic_number ? {
                  supporter_nic_number: c.supporter_nic_number,
                  supporter_name: c.supporter_name || '',
                  supporter_contact_number: c.supporter_contact_number || '',
                  supporter_address: c.supporter_address || '',
                  contractor_nic_number: c.nic_number,
                  created_at: c.supporter_created_at,
                  updated_at: c.supporter_updated_at
              } : null
           }));
          setContractors(processedData);
          setFilteredContractors(processedData);
          return;
        } else {
          throw new Error(data.message || 'Failed to fetch contractors (API reported failure)');
        }
      } catch (backendError: any) {
        console.warn('Could not fetch from backend:', backendError);
        showNotification('error', `Could not fetch contractors from the server: ${backendError.message || 'Network error'}.`);
        setContractors([]);
        setFilteredContractors([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `An unexpected error occurred: ${errorMessage}`);
    }
  }, []);

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContractors(contractors);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = contractors.filter(contractor =>
        contractor.nic_number.toLowerCase().includes(lowercaseQuery) ||
        contractor.full_name.toLowerCase().includes(lowercaseQuery) ||
        (contractor.contact_number && contractor.contact_number.toLowerCase().includes(lowercaseQuery)) ||
        (contractor.address && contractor.address.toLowerCase().includes(lowercaseQuery)) ||
        (contractor.supporter?.supporter_name && contractor.supporter.supporter_name.toLowerCase().includes(lowercaseQuery)) ||
        (contractor.supporter?.supporter_nic_number && contractor.supporter.supporter_nic_number.toLowerCase().includes(lowercaseQuery))
      );
      setFilteredContractors(filtered);
    }
  }, [searchQuery, contractors]);

  const resetForm = () => {
    setFormData({
      full_name: '',
      contact_number: '',
      address: '',
      nic_number: '',
      agreement_start_date: '',
      agreement_end_date: '',
      has_supporter: 'no',
      supporter_name: '',
      supporter_contact_number: '',
      supporter_address: '',
      supporter_nic_number: ''
    });
    setEditMode(false);
    setCurrentContractor(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const showNotification = (type: 'success' | 'error' | null, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: null, message: '' }), 5000);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.contact_number || !formData.nic_number || !formData.address) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }
    if (formData.has_supporter === 'yes' && (!formData.supporter_name || !formData.supporter_contact_number || !formData.supporter_nic_number)) {
      showNotification('error', 'Please fill in all required supporter details');
      return;
    }
    try {
      const credentials = { username: 'dataeo1', password: 'dataeo1123' };
      let response;
      let responseText;
      let data;

      if (editMode && currentContractor) {
        const dataToUpdate = { ...formData, ...credentials };
        response = await fetch(`http://localhost:3001/api/contractors/${currentContractor.nic_number}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToUpdate),
        });
        responseText = await response.text();
        try { data = JSON.parse(responseText); } catch (e) { throw new Error(`Server returned invalid JSON: ${responseText}`); }
        if (!response.ok) throw new Error(`Server returned ${response.status}: ${data.message || responseText}`);
        if (data.success) {
          showNotification('success', data.message || 'Contractor updated successfully!');
          fetchContractors();
        } else {
          throw new Error(data.message || 'Failed to update contractor');
        }
      } else {
        const dataToAdd = { ...formData, ...credentials };
        response = await fetch('http://localhost:3001/api/contractors', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToAdd),
        });
        responseText = await response.text();
        try { data = JSON.parse(responseText); } catch (e) { throw new Error(`Server returned invalid JSON: ${responseText}`); }
        if (!response.ok) throw new Error(`Server returned ${response.status}: ${data.message || responseText}`);
        if (data.success) {
          showNotification('success', data.message || 'Contractor added successfully!');
          fetchContractors();
        } else {
          throw new Error(data.message || 'Failed to add contractor');
        }
      }
      resetForm();
      setShowForm(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Failed to save contractor: ${errorMessage}`);
    }
  };

  const handleEdit = (contractor: Contractor) => {
    setCurrentContractor(contractor);
    setFormData({
      full_name: contractor.full_name,
      contact_number: contractor.contact_number,
      address: contractor.address || '',
      nic_number: contractor.nic_number,
      agreement_start_date: contractor.agreement_start_date || '',
      agreement_end_date: contractor.agreement_end_date || '',
      has_supporter: contractor.has_supporter || 'no',
      supporter_name: contractor.supporter?.supporter_name || '',
      supporter_contact_number: contractor.supporter?.supporter_contact_number || '',
      supporter_address: contractor.supporter?.supporter_address || '',
      supporter_nic_number: contractor.supporter?.supporter_nic_number || ''
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = (nicNumber: string) => {
    setContractorToDelete(nicNumber);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!contractorToDelete) {
      setShowDeleteConfirm(false);
      showNotification('error', 'No contractor selected for deletion.');
      return;
    }
    setShowDeleteConfirm(false);
    showNotification(null, '');
    try {
      const response = await fetch(`http://localhost:3001/api/contractors/${contractorToDelete}?username=dataeo1&password=dataeo1123`, { method: 'DELETE' });
      const responseText = await response.text();
      let data;
      try { data = JSON.parse(responseText); } catch (e) { throw new Error(`Server returned invalid JSON: ${responseText}`); }
      if (!response.ok) throw new Error(`Server returned ${response.status}: ${data.message || responseText}`);
      if (data.success) {
        showNotification('success', data.message || 'Contractor deleted successfully!');
        fetchContractors();
      } else {
        throw new Error(data.message || 'Failed to delete contractor');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Failed to delete contractor: ${errorMessage}`);
    }
  };

  // --- Tailwind Class Mapping ---
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
  const contractorFormClasses = "p-6";
  const formRowClasses = "flex flex-col md:flex-row gap-4 mb-4";
  const formGroupClasses = "flex-1 mb-4 md:mb-0";
  const formLabelClasses = "block mb-1.5 font-medium text-gray-700 text-sm";
  const formInputBaseClasses = "w-full py-2.5 px-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-800 focus:ring focus:ring-purple-800/20";
  const supporterSectionClasses = "mt-4 p-6 bg-purple-50 rounded-lg border-l-4 border-purple-700";
  const supporterSectionH3Classes = "text-purple-800 mb-4 text-lg font-semibold";
  const formActionsClasses = "flex justify-end gap-4 mt-6";
  const saveButtonClasses = "py-2.5 px-6 bg-purple-800 text-white border-none rounded-md cursor-pointer font-semibold transition-colors duration-300 hover:bg-purple-900";
  const cancelButtonClasses = "py-2.5 px-6 bg-gray-200 text-gray-800 border border-gray-300 rounded-md cursor-pointer font-semibold transition-colors duration-300 hover:bg-gray-300";
  const tableContainerClasses = "bg-white rounded-lg shadow-md overflow-x-auto";
  const contractorsTableClasses = "w-full border-collapse";
  const tableHeaderCellClasses = "px-6 py-3 text-left border-b border-gray-200 bg-purple-100 font-semibold text-purple-800 text-sm uppercase tracking-wider whitespace-nowrap";
  const tableDataCellClasses = "px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-200";
  const tableRowHoverClasses = "hover:bg-gray-50";
  // ActionsCellClasses removed as it's no longer used in the table
  const actionButtonBaseClasses = "inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150";
  // actionButtonViewClasses, actionButtonEditClasses, actionButtonDeleteClasses are kept in case used by modal or other parts
  const actionButtonViewClasses = `${actionButtonBaseClasses} bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500`;
  const actionButtonEditClasses = `${actionButtonBaseClasses} bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500`;
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


  return (
    <div className={containerClasses}>
      <nav className={navbarClasses}>
        <div className={brandClasses}>Government Nutrition Program</div>
        <div className={navLinksClasses}>
          <Link href="/DEO_login" className={`${navLinkBaseClasses} ${pathname === "/DEO_login" ? linkTextHighlightClasses : ""}`}>
            <span className={linkTextBaseClasses}>Dashboard</span>
          </Link>
          <Link href="/DEO_login/DEO_contractors" className={`${navLinkBaseClasses} ${pathname === "/DEO_login/DEO_contractors" ? linkTextHighlightClasses : ""}`}>
            <span className={linkTextBaseClasses}>Contractors</span>
          </Link>
          <Link href="/login" className={navLinkBaseClasses}>
            <span className={linkTextBaseClasses}>Logout</span>
          </Link>
        </div>
      </nav>

      <div className={mainContentClasses}>
        <div className={pageHeaderClasses}>
          <h1 className={pageHeaderH1Classes}>Contractors Management</h1>
          <p className={pageHeaderPClasses}>Manage contractor information and agreements</p>
        </div>

        <div className={controlsSectionClasses}>
          <div className={searchContainerClasses}>
            <input
              type="text"
              placeholder="Search by NIC number, name, contact..."
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
            Add New Contractor
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
              <h2 className={formHeaderH2Classes}>{editMode ? 'Edit Contractor' : 'Add New Contractor'}</h2>
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
            <form className={contractorFormClasses} onSubmit={handleSubmit}>
              <div className={formRowClasses}>
                <div className={formGroupClasses}>
                  <label htmlFor="full_name" className={formLabelClasses}>Full Name*</label>
                  <input type="text" id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} required className={formInputBaseClasses} />
                </div>
                <div className={formGroupClasses}>
                  <label htmlFor="contact_number" className={formLabelClasses}>Contact Number*</label>
                  <input type="tel" id="contact_number" name="contact_number" value={formData.contact_number} onChange={handleInputChange} required pattern="[0-9]{10}" title="Enter a 10-digit phone number" className={formInputBaseClasses} />
                </div>
              </div>
              <div className={formGroupClasses}>
                <label htmlFor="address" className={formLabelClasses}>Address*</label>
                <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} rows={2} required className={`${formInputBaseClasses} resize-y`} />
              </div>
              <div className={formRowClasses}>
                <div className={formGroupClasses}>
                  <label htmlFor="nic_number" className={formLabelClasses}>NIC Number*</label>
                  <input type="text" id="nic_number" name="nic_number" value={formData.nic_number} onChange={handleInputChange} required pattern="[0-9]{9}[vVxX]|[0-9]{12}" title="Enter a valid NIC number (e.g., 123456789V or 199012345678)" className={formInputBaseClasses} disabled={editMode} />
                   {editMode && <p className="text-xs text-gray-500 mt-1">NIC Number cannot be changed in edit mode.</p>}
                </div>
                 <div className={formGroupClasses}>
                   <label htmlFor="has_supporter" className={formLabelClasses}>Has Supporter?</label>
                   <select id="has_supporter" name="has_supporter" value={formData.has_supporter} onChange={handleInputChange} className={formInputBaseClasses} >
                     <option value="no">No</option>
                     <option value="yes">Yes</option>
                   </select>
                 </div>
              </div>
               <div className={formRowClasses}>
                 <div className={formGroupClasses}>
                   <label htmlFor="agreement_start_date" className={formLabelClasses}>Agreement Start Date</label>
                   <input type="date" id="agreement_start_date" name="agreement_start_date" value={formData.agreement_start_date} onChange={handleInputChange} className={formInputBaseClasses} />
                 </div>
                 <div className={formGroupClasses}>
                   <label htmlFor="agreement_end_date" className={formLabelClasses}>Agreement End Date</label>
                   <input type="date" id="agreement_end_date" name="agreement_end_date" value={formData.agreement_end_date} onChange={handleInputChange} className={formInputBaseClasses} />
                 </div>
               </div>

              {formData.has_supporter === 'yes' && (
                <div className={supporterSectionClasses}>
                  <h3 className={supporterSectionH3Classes}>Supporter Details</h3>
                  <div className={formRowClasses}>
                    <div className={formGroupClasses}>
                      <label htmlFor="supporter_name" className={formLabelClasses}>Supporter Name*</label>
                      <input type="text" id="supporter_name" name="supporter_name" value={formData.supporter_name} onChange={handleInputChange} required={formData.has_supporter === 'yes'} className={formInputBaseClasses} />
                    </div>
                    <div className={formGroupClasses}>
                      <label htmlFor="supporter_contact_number" className={formLabelClasses}>Supporter Contact Number*</label>
                      <input type="tel" id="supporter_contact_number" name="supporter_contact_number" value={formData.supporter_contact_number} onChange={handleInputChange} required={formData.has_supporter === 'yes'} pattern="[0-9]{10}" title="Enter a 10-digit phone number" className={formInputBaseClasses} />
                    </div>
                  </div>
                  <div className={formGroupClasses}>
                    <label htmlFor="supporter_address" className={formLabelClasses}>Supporter Address</label>
                    <textarea id="supporter_address" name="supporter_address" value={formData.supporter_address} onChange={handleInputChange} rows={2} className={`${formInputBaseClasses} resize-y`} />
                  </div>
                  <div className={formRowClasses}>
                    <div className={formGroupClasses}>
                      <label htmlFor="supporter_nic_number" className={formLabelClasses}>Supporter NIC Number*</label>
                      <input type="text" id="supporter_nic_number" name="supporter_nic_number" value={formData.supporter_nic_number} onChange={handleInputChange} required={formData.has_supporter === 'yes'} pattern="[0-9]{9}[vVxX]|[0-9]{12}" title="Enter a valid NIC number (e.g., 123456789V or 199012345678)" className={formInputBaseClasses} />
                    </div>
                  </div>
                </div>
              )}

              <div className={formActionsClasses}>
                <button type="submit" className={saveButtonClasses}>
                  {editMode ? 'Update Contractor' : 'Save Contractor'}
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
            <table className={contractorsTableClasses}>
              <thead>
                <tr>
                  <th className={tableHeaderCellClasses}>ID</th>
                  <th className={tableHeaderCellClasses}>Contractor NIC</th>
                  <th className={tableHeaderCellClasses}>Full Name</th>
                  <th className={tableHeaderCellClasses}>Contact Number</th>
                  <th className={tableHeaderCellClasses}>Address</th>
                  <th className={tableHeaderCellClasses}>Agreement No.</th>
                  <th className={tableHeaderCellClasses}>Agreement Start Date</th>
                  <th className={tableHeaderCellClasses}>Agreement End Date</th>
                  <th className={tableHeaderCellClasses}>Is Active</th>
                  <th className={tableHeaderCellClasses}>Created At</th>
                  <th className={tableHeaderCellClasses}>Updated At</th>
                  {/* Actions column header removed */}
                </tr>
              </thead>
              <tbody>
                {filteredContractors.map((contractor) => (
                  <tr key={contractor.nic_number} className={tableRowHoverClasses}>
                    <td className={tableDataCellClasses}>{contractor.nic_number}</td>
                    <td className={tableDataCellClasses}>{contractor.nic_number}</td>
                    <td className={tableDataCellClasses}>{contractor.full_name}</td>
                    <td className={tableDataCellClasses}>{contractor.contact_number}</td>
                    <td className={`${tableDataCellClasses} whitespace-normal`}>{contractor.address || 'N/A'}</td>
                    <td className={tableDataCellClasses}>{'N/A'}</td>
                    <td className={tableDataCellClasses}>{formatDate(contractor.agreement_start_date) || 'N/A'}</td>
                    <td className={tableDataCellClasses}>{formatDate(contractor.agreement_end_date) || 'N/A'}</td>
                    <td className={tableDataCellClasses}>{'N/A'}</td>
                    <td className={tableDataCellClasses}>{formatDate(contractor.created_at) || 'N/A'}</td>
                    <td className={tableDataCellClasses}>{formatDate(contractor.updated_at) || 'N/A'}</td>
                    {/* Actions column data cell removed */}
                  </tr>
                ))}

                {filteredContractors.length === 0 && (
                  <tr>
                    <td colSpan={11} className={noDataCellClasses}> {/* Updated colSpan to 11 */}
                      No contractors found. {searchQuery ? 'Try a different search term.' : 'Add a new contractor to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Note: The Edit and Delete buttons were in the Actions column.
                If you need to re-enable editing/deleting, you'll need to add
                those buttons back, perhaps via a different UI element per row
                or by reintroducing the Actions column. The handleEdit and handleDelete
                functions still exist.
            */}

            {showDeleteConfirm && (
              <div className={modalOverlayClasses}>
                <div className={modalContentClasses}>
                  <div className={modalHeaderClasses}>
                    <h2 className={modalHeaderH2Classes}>Confirm Deletion</h2>
                    <button className={closeModalClasses} onClick={() => setShowDeleteConfirm(false)}>×</button>
                  </div>
                  <div className={modalBodyClasses}>
                    <p className="mb-4">Are you sure you want to delete this contractor? This action cannot be undone.</p>
                    {contractorToDelete && (
                        <p className="font-semibold">Contractor NIC: <span className="font-normal">{contractorToDelete}</span></p>
                     )}
                    <div className={modalFormActionsClasses}>
                      <button type="button" className={deleteConfirmButtonClasses} onClick={confirmDelete}>Delete Contractor</button>
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