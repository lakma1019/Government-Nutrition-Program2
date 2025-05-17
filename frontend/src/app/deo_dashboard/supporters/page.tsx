'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Supporter {
  id?: number;
  supporter_nic_number: string;
  supporter_name: string;
  supporter_contact_number: string;
  supporter_address?: string;
  contractor_id?: number | null;
  contractor_nic_number?: string | null;
  contractor_name?: string | null;
  is_active?: 'yes' | 'no';
  created_at?: string;
  updated_at?: string;
}

export default function SupportersManagement() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [filteredSupporters, setFilteredSupporters] = useState<Supporter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSupporter, setCurrentSupporter] = useState<Supporter | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [supporterToDelete, setSupporterToDelete] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    supporter_name: '',
    supporter_contact_number: '',
    supporter_address: '',
    supporter_nic_number: '',
    contractor_nic_number: '',
    is_active: 'yes' as 'yes' | 'no'
  });

  const showNotification = (type: 'success' | 'error' | null, message: string) => {
    setNotification({ type, message });
    if (type) {
      setTimeout(() => {
        setNotification({ type: null, message: '' });
      }, 5000);
    }
  };

  const fetchSupporters = useCallback(async () => {
    if (!token) {
      showNotification('error', 'Authentication required. Please log in.');
      return;
    }

    try {
      setSupporters([]);
      setFilteredSupporters([]);
      try {
        console.log('Fetching supporters from backend...');
        const response = await fetch('http://localhost:3001/api/supporters', {
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
           throw new Error(`Failed to fetch supporters: ${response.status} - ${data.message || responseText}`);
        }
        if (data.success && Array.isArray(data.data)) {
          setSupporters(data.data);
          setFilteredSupporters(data.data);
          return;
        } else {
          throw new Error(data.message || 'Failed to fetch supporters (API reported failure)');
        }
      } catch (backendError: any) {
        console.warn('Could not fetch from backend:', backendError);
        showNotification('error', `Could not fetch supporters from the server: ${backendError.message || 'Network error'}.`);
        setSupporters([]);
        setFilteredSupporters([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `An unexpected error occurred: ${errorMessage}`);
    }
  }, [token]);

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

  useEffect(() => {
    if (token) {
      fetchSupporters();
    }
  }, [fetchSupporters, token]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSupporters(supporters);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = supporters.filter(supporter => 
        supporter.supporter_name.toLowerCase().includes(lowercasedQuery) ||
        supporter.supporter_nic_number.toLowerCase().includes(lowercasedQuery) ||
        supporter.supporter_contact_number.toLowerCase().includes(lowercasedQuery) ||
        (supporter.contractor_name && supporter.contractor_name.toLowerCase().includes(lowercasedQuery))
      );
      setFilteredSupporters(filtered);
    }
  }, [searchQuery, supporters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      supporter_name: '',
      supporter_contact_number: '',
      supporter_address: '',
      supporter_nic_number: '',
      contractor_nic_number: '',
      is_active: 'yes'
    });
    setEditMode(false);
    setCurrentSupporter(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      showNotification('error', 'Authentication required. Please log in.');
      return;
    }
    
    if (!formData.supporter_name || !formData.supporter_contact_number || !formData.supporter_nic_number) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }
    
    try {
      let response;
      let responseText;
      let data;

      if (editMode && currentSupporter) {
        response = await fetch(`http://localhost:3001/api/supporters/${currentSupporter.supporter_nic_number}`, {
          method: 'PUT', 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }, 
          body: JSON.stringify(formData),
        });
        responseText = await response.text();
        try { data = JSON.parse(responseText); } catch (e) { throw new Error(`Server returned invalid JSON: ${responseText}`); }
        if (!response.ok) throw new Error(`Server returned ${response.status}: ${data.message || responseText}`);
        if (data.success) {
          showNotification('success', data.message || 'Supporter updated successfully!');
          fetchSupporters();
        } else {
          throw new Error(data.message || 'Failed to update supporter');
        }
      } else {
        response = await fetch('http://localhost:3001/api/supporters', {
          method: 'POST', 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }, 
          body: JSON.stringify(formData),
        });
        responseText = await response.text();
        try { data = JSON.parse(responseText); } catch (e) { throw new Error(`Server returned invalid JSON: ${responseText}`); }
        if (!response.ok) throw new Error(`Server returned ${response.status}: ${data.message || responseText}`);
        if (data.success) {
          showNotification('success', data.message || 'Supporter added successfully!');
          fetchSupporters();
        } else {
          throw new Error(data.message || 'Failed to add supporter');
        }
      }
      resetForm();
      setShowForm(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Failed to save supporter: ${errorMessage}`);
    }
  };

  const handleEdit = (supporter: Supporter) => {
    setCurrentSupporter(supporter);
    setFormData({
      supporter_name: supporter.supporter_name,
      supporter_contact_number: supporter.supporter_contact_number,
      supporter_address: supporter.supporter_address || '',
      supporter_nic_number: supporter.supporter_nic_number,
      contractor_nic_number: supporter.contractor_nic_number || '',
      is_active: supporter.is_active || 'yes'
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = (nicNumber: string) => {
    setSupporterToDelete(nicNumber);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!supporterToDelete) {
      setShowDeleteConfirm(false);
      showNotification('error', 'No supporter selected for deletion.');
      return;
    }
    
    if (!token) {
      showNotification('error', 'Authentication required. Please log in.');
      setShowDeleteConfirm(false);
      return;
    }
    
    setShowDeleteConfirm(false);
    showNotification(null, '');
    try {
      const response = await fetch(`http://localhost:3001/api/supporters/${supporterToDelete}`, { 
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
        showNotification('success', data.message || 'Supporter deleted successfully!');
        fetchSupporters();
      } else {
        throw new Error(data.message || 'Failed to delete supporter');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Failed to delete supporter: ${errorMessage}`);
    }
  };

  // CSS Classes
  const navLinksClasses = "flex space-x-4";
  const navLinkBaseClasses = "inline-flex group";
  const linkTextBaseClasses = "inline-block py-1.5 px-4 bg-white rounded-full text-black text-sm font-bold transition-all duration-200 ease-in-out";
  const linkTextHoverClasses = "group-hover:bg-[#f0e0f0]";
  const linkTextHighlightClasses = "bg-[#f0e0f0] border-2 border-[#d070d0] !text-black";
  const mainContentClasses = "flex-1 p-8 max-w-screen-xl mx-auto w-full";
  const pageHeaderClasses = "mb-8";
  const pageTitleClasses = "text-3xl font-bold text-gray-800";
  const pageDescriptionClasses = "text-gray-600 mt-2";
  const searchBarContainerClasses = "flex items-center mb-6";
  const searchInputClasses = "flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#d070d0] focus:border-transparent";
  const searchButtonClasses = "bg-[#d070d0] text-white px-4 py-2 rounded-r-md hover:bg-[#b050b0] transition-colors duration-200";
  const addButtonClasses = "ml-4 bg-[#d070d0] text-white px-4 py-2 rounded-md hover:bg-[#b050b0] transition-colors duration-200 flex items-center";
  const tableContainerClasses = "overflow-x-auto bg-white rounded-lg shadow";
  const tableClasses = "min-w-full divide-y divide-gray-200";
  const tableHeadClasses = "bg-gray-50";
  const tableHeaderCellClasses = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
  const tableBodyClasses = "bg-white divide-y divide-gray-200";
  const tableRowClasses = "hover:bg-gray-50";
  const tableCellClasses = "px-6 py-4 whitespace-nowrap text-sm text-gray-500";
  const tableCellNameClasses = "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900";
  const actionButtonBaseClasses = "inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition ease-in-out duration-150";
  const actionButtonViewClasses = `${actionButtonBaseClasses} bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500`;
  const actionButtonEditClasses = `${actionButtonBaseClasses} bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500`;
  const actionButtonDeleteClasses = `${actionButtonBaseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
  const noDataCellClasses = "px-6 py-4 text-center text-gray-500 italic";
  const modalOverlayClasses = "fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm";
  const modalContentClasses = "bg-white rounded-lg w-11/12 max-w-sm shadow-xl overflow-hidden";
  const modalHeaderClasses = "bg-[#d070d0] text-white px-4 py-2";
  const modalTitleClasses = "text-lg font-bold";
  const modalBodyClasses = "p-4";
  const modalButtonsClasses = "flex justify-end space-x-2 p-4 bg-gray-50";
  const modalCancelButtonClasses = "px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors";
  const modalConfirmButtonClasses = "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors";
  const formClasses = "bg-white p-6 rounded-lg shadow-md";
  const formTitleClasses = "text-xl font-bold mb-4 text-gray-800";
  const formRowClasses = "flex flex-col md:flex-row md:space-x-4 w-full";
  const formGroupClasses = "mb-4 flex-1";
  const formLabelClasses = "block text-gray-700 text-sm font-bold mb-2";
  const formInputBaseClasses = "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-[#d070d0]";
  const formButtonsClasses = "flex justify-end space-x-2 mt-6";
  const formCancelButtonClasses = "px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors";
  const formSubmitButtonClasses = "px-4 py-2 bg-[#d070d0] text-white rounded hover:bg-[#b050b0] transition-colors";
  const notificationClasses = "fixed top-4 right-4 p-4 rounded-md shadow-md z-50 transition-all duration-500 ease-in-out";
  const notificationSuccessClasses = `${notificationClasses} bg-green-500 text-white`;
  const notificationErrorClasses = `${notificationClasses} bg-red-500 text-white`;
  const activeBadgeClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800";
  const inactiveBadgeClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800";

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Notification */}
      {notification.type && (
        <div className={notification.type === 'success' ? notificationSuccessClasses : notificationErrorClasses}>
          {notification.message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={modalOverlayClasses}>
          <div className={modalContentClasses}>
            <div className={modalHeaderClasses}>
              <h3 className={modalTitleClasses}>Confirm Deletion</h3>
            </div>
            <div className={modalBodyClasses}>
              <p>Are you sure you want to delete this supporter? This action cannot be undone.</p>
            </div>
            <div className={modalButtonsClasses}>
              <button 
                className={modalCancelButtonClasses}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className={modalConfirmButtonClasses}
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={mainContentClasses}>
        {/* Page Header */}
        <div className={pageHeaderClasses}>
          <h1 className={pageTitleClasses}>Supporters Management</h1>
          <p className={pageDescriptionClasses}>Manage supporters for contractors in the nutrition program</p>
        </div>

        {/* Search and Add */}
        <div className={searchBarContainerClasses}>
          <input 
            type="text" 
            placeholder="Search supporters..." 
            className={searchInputClasses}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className={searchButtonClasses}>
            Search
          </button>
          <button 
            className={addButtonClasses}
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
              setEditMode(false);
            }}
          >
            {showForm ? 'Cancel' : '+ Add Supporter'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8">
            <form onSubmit={handleSubmit} className={formClasses}>
              <h2 className={formTitleClasses}>{editMode ? 'Edit Supporter' : 'Add New Supporter'}</h2>
              
              <div className={formRowClasses}>
                <div className={formGroupClasses}>
                  <label htmlFor="supporter_name" className={formLabelClasses}>Full Name*</label>
                  <input type="text" id="supporter_name" name="supporter_name" value={formData.supporter_name} onChange={handleInputChange} required className={formInputBaseClasses} />
                </div>
                <div className={formGroupClasses}>
                  <label htmlFor="supporter_contact_number" className={formLabelClasses}>Contact Number*</label>
                  <input type="text" id="supporter_contact_number" name="supporter_contact_number" value={formData.supporter_contact_number} onChange={handleInputChange} required className={formInputBaseClasses} />
                </div>
              </div>

              <div className={formRowClasses}>
                <div className={formGroupClasses}>
                  <label htmlFor="supporter_nic_number" className={formLabelClasses}>NIC Number*</label>
                  <input type="text" id="supporter_nic_number" name="supporter_nic_number" value={formData.supporter_nic_number} onChange={handleInputChange} required pattern="[0-9]{9}[vVxX]|[0-9]{12}" title="Enter a valid NIC number (e.g., 123456789V or 199012345678)" className={formInputBaseClasses} disabled={editMode} />
                  {editMode && <p className="text-xs text-gray-500 mt-1">NIC Number cannot be changed in edit mode.</p>}
                </div>
                <div className={formGroupClasses}>
                  <label htmlFor="contractor_nic_number" className={formLabelClasses}>Contractor NIC Number*</label>
                  <input type="text" id="contractor_nic_number" name="contractor_nic_number" value={formData.contractor_nic_number} onChange={handleInputChange} required className={formInputBaseClasses} />
                </div>
              </div>

              <div className={formRowClasses}>
                <div className={formGroupClasses}>
                  <label htmlFor="supporter_address" className={formLabelClasses}>Address</label>
                  <input type="text" id="supporter_address" name="supporter_address" value={formData.supporter_address} onChange={handleInputChange} className={formInputBaseClasses} />
                </div>
                <div className={formGroupClasses}>
                  <label htmlFor="is_active" className={formLabelClasses}>Status</label>
                  <select id="is_active" name="is_active" value={formData.is_active} onChange={handleInputChange} className={formInputBaseClasses} >
                    <option value="yes">Active</option>
                    <option value="no">Inactive</option>
                  </select>
                </div>
              </div>

              <div className={formButtonsClasses}>
                <button 
                  type="button" 
                  className={formCancelButtonClasses}
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className={formSubmitButtonClasses}>
                  {editMode ? 'Update Supporter' : 'Add Supporter'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Supporters Table */}
        <div className={tableContainerClasses}>
          <table className={tableClasses}>
            <thead className={tableHeadClasses}>
              <tr>
                <th className={tableHeaderCellClasses}>Name</th>
                <th className={tableHeaderCellClasses}>NIC Number</th>
                <th className={tableHeaderCellClasses}>Contact</th>
                <th className={tableHeaderCellClasses}>Address</th>
                <th className={tableHeaderCellClasses}>Contractor</th>
                <th className={tableHeaderCellClasses}>Status</th>
                <th className={tableHeaderCellClasses}>Actions</th>
              </tr>
            </thead>
            <tbody className={tableBodyClasses}>
              {filteredSupporters.length > 0 ? (
                filteredSupporters.map((supporter) => (
                  <tr key={supporter.supporter_nic_number} className={tableRowClasses}>
                    <td className={tableCellNameClasses}>{supporter.supporter_name}</td>
                    <td className={tableCellClasses}>{supporter.supporter_nic_number}</td>
                    <td className={tableCellClasses}>{supporter.supporter_contact_number}</td>
                    <td className={tableCellClasses}>{supporter.supporter_address || '-'}</td>
                    <td className={tableCellClasses}>{supporter.contractor_name || '-'}</td>
                    <td className={tableCellClasses}>
                      <span className={supporter.is_active === 'yes' ? activeBadgeClasses : inactiveBadgeClasses}>
                        {supporter.is_active === 'yes' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className={tableCellClasses}>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(supporter)}
                          className="text-yellow-500 hover:text-yellow-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(supporter.supporter_nic_number)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={noDataCellClasses}>
                    {searchQuery ? 'No supporters found matching your search.' : 'No supporters found. Add a new supporter to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
