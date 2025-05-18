'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Firebase imports are done dynamically in the upload function to avoid SSR issues

// Gazette interface based on the database schema
interface Gazette {
  id: string; // Using string for flexibility, even though DB uses int
  gazette_name: string; // Changed from title to match DB schema
  publish_date: string;
  url: string; // Changed from file_path to match DB schema
  uploader_name?: string;
  is_active?: 'yes' | 'no'; // New field from DB schema
  created_at?: string; // Timestamp from DB
  updated_at?: string; // Timestamp from DB
}

// Removed GazetteImage interface as image functionality is removed


export default function GazettePage() {
  const [gazettes, setGazettes] = useState<Gazette[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Removed image-specific authentication state

  const [uploadForm, setUploadForm] = useState({ // State for PDF upload modal
    gazette_name: '',
    publishDate: '',
    is_active: 'yes' as 'yes' | 'no',
    pdfFile: null as File | null
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  // Using default values for testing without authentication
  const [userId] = useState<number | null>(1);
  const [username] = useState<string>('Test User');

  // State for search filters
  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');

  const pathname = usePathname();


  // Fetch gazettes on component mount (and when needed)
  useEffect(() => {
    fetchGazettes();
  }, []);

  // Removed useEffect for fetching images


  // Fetch gazettes from API
  const fetchGazettes = async () => {
    setLoading(true);
    setError(null);
    setGazettes([]); // Clear previous results

    try {
      // Fetch gazettes from our server
      const response = await fetch('http://localhost:3001/api/test-gazette-table'); // Using test endpoint

      if (!response.ok) {
        // Attempt to parse error response body
        const errorBody = await response.text();
         let errorMessage = `Server returned ${response.status}`;
         try {
             const errorJson = JSON.parse(errorBody);
             errorMessage = errorJson.message || errorMessage;
         } catch (e) {
             // Ignore parsing error
         }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        console.log('Received gazette data:', data);

        // Map the gazette data to match our expected format based on new DB schema
        const gazettesData = data.data.map((gazette: any) => {
          // Use the URL directly from the database
          const url = gazette.url || gazette.fileUrl ||
            (gazette.file_path ? `http://localhost:3001/${gazette.file_path.replace(/\\/g, '/')}` : ''); // Ensure forward slashes

          return {
            id: String(gazette.id), // Ensure ID is string
            gazette_name: gazette.gazette_name || gazette.userProvidedName || gazette.name || gazette.title || 'Untitled Gazette',
            publish_date: gazette.publish_date || gazette.publishDate || '', // Ensure string
            url: url, // Use the URL from DB
            uploader_name: gazette.uploader_name,
            is_active: gazette.is_active || 'yes',
            created_at: gazette.created_at || gazette.uploadDate || gazette.upload_date || '', // Ensure string
            updated_at: gazette.updated_at || ''
          };
        });

        setGazettes(gazettesData);

         if (gazettesData.length === 0) {
             setError('No gazettes found. Please check the server.');
         }

      } else {
        throw new Error(data.message || 'Failed to fetch gazettes (success: false)');
      }
    } catch (err: any) {
      console.error('Error fetching gazettes:', err);
      // Removed mock data fallback
      setError(`Failed to load gazettes: ${err.message}.`);
      setGazettes([]); // Ensure list is empty on error if not already
    } finally {
      setLoading(false);
    }
  };

  // Search gazettes (currently client-side filtering of fetched data or uses test endpoint)
  const searchGazettes = async () => {
     // For now, we will re-fetch all and filter client-side as the test endpoint doesn't support search params
     setLoading(true);
     setError(null);

     try {
         const response = await fetch('http://localhost:3001/api/test-gazette-table');

         if (!response.ok) {
             const errorBody = await response.text();
             let errorMessage = `Server returned ${response.status}`;
             try {
                 const errorJson = JSON.parse(errorBody);
                 errorMessage = errorJson.message || errorMessage;
             } catch (e) { }
             throw new Error(errorMessage);
         }

         const data = await response.json();

         if (data.success) {
             const rawGazettes = data.data.map((gazette: any) => ({
                 id: String(gazette.id),
                 gazette_name: gazette.gazette_name || gazette.userProvidedName || gazette.name || gazette.title || 'Untitled Gazette',
                 publish_date: gazette.publish_date || gazette.publishDate || '',
                 url: gazette.url || gazette.fileUrl || (gazette.file_path ? `http://localhost:3001/${gazette.file_path.replace(/\\/g, '/')}` : ''),
                 uploader_name: gazette.uploader_name,
                 is_active: gazette.is_active || 'yes',
                 created_at: gazette.created_at || gazette.uploadDate || gazette.upload_date || '',
                 updated_at: gazette.updated_at || ''
             }));

             // Client-side filtering based on searchName and searchDate
             const filtered = rawGazettes.filter((gazette: Gazette) => {
                 const nameMatch = !searchName ||
                     (gazette.gazette_name && gazette.gazette_name.toLowerCase().includes(searchName.toLowerCase())) ||
                     (gazette.id && String(gazette.id).includes(searchName));

                 const dateMatch = !searchDate ||
                     (gazette.publish_date && gazette.publish_date.startsWith(searchDate)); // Use startsWith for date match

                 // Only include active gazettes unless specifically searching for inactive ones
                 const activeMatch = gazette.is_active !== 'no' || searchName.toLowerCase().includes('inactive');

                 return nameMatch && dateMatch && activeMatch;
             });

             setGazettes(filtered);

             if (filtered.length === 0) {
                  setError('No gazettes found matching your criteria.');
             } else {
                 setError(null); // Clear error if search found results after a previous error
             }

         } else {
             throw new Error(data.message || 'Failed to fetch gazettes for search');
         }

     } catch (err: any) {
         console.error('Error searching gazettes:', err);
         setError(`Failed to search gazettes: ${err.message}. Please try refreshing.`);
         setGazettes([]); // Clear current results on search error
     } finally {
         setLoading(false);
     }
  };


  // Authentication is skipped for this test implementation

  // Removed handleVerifyImageCredentials


  // Handle PDF file selection (for upload modal)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       const file = e.target.files[0];
       if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setNotification({ type: 'error', message: 'File size exceeds 10MB limit.' });
            setUploadForm({...uploadForm, pdfFile: null});
             // Clear the file input element manually
            const fileInput = document.getElementById('gazettePdf') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
       } else {
            setUploadForm({
              ...uploadForm,
              pdfFile: file
            });
             setNotification({ type: null, message: '' }); // Clear notification on valid file selection
       }

    } else {
       setUploadForm({...uploadForm, pdfFile: null});
        // Clear any size error notification if file is deselected
       if (notification.type === 'error' && notification.message.includes('size')) {
           setNotification({ type: null, message: '' });
       }
    }
  };

  // State for upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Handle upload form submission (for PDF modal) using Firebase Storage
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.pdfFile) {
      setNotification({ type: 'error', message: 'Please select a PDF file to upload' });
      return;
    }

    if (!uploadForm.gazette_name) {
      setNotification({ type: 'error', message: 'Please enter a name for the gazette' });
      return;
    }

    // We're skipping authentication for this test implementation
    // Use a default username if not authenticated
    const uploaderName = username || 'Test User';

    setNotification({ type: null, message: '' }); // Clear previous notifications
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Import Firebase modules dynamically to avoid SSR issues
      const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/config/firebase');

      // Generate a unique path for the file in Firebase Storage
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileName = uploadForm.pdfFile.name.replace(/[^a-zA-Z0-9.]/g, '_'); // Replace non-alphanumeric chars
      const filePath = `gazettes/${timestamp}_${randomString}_${fileName}`;

      console.log('[GAZETTE] Uploading file to Firebase:', filePath);

      // Create metadata for the file
      const metadata = {
        contentType: uploadForm.pdfFile.type,
        customMetadata: {
          gazette_name: uploadForm.gazette_name,
          publish_date: uploadForm.publishDate || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          is_active: uploadForm.is_active,
          userId: userId?.toString() || '0',
          username: username || 'Test User'
        }
      };

      // Create a storage reference
      const storageRef = ref(storage, filePath);

      // Upload the file and metadata
      const uploadTask = uploadBytesResumable(storageRef, uploadForm.pdfFile, metadata);

      // Set up progress monitoring
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Get upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('[GAZETTE] Upload progress:', progress.toFixed(2), '%');
          setUploadProgress(progress);
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error('[GAZETTE] Upload error:', error);
          let errorMessage = 'Upload failed: ';

          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage += 'User doesn\'t have permission to access the storage';
              break;
            case 'storage/canceled':
              errorMessage += 'Upload was canceled';
              break;
            case 'storage/unknown':
              errorMessage += 'Unknown error occurred';
              break;
            default:
              errorMessage += error.message;
          }

          setNotification({ type: 'error', message: errorMessage });
          setIsUploading(false);
        },
        async () => {
          // Handle successful uploads
          console.log('[GAZETTE] Upload completed successfully');

          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('[GAZETTE] Download URL:', downloadURL);

            // Now save the metadata to the server database
            const formData = new FormData();
            formData.append('gazette_name', uploadForm.gazette_name);
            formData.append('publish_date', uploadForm.publishDate || new Date().toISOString().split('T')[0]);
            formData.append('url', downloadURL);
            formData.append('uploader_name', uploaderName);
            formData.append('is_active', uploadForm.is_active);

            // Save metadata to server (optional - can be implemented later)
            try {
              const response = await fetch('http://localhost:3001/api/gazettes', {
                method: 'POST',
                body: formData,
              });

              if (response.ok) {
                console.log('[GAZETTE] Metadata saved to server');
              } else {
                console.warn('[GAZETTE] Failed to save metadata to server, but file was uploaded to Firebase');
              }
            } catch (serverErr) {
              console.warn('[GAZETTE] Error saving metadata to server, but file was uploaded to Firebase:', serverErr);
            }

            setNotification({ type: 'success', message: 'Gazette PDF uploaded successfully to Firebase!' });
            setShowUploadModal(false);
            setUploadForm({ // Clear form
              gazette_name: '',
              publishDate: '',
              is_active: 'yes',
              pdfFile: null
            });

            // Reset the file input element
            const fileInput = document.getElementById('gazettePdf') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }

            // Refresh the gazette list
            fetchGazettes();

          } catch (err: any) {
            console.error('[GAZETTE] Error getting download URL:', err);
            setNotification({ type: 'error', message: `Failed to get download URL: ${err.message}` });
          } finally {
            setIsUploading(false);
          }
        }
      );
    } catch (err: any) {
      console.error('[GAZETTE] Error starting upload:', err);
      setNotification({ type: 'error', message: `Error starting upload: ${err.message}` });
      setIsUploading(false);
    }
  };


  // Removed handler for gazette image file selection
  // Removed handler for gazette image upload

  // The list displayed is directly the gazettes state after fetching/searching
  const displayedGazettes = gazettes;


  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not available';

    try {
      // Handle potential timestamps vs date strings
      let date;
      if (dateString.includes('T')) {
         // Looks like an ISO string
         date = new Date(dateString);
      } else {
         // Assume YYYY-MM-DD
         const parts = dateString.split('-');
         // Note: Date constructor with YYYY-MM-DD is UTC. Use parts for local time interpretation if needed.
         // Using parts[1]-1 because month is 0-indexed.
         date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
      }


      if (isNaN(date.getTime())) {
        return dateString; // Return the original string if it's not a valid date
      }

      // Use UTC methods or specify timezone if necessary, depending on source data
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC' // Or your desired timezone, assuming server stores UTC or dates without time are UTC
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return the original string in case of error
    }
  };

  // Handle delete gazette
  const handleDeleteGazette = (id: string) => {
    // Set the gazette ID to delete and show credentials modal first
    setGazetteToDelete(id);
    setShowDeleteCredentialsModal(true);
  };

  // State for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gazetteToDelete, setGazetteToDelete] = useState<string | null>(null);

  // State for DEO credentials for deletion
  const [showDeleteCredentialsModal, setShowDeleteCredentialsModal] = useState(false);
  const [deleteCredentials, setDeleteCredentials] = useState({ username: '', password: '' });

  // Handle verify credentials for deletion
  const handleVerifyDeleteCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification({ type: null, message: '' });

    try {
      // Use the verify-credentials endpoint
       const response = await fetch('http://localhost:3001/api/gazettes/verify-credentials', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(deleteCredentials),
       });

       const data = await response.json();

       if (response.ok && data.success) {
          // Credentials verified, now proceed to confirm deletion
          setShowDeleteCredentialsModal(false);
          setShowDeleteModal(true); // Show the confirmation modal
          setNotification({ type: 'success', message: 'Credentials verified. Confirm deletion.' });
           // Keep credentials state until deletion attempt

       } else {
           setNotification({ type: 'error', message: data.message || 'Invalid credentials for deletion.' });
       }
    } catch (err: any) {
      console.error('Error verifying credentials for deletion:', err);
      setNotification({ type: 'error', message: `Failed to verify credentials: ${err.message}` });
    }
  };

  // Confirm delete gazette
  const confirmDeleteGazette = async () => {
    if (!gazetteToDelete || !deleteCredentials.username || !deleteCredentials.password) {
        setNotification({ type: 'error', message: 'Missing gazette ID or credentials for deletion.' });
        setShowDeleteModal(false);
        setGazetteToDelete(null);
        setDeleteCredentials({ username: '', password: '' });
        return;
    }

    setNotification({ type: null, message: '' }); // Clear notification

    try {
      console.log(`Deleting gazette with ID: ${gazetteToDelete}`);

      // Pass credentials in the body for the DELETE request
      const response = await fetch(`http://localhost:3001/api/gazettes/${gazetteToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: deleteCredentials.username,
            password: deleteCredentials.password
        })
      });

      const responseText = await response.text();
      console.log('Delete raw response:', responseText);

      let data;
      try {
         data = JSON.parse(responseText);
      } catch(parseError) {
         console.error('Failed to parse Delete response as JSON:', parseError);
         throw new Error(`Failed to parse server response: ${responseText}`);
      }


      if (response.ok && data.success) {
        console.log('Gazette deleted successfully:', data);

        // Filter out the deleted gazette from the current list state (optimistic update)
        const updatedGazettes = gazettes.filter(gazette => gazette.id !== gazetteToDelete);
        setGazettes(updatedGazettes);

        setNotification({ type: 'success', message: data.message || 'Gazette deleted successfully' });

        // Re-fetch after deletion to ensure state is synced (optional but safer)
        // fetchGazettes(); // Removed refetch to rely solely on optimistic update + error handling

      } else {
        console.error('Failed to delete gazette:', data.message);
         // If optimistic update was done, revert it by refetching
        fetchGazettes(); // Revert state by fetching fresh data
        setNotification({ type: 'error', message: data.message || 'Failed to delete gazette' });
      }
    } catch (err: any) {
      console.error('Error deleting gazette:', err);
       // If optimistic update was done, revert it by refetching
      fetchGazettes(); // Revert state by fetching fresh data
      setNotification({ type: 'error', message: `Failed to delete gazette: ${err.message}` });
    } finally {
      // Close the modal and clear state regardless of success/failure
      setShowDeleteModal(false);
      setGazetteToDelete(null);
      setDeleteCredentials({ username: '', password: '' }); // Clear credentials after attempt
    }
  };


  // Removed image list, search, loading, error states and handlers


  // --- Tailwind Class Mapping (Adjusted) ---
  // Notification styles
  const notificationBaseClasses = "flex items-center p-4 mb-6 rounded-lg border relative";
  const notificationSuccessClasses = "bg-green-50 text-green-800 border-green-200";
  const notificationErrorClasses = "bg-red-50 text-red-800 border-red-200";
  const notificationIconClasses = "mr-3 flex-shrink-0";
  const closeNotificationClasses = "absolute right-2 top-2 text-gray-500 hover:text-gray-700 text-xl font-bold cursor-pointer";

  // Container and general layout
  const containerClasses = "w-full min-h-screen flex flex-col bg-slate-100 font-sans leading-relaxed text-gray-800";

  // Navigation Bar
  const navbarClasses = "flex justify-between items-center py-4 px-8 bg-teal-800 text-white shadow-xl sticky top-0 z-50";
  const brandClasses = "text-2xl font-bold tracking-wide";
  const navLinksClasses = "flex space-x-6";
  const navLinkBaseClasses = "py-2 px-4 rounded transition-all duration-300 font-medium"; // Added font-medium from CSS
  const navLinkHoverClasses = "hover:bg-white/15 hover:-translate-y-px"; // Combined hover effects
  const navLinkHighlightClasses = "bg-white/20 font-bold shadow-sm"; // Combined highlight effects


  // Main Content
  const mainContentClasses = "flex-1 p-8 max-w-[1200px] mx-auto w-full";
  const gazetteHeaderClasses = "text-center mb-12 relative"; // Adjusted margin to simulate ::after space
  const gazetteHeaderH1Classes = "text-teal-800 mb-2 text-4xl font-bold"; // Adjusted size and weight
  const gazetteHeaderPClasses = "text-gray-600 text-lg"; // Adjusted size/color

  // Controls Section (Search & Upload)
  const controlsSectionClasses = "flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-md flex-wrap gap-4";
  const searchFormClasses = "flex flex-wrap gap-4 flex-grow"; // Allow search form to grow
  const searchFormGroupClasses = "flex-1 min-w-[200px]"; // Allow form groups to flex with min-width
  const searchContainerClasses = "relative flex items-center w-full border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm";
  const searchInputClasses = "flex-1 py-3 px-4 pl-12 border-none outline-none text-sm"; // Adjusted padding-left for icon
  const searchIconWrapperClasses = "absolute left-0 top-0 bottom-0 flex items-center pl-4 text-gray-500"; // Wrapper for the icon
  const searchActionsClasses = "flex gap-3"; // Adjusted gap
  const searchButtonClasses = "py-3 px-6 bg-teal-800 text-white rounded-md font-semibold cursor-pointer transition-colors duration-300 hover:bg-teal-900 flex items-center gap-2"; // Added flex/gap for icon
  const clearButtonClasses = "py-3 px-4 bg-gray-200 text-gray-800 rounded-md cursor-pointer font-medium transition-colors duration-300 hover:bg-gray-300";
  const uploadButtonClasses = "bg-teal-800 text-white border-none py-3 px-7 rounded-lg font-semibold cursor-pointer transition-all duration-300 flex items-center gap-2 shadow-md hover:bg-teal-900"; // Adjusted padding/gap/shadow

  // Loading and Error
  const loadingContainerClasses = "flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-md mt-8";
  const loadingSpinnerClasses = "w-12 h-12 border-4 border-gray-200 border-t-teal-800 rounded-full animate-spin mb-4"; // Adjusted size/color
  const errorContainerClasses = "text-left p-6 bg-red-100 border-l-4 border-red-500 rounded-lg text-red-800 mt-8";
  const retryButtonClasses = "mt-4 py-2 px-4 bg-red-600 text-white rounded-md cursor-pointer hover:bg-red-700 inline-flex items-center gap-2"; // Added flex/gap/inline-flex
  const noResultsClasses = "text-center p-12 bg-white rounded-lg shadow-md mt-8 text-gray-600";


  // Gazettes Grid (Main List)
  const gazettesGridClasses = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8"; // Adjusted breakpoints/gap/margin
  const gazetteCardClasses = "bg-white rounded-xl shadow-lg hover:shadow-xl overflow-hidden flex flex-col transition-all duration-400 hover:-translate-y-2 relative border border-gray-100 group"; // Added group
  const gazetteIconClasses = "bg-gray-100 p-8 flex justify-center items-center h-36 relative overflow-hidden"; // Adjusted padding/height, removed ::after simulation
  const pdfIconFallbackClasses = "text-5xl flex justify-center items-center w-full h-full"; // Adjusted size
  const gazetteInfoClasses = "p-7 flex-1"; // Adjusted padding
  const gazetteInfoH3Classes = "mt-0 mb-3 text-teal-800 text-xl font-semibold leading-tight"; // Adjusted size/weight/leading
  const gazetteNumberClasses = "inline-block font-semibold mb-3 text-gray-700 bg-gray-100 py-1.5 px-3 rounded-full text-sm"; // Adjusted colors/padding/rounded
  const gazetteDateClasses = "text-gray-600 text-sm mb-4 flex items-center gap-2"; // Adjusted size/gap, added flex for icon
  const gazetteUploaderClasses = "text-gray-600 text-sm mt-2 italic"; // Adjusted color/size

  // Gazette Actions (Main List)
  const gazetteActionsClasses = "flex flex-wrap gap-2 p-5 bg-gray-50 border-t border-gray-200"; // Adjusted padding/gap
  const downloadButtonClasses = "py-2.5 px-5 rounded-md text-sm font-semibold text-center transition-all duration-300 bg-teal-800 text-white flex-1 justify-center hover:bg-teal-900 shadow-sm flex items-center gap-1"; // Adjusted padding/size/shadow/flex/gap
  const viewButtonClasses = "py-2.5 px-5 rounded-md text-sm font-semibold text-center transition-all duration-300 bg-gray-200 text-teal-800 flex-1 justify-center border border-gray-300 hover:bg-gray-300 flex items-center gap-1"; // Adjusted padding/size/border/flex/gap
  const deleteButtonClasses = "py-2.5 px-5 bg-red-100 text-red-700 border border-red-300 rounded-md cursor-pointer text-sm font-medium transition-colors duration-300 hover:bg-red-200"; // Adjusted padding/colors/border

  // Modal Styles
  const modalOverlayClasses = "fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm animate-fadeIn"; // Added backdrop-blur and animation
  const modalContentClasses = "bg-white rounded-xl w-11/12 max-w-[550px] max-h-[90vh] overflow-y-auto shadow-xl animate-modalSlideIn border border-gray-100"; // Adjusted width/max-width/max-height, added animation/border
  const modalHeaderClasses = "flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50"; // Adjusted padding/colors/border
  const modalHeaderH2Classes = "m-0 text-teal-800 text-xl font-bold"; // Adjusted size/weight
  const closeModalClasses = "bg-none border-none text-2xl cursor-pointer text-gray-600 transition-colors duration-300 w-10 h-10 flex items-center justify-center rounded-full hover:text-red-600 hover:bg-gray-100"; // Adjusted size/colors/hover

  const modalBodyClasses = "p-8"; // Adjusted padding
  const modalFormActionsClasses = "flex justify-between gap-4 mt-8"; // Adjusted gap and justify

  // Delete Confirmation Button
  const deleteConfirmButtonClasses = "py-3 px-6 bg-red-600 text-white border-none rounded-md cursor-pointer font-semibold transition-colors duration-300 hover:bg-red-700";

   // Reused form styles
   const formGroupClasses = "mb-7";
   const formLabelClasses = "block mb-3 font-semibold text-gray-700 text-sm";
   const formInputBaseClasses = "w-full py-3 px-4 border border-gray-300 rounded-lg text-base transition-all duration-300 shadow-sm focus:border-teal-800 focus:ring focus:ring-teal-800/10 outline-none";
   const fileHintClasses = "mt-3 text-xs text-gray-600 flex items-center gap-1";
   const submitButtonClasses = "bg-teal-800 text-white border-none py-3 px-7 rounded-lg font-semibold cursor-pointer transition-all duration-300 flex-1 hover:bg-teal-900 shadow-md";
   const cancelButtonClasses = "bg-gray-100 text-gray-700 border border-gray-300 py-3 px-7 rounded-lg font-semibold cursor-pointer transition-all duration-300 flex-1 hover:bg-gray-200";


    // File Input Specific (reused for PDF)
  const fileInputContainerClasses = "relative flex flex-col w-full";
  const fileInputClasses = "py-3 px-4 bg-gray-50 border border-dashed border-gray-400 rounded-lg cursor-pointer transition-all duration-300 hover:bg-gray-100 hover:border-teal-800"; // Added hover
  const fileInputSelectedClasses = "text-transparent pb-10"; // Adjusted padding
  const selectedFileInfoClasses = "absolute bottom-0 left-0 right-0 bg-blue-100 py-2 px-3 rounded-b-lg flex justify-between items-center border-t border-blue-300"; // Adjusted colors/padding
  const fileNameClasses = "text-sm text-blue-700 truncate max-w-[80%]"; // Adjusted color/size
  const clearFileClasses = "bg-red-500 text-white border-none rounded-full w-5 h-5 flex items-center justify-center cursor-pointer text-sm leading-none hover:bg-red-600";


  return (
    <div className={containerClasses}>
      {/* Navigation Bar */}
      <nav className={navbarClasses}>
        <div className={brandClasses}>Government Nutrition Program</div>
        <div className={navLinksClasses}>
          <Link href="/" className={`${navLinkBaseClasses} ${navLinkHoverClasses} ${pathname === "/" ? navLinkHighlightClasses : ""}`}>
            Home
          </Link>
          <Link href="/about" className={`${navLinkBaseClasses} ${navLinkHoverClasses} ${pathname === "/about" ? navLinkHighlightClasses : ""}`}>
            About Program
          </Link>
          <Link href="/login" className={`${navLinkBaseClasses} ${navLinkHoverClasses} ${pathname === "/login" ? navLinkHighlightClasses : ""}`}>
            Login
          </Link>
          <Link href="/gazette" className={`${navLinkBaseClasses} ${navLinkHoverClasses} ${pathname === "/gazette" ? navLinkHighlightClasses : ""}`}>
            Gazette
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className={mainContentClasses}>
        <div className={gazetteHeaderClasses}>
          <h1 className={gazetteHeaderH1Classes}>Government Gazettes</h1>
          <p className={gazetteHeaderPClasses}>Access official government gazette publications</p>
        </div>

        {/* Search & Upload PDF Controls */}
        {/* Reusing fileUploadSectionClasses for the main content block container */}
        <div className={controlsSectionClasses}>
          <div className={searchFormClasses}>
             {/* Search Inputs */}
            <div className={searchFormGroupClasses}>
              <label htmlFor="searchName" className={formLabelClasses}>Gazette Name/Number:</label>
              <div className={searchContainerClasses}>
                <div className={searchIconWrapperClasses}>
                   🔍
                </div>
                <input
                  type="text"
                  id="searchName"
                  placeholder="Search by name or number..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className={searchInputClasses}
                  onKeyDown={(e) => { // Add search on Enter key press
                     if (e.key === 'Enter') {
                         e.preventDefault();
                         searchGazettes();
                     }
                  }}
                />
              </div>
            </div>
            <div className={searchFormGroupClasses}>
              <label htmlFor="searchDate" className={formLabelClasses}>Publish Date:</label>
              <input
                type="date"
                id="searchDate"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className={formInputBaseClasses} // Reuse base input styles
              />
            </div>
             {/* Search Actions */}
            <div className={searchActionsClasses}>
              <button
                className={searchButtonClasses}
                onClick={(e) => {
                  e.preventDefault();
                  searchGazettes();
                }}
                disabled={loading}
              >
                {loading ? 'Searching...' : '🔍 Search'}
              </button>
              <button
                className={clearButtonClasses}
                onClick={() => {
                  setSearchName('');
                  setSearchDate('');
                  fetchGazettes(); // Reset to showing all
                }}
                 disabled={loading}
              >
                Clear
              </button>
            </div>
          </div>
           {/* Upload Button */}
          <div className="flex-shrink-0"> {/* Prevent upload button from shrinking */}
            <button
              className={uploadButtonClasses}
              onClick={() => {
                // Skip login modal if user is already authenticated
                // Clear form before opening
                setUploadForm({
                  gazette_name: '',
                  publishDate: '',
                  is_active: 'yes',
                  pdfFile: null
                });
                setShowUploadModal(true);
                setNotification({type: null, message: ''}); // Clear notification when opening modal
              }}
            >
              Upload New Gazette (PDF)
            </button>
          </div>
        </div>

        {/* Notification Message */}
        {notification.type && (
          <div className={`${notificationBaseClasses} ${notification.type === 'success' ? notificationSuccessClasses : notificationErrorClasses}`}>
            <span className={notificationIconClasses}>
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="flex-grow">{notification.message}</span> {/* Allow message to take space */}
            <button
              className={closeNotificationClasses}
              onClick={() => setNotification({type: null, message: ''})}
            >
              ×
            </button>
          </div>
        )}

        {/* Gazettes List */}
        {loading ? ( // Only show loading for the main list area
          <div className={loadingContainerClasses}>
            <div className={loadingSpinnerClasses}></div>
            <p className="text-gray-700">Loading gazettes...</p>
          </div>
        ) : error && displayedGazettes.length === 0 ? ( // Show error only if list is empty due to error
          <div className={errorContainerClasses}>
             <h3 className="text-lg font-semibold mb-2">⚠️ Error Loading Gazettes</h3>
            <p className="text-red-800">{error}</p>
            <button onClick={fetchGazettes} className={retryButtonClasses}>🔄 Retry</button>
          </div>
        ) : displayedGazettes.length === 0 ? ( // Show no results message
          <div className={noResultsClasses}>
            <p className="text-gray-600 text-lg">📄 No gazettes found. {(searchName || searchDate) ? 'Try different search criteria or check the server connection.' : ''}</p>
          </div>
        ) : ( // Display list when data is loaded and not empty
             <div className={gazettesGridClasses}>
               {displayedGazettes.map((gazette, index) => (
                 <div key={gazette.id || `gazette-${index}`} className={gazetteCardClasses}>
                   <div className={gazetteIconClasses}>
                       {/* Use a fallback div with emoji as we only handle PDFs */}
                       <div className={pdfIconFallbackClasses}>📄</div>
                   </div>
                   <div className={gazetteInfoClasses}>
                     <span className={gazetteNumberClasses}>ID: {gazette.id}</span>
                     <h3 className={gazetteInfoH3Classes}>{gazette.gazette_name}</h3>
                     <p className={gazetteDateClasses}>
                       {gazette.publish_date ? `📅 Published: ${formatDate(gazette.publish_date)}` : ''}
                       {gazette.publish_date && gazette.created_at ? ' | ' : ''}
                       {gazette.created_at ? `⬆️ Added: ${formatDate(gazette.created_at)}` : ''}
                     </p>
                     {gazette.is_active === 'no' && (
                       <p className="text-red-600 text-sm font-semibold mt-1 mb-2">Status: Inactive</p>
                     )}
                     {gazette.uploader_name && (
                       <p className={gazetteUploaderClasses}>Uploaded by: {gazette.uploader_name}</p>
                     )}
                   </div>
                   <div className={gazetteActionsClasses}>
                     {gazette.url && (
                       <>
                         <a
                           href={gazette.url}
                           className={downloadButtonClasses}
                           target="_blank"
                           rel="noopener noreferrer"
                           download={gazette.gazette_name.replace(/ /g, '_') + '.pdf'} // Suggest filename for download
                         >
                           ⬇️ Download
                         </a>
                         <a
                           href={gazette.url}
                           className={viewButtonClasses}
                           target="_blank"
                           rel="noopener noreferrer"
                         >
                           👁️ View
                         </a>
                       </>
                     )}
                     <button
                       className={deleteButtonClasses}
                       onClick={(e) => {
                         e.preventDefault();
                         handleDeleteGazette(gazette.id);
                       }}
                     >
                       Delete
                     </button>
                   </div>
                 </div>
               ))}
             </div>
        )}
      </div>

      {/* Login modal removed as we're skipping authentication for this test implementation */}


      {/* Upload Modal (for PDF Upload after verification) */}
      {showUploadModal && (
        <div className={modalOverlayClasses}>
          <div className={modalContentClasses}>
            <div className={modalHeaderClasses}>
              <h2 className={modalHeaderH2Classes}>Upload New Gazette (PDF)</h2>
              <button
                className={closeModalClasses}
                disabled={isUploading}
                onClick={() => {
                  if (!isUploading) {
                    setShowUploadModal(false);
                    setUploadForm({ // Clear form state on close
                      gazette_name: '',
                      publishDate: '',
                      is_active: 'yes',
                      pdfFile: null
                    });
                    setNotification({type: null, message: ''}); // Clear notification when closing modal
                  }
                }}
                style={{ opacity: isUploading ? 0.5 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}
              >
                ×
              </button>
            </div>
            <div className={modalBodyClasses}>
              <form onSubmit={handleUploadSubmit}>
                <div className={formGroupClasses}>
                  <label htmlFor="gazette_name" className={formLabelClasses}>Gazette Name*</label>
                  <input
                    type="text"
                    id="gazette_name"
                    value={uploadForm.gazette_name}
                    onChange={(e) => setUploadForm({...uploadForm, gazette_name: e.target.value})}
                    required
                    className={formInputBaseClasses}
                  />
                </div>
                <div className={formGroupClasses}> {/* Removed form-row/half-width as it only had one item */}
                    <label htmlFor="publishDate" className={formLabelClasses}>Publish Date</label>
                    <input
                      type="date"
                      id="publishDate"
                      value={uploadForm.publishDate}
                      onChange={(e) => setUploadForm({...uploadForm, publishDate: e.target.value})}
                      className={formInputBaseClasses}
                    />
                </div>

                <div className={formGroupClasses}>
                  <label className={formLabelClasses}>Status</label>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        uploadForm.is_active === 'yes' ? 'bg-teal-600' : 'bg-gray-300'
                      }`}
                      onClick={() => setUploadForm({
                        ...uploadForm,
                        is_active: uploadForm.is_active === 'yes' ? 'no' : 'yes'
                      })}
                      style={{ cursor: 'pointer' }}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          uploadForm.is_active === 'yes' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {uploadForm.is_active === 'yes' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {uploadForm.is_active === 'yes'
                      ? 'This gazette will be visible to all users'
                      : 'This gazette will be hidden from regular users'}
                  </p>
                </div>

                <div className={formGroupClasses}>
                  <label htmlFor="gazettePdf" className={formLabelClasses}>PDF File*</label>
                   <div className={fileInputContainerClasses}>
                      <input
                        type="file"
                        id="gazettePdf"
                        accept=".pdf"
                        onChange={handleFileChange}
                        required
                        className={`${fileInputClasses} ${uploadForm.pdfFile ? fileInputSelectedClasses : ""}`}
                      />
                       {uploadForm.pdfFile && (
                         <div className={selectedFileInfoClasses}>
                           <span className={fileNameClasses}>{uploadForm.pdfFile.name}</span>
                           <button
                             type="button"
                             className={clearFileClasses}
                             onClick={() => {
                               setUploadForm({...uploadForm, pdfFile: null});
                               // Reset the file input element manually
                               const fileInput = document.getElementById('gazettePdf') as HTMLInputElement;
                               if (fileInput) {
                                 fileInput.value = '';
                               }
                                // Clear any size error notification if file is cleared
                               if (notification.type === 'error' && notification.message.includes('size')) {
                                    setNotification({ type: null, message: '' });
                                }
                             }}
                           >
                             ×
                           </button>
                         </div>
                       )}
                   </div>
                  <p className={fileHintClasses}>ℹ️ Only PDF files are allowed (max 10MB)</p>
                </div>
                {/* Progress Bar */}
                {isUploading && (
                  <div className="mt-4 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Progress: {uploadProgress.toFixed(0)}%
                    </label>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className={modalFormActionsClasses}>
                  <button
                    type="submit"
                    className={submitButtonClasses}
                    disabled={!uploadForm.gazette_name || !uploadForm.pdfFile || isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Gazette'}
                  </button>
                  <button
                    type="button"
                    className={cancelButtonClasses}
                    disabled={isUploading}
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadForm({ // Clear form state on cancel
                        gazette_name: '',
                        publishDate: '',
                        is_active: 'yes',
                        pdfFile: null
                      });
                      setNotification({type: null, message: ''}); // Clear notification when closing modal
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Credentials Modal */}
      {showDeleteCredentialsModal && (
        <div className={modalOverlayClasses}>
          <div className={modalContentClasses}>
            <div className={modalHeaderClasses}>
              <h2 className={modalHeaderH2Classes}>Authentication Required (Deletion)</h2>
              <button
                className={closeModalClasses}
                onClick={() => {
                  setShowDeleteCredentialsModal(false);
                  setGazetteToDelete(null); // Clear ID if login cancelled
                  setDeleteCredentials({ username: '', password: '' });
                   setNotification({type: null, message: ''}); // Clear notification when closing modal
                }}
              >
                ×
              </button>
            </div>
            <div className={modalBodyClasses}>
              <p className="mb-6 text-gray-700">Only Data Entry Officers can delete gazettes. Please enter your credentials:</p>
              <form onSubmit={handleVerifyDeleteCredentials}>
                <div className={formGroupClasses}>
                  <label htmlFor="deleteUsername" className={formLabelClasses}>Username</label>
                  <input
                    type="text"
                    id="deleteUsername"
                    value={deleteCredentials.username}
                    onChange={(e) => setDeleteCredentials({...deleteCredentials, username: e.target.value})}
                    required
                    className={formInputBaseClasses}
                    autoComplete="username"
                  />
                  <p className={fileHintClasses}>ℹ️ Enter your Data Entry Officer username (e.g., dataeo1, dataeo2, etc.)</p>
                </div>
                <div className={formGroupClasses}>
                  <label htmlFor="deletePassword" className={formLabelClasses}>Password</label>
                  <input
                    type="password"
                    id="deletePassword"
                    value={deleteCredentials.password}
                    onChange={(e) => setDeleteCredentials({...deleteCredentials, password: e.target.value})}
                    required
                    className={formInputBaseClasses}
                    autoComplete="current-password"
                  />
                  <p className={fileHintClasses}>ℹ️ Password format: [username]123 (e.g., dataeo1123, dataeo2123, etc.)</p>
                </div>
                <div className={modalFormActionsClasses}>
                  <button type="submit" className={submitButtonClasses} disabled={!deleteCredentials.username || !deleteCredentials.password}>Verify</button>
                  <button
                    type="button"
                    className={cancelButtonClasses}
                    onClick={() => {
                      setShowDeleteCredentialsModal(false);
                      setGazetteToDelete(null); // Clear ID if cancelled
                      setDeleteCredentials({ username: '', password: '' });
                       setNotification({type: null, message: ''}); // Clear notification when closing modal
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (shown AFTER credentials verification) */}
      {showDeleteModal && (
        <div className={modalOverlayClasses}>
          <div className={modalContentClasses}>
            <div className={modalHeaderClasses}>
              <h2 className={modalHeaderH2Classes}>Confirm Deletion</h2>
              <button
                className={closeModalClasses}
                onClick={() => {
                  setShowDeleteModal(false);
                  setGazetteToDelete(null); // Clear ID if cancelled
                   // Keep credentials state for now, cleared in confirmDeleteGazette finally block
                  // setDeleteCredentials({ username: '', password: '' });
                   setNotification({type: null, message: ''}); // Clear notification when closing modal
                }}
              >
                ×
              </button>
            </div>
            <div className={modalBodyClasses}>
              <p className="mb-6 text-gray-700">Are you sure you want to delete this gazette? This action cannot be undone.</p>
              <div className={modalFormActionsClasses}>
                <button
                  type="button"
                  className={deleteConfirmButtonClasses}
                  onClick={confirmDeleteGazette}
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  className={cancelButtonClasses}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setGazetteToDelete(null); // Clear ID if cancelled
                    // Keep credentials state for now
                    // setDeleteCredentials({ username: '', password: '' });
                     setNotification({type: null, message: ''}); // Clear notification when closing modal
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}