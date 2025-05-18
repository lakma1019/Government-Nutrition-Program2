'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Gazette {
  id: string;
  gazette_name: string;
  publish_date: string;
  url: string;
  uploader_name?: string;
  is_active?: 'yes' | 'no';
  created_at?: string;
  updated_at?: string;
}



export default function GazettePage() {
  const [gazettes, setGazettes] = useState<Gazette[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);


  const [uploadForm, setUploadForm] = useState({
    gazette_name: '',
    publishDate: '',
    is_active: 'yes' as 'yes' | 'no',
    pdfFile: null as File | null
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | null;
    message: string;
  }>({ type: null, message: '' });
  const [userId] = useState<number | null>(1);
  const [username] = useState<string>('Test User');

  const [searchName, setSearchName] = useState('');
  const [searchDate, setSearchDate] = useState('');

  const pathname = usePathname();


  useEffect(() => {
    fetchGazettes();
  }, []);



  const fetchGazettes = async () => {
    setLoading(true);
    setError(null);
    setGazettes([]);

    try {
      const response = await fetch('http://localhost:3001/api/gazettes');

      if (!response.ok) {
        const errorBody = await response.text();
         let errorMessage = `Server returned ${response.status}`;
         try {
             const errorJson = JSON.parse(errorBody);
             errorMessage = errorJson.message || errorMessage;
         } catch (e) {
         }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        console.log('Received gazette data:', data);

        const gazettesData = data.data.map((gazette: any) => {
          const url = extractUrlFromGazette(gazette);

          return {
            id: String(gazette.id),
            gazette_name: gazette.gazette_name || gazette.userProvidedName || gazette.name || gazette.title || 'Untitled Gazette',
            publish_date: gazette.publish_date || gazette.publishDate || '',
            url: url,
            uploader_name: gazette.uploader_name,
            is_active: gazette.is_active || 'yes',
            created_at: gazette.created_at || gazette.uploadDate || gazette.upload_date || '',
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
      setError(`Failed to load gazettes: ${err.message}.`);
      setGazettes([]);
    } finally {
      setLoading(false);
    }
  };

  const searchGazettes = async () => {
     setLoading(true);
     setError(null);

     try {
         const response = await fetch('http://localhost:3001/api/gazettes');

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
                 url: extractUrlFromGazette(gazette),
                 uploader_name: gazette.uploader_name,
                 is_active: gazette.is_active || 'yes',
                 created_at: gazette.created_at || gazette.uploadDate || gazette.upload_date || '',
                 updated_at: gazette.updated_at || ''
             }));

             const filtered = rawGazettes.filter((gazette: Gazette) => {
                 const nameMatch = !searchName ||
                     (gazette.gazette_name && gazette.gazette_name.toLowerCase().includes(searchName.toLowerCase())) ||
                     (gazette.id && String(gazette.id).includes(searchName));

                 const dateMatch = !searchDate ||
                     (gazette.publish_date && gazette.publish_date.startsWith(searchDate));

                 const activeMatch = gazette.is_active !== 'no' || searchName.toLowerCase().includes('inactive');

                 return nameMatch && dateMatch && activeMatch;
             });

             setGazettes(filtered);

             if (filtered.length === 0) {
                  setError('No gazettes found matching your criteria.');
             } else {
                 setError(null);
             }

         } else {
             throw new Error(data.message || 'Failed to fetch gazettes for search');
         }

     } catch (err: any) {
         console.error('Error searching gazettes:', err);
         setError(`Failed to search gazettes: ${err.message}. Please try refreshing.`);
         setGazettes([]);
     } finally {
         setLoading(false);
     }
  };





  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       const file = e.target.files[0];
       if (file.size > 10 * 1024 * 1024) {
            setNotification({ type: 'error', message: 'File size exceeds 10MB limit.' });
            setUploadForm({...uploadForm, pdfFile: null});
            const fileInput = document.getElementById('gazettePdf') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
       } else {
            setUploadForm({
              ...uploadForm,
              pdfFile: file
            });
             setNotification({ type: null, message: '' });
       }

    } else {
       setUploadForm({...uploadForm, pdfFile: null});
       if (notification.type === 'error' && notification.message.includes('size')) {
           setNotification({ type: null, message: '' });
       }
    }
  };

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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

    const uploaderName = username || 'Test User';

    setNotification({ type: null, message: '' });
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/config/firebase');

      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileName = uploadForm.pdfFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filePath = `gazettes/${timestamp}_${randomString}_${fileName}`;

      console.log('[GAZETTE] Uploading file to Firebase:', filePath);

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

      const storageRef = ref(storage, filePath);

      const uploadTask = uploadBytesResumable(storageRef, uploadForm.pdfFile, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('[GAZETTE] Upload progress:', progress.toFixed(2), '%');
          setUploadProgress(progress);
        },
        (error) => {
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
          console.log('[GAZETTE] Upload completed successfully');

          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('[GAZETTE] Download URL:', downloadURL);


            try {
              console.log('[GAZETTE] Saving metadata to database with fields:', {
                gazette_name: uploadForm.gazette_name,
                publish_date: uploadForm.publishDate || new Date().toISOString().split('T')[0],
                url: downloadURL,
                uploader_name: uploaderName,
                is_active: uploadForm.is_active
              });

              const response = await fetch('http://localhost:3001/api/gazettes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  gazette_name: uploadForm.gazette_name,
                  publish_date: uploadForm.publishDate || new Date().toISOString().split('T')[0],
                  url_data: {
                    downloadURL: downloadURL,
                    fileName: uploadForm.pdfFile?.name,
                    filePath: filePath,
                    contentType: uploadForm.pdfFile?.type,
                    size: uploadForm.pdfFile?.size,
                    uploadTime: new Date().toISOString()
                  },
                  uploader_name: uploaderName,
                  is_active: uploadForm.is_active
                }),
              });

              const responseData = await response.json().catch(() => null);

              if (response.ok) {
                console.log('[GAZETTE] Metadata saved to database successfully:', responseData);
                setNotification({
                  type: 'success',
                  message: 'Gazette PDF uploaded to Firebase and metadata saved to database!'
                });
              } else {
                console.warn('[GAZETTE] Failed to save metadata to database:', responseData);
                setNotification({
                  type: 'warning',
                  message: 'Gazette PDF uploaded to Firebase but failed to save metadata to database. Please contact administrator.'
                });
              }
            } catch (serverErr) {
              console.error('[GAZETTE] Error saving metadata to database:', serverErr);
              setNotification({
                type: 'warning',
                message: 'Gazette PDF uploaded to Firebase but failed to save metadata to database due to an error.'
              });
            }

            setShowUploadModal(false);
            setUploadForm({
              gazette_name: '',
              publishDate: '',
              is_active: 'yes',
              pdfFile: null
            });

            const fileInput = document.getElementById('gazettePdf') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }

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



  const displayedGazettes = gazettes;


  const extractUrlFromGazette = (gazette: any): string => {
    let url = '';

    if (gazette.url_data) {
      try {
        const urlData = typeof gazette.url_data === 'string'
          ? JSON.parse(gazette.url_data)
          : gazette.url_data;

        url = urlData.downloadURL || urlData.url || '';
      } catch (e) {
        console.error('[GAZETTE] Error parsing URL data:', e);
      }
    }

    if (!url) {
      url = gazette.url || gazette.fileUrl ||
        (gazette.file_path ? `http://localhost:3001/${gazette.file_path.replace(/\\/g, '/')}` : '');
    }

    return url;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date not available';

    try {
      let date;
      if (dateString.includes('T')) {
         date = new Date(dateString);
      } else {
         const parts = dateString.split('-');
         date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
      }


      if (isNaN(date.getTime())) {
        return dateString;
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const handleDeleteGazette = (id: string) => {
    setGazetteToDelete(id);
    setShowDeleteCredentialsModal(true);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gazetteToDelete, setGazetteToDelete] = useState<string | null>(null);

  const [showDeleteCredentialsModal, setShowDeleteCredentialsModal] = useState(false);
  const [deleteCredentials, setDeleteCredentials] = useState({ username: '', password: '' });

  const handleVerifyDeleteCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification({ type: null, message: '' });

    try {
       const response = await fetch('http://localhost:3001/api/gazettes/verify-credentials', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(deleteCredentials),
       });

       const data = await response.json();

       if (response.ok && data.success) {
          setShowDeleteCredentialsModal(false);
          setShowDeleteModal(true);
          setNotification({ type: 'success', message: 'Credentials verified. Confirm deletion.' });

       } else {
           setNotification({ type: 'error', message: data.message || 'Invalid credentials for deletion.' });
       }
    } catch (err: any) {
      console.error('Error verifying credentials for deletion:', err);
      setNotification({ type: 'error', message: `Failed to verify credentials: ${err.message}` });
    }
  };

  const confirmDeleteGazette = async () => {
    if (!gazetteToDelete || !deleteCredentials.username || !deleteCredentials.password) {
        setNotification({ type: 'error', message: 'Missing gazette ID or credentials for deletion.' });
        setShowDeleteModal(false);
        setGazetteToDelete(null);
        setDeleteCredentials({ username: '', password: '' });
        return;
    }

    setNotification({ type: null, message: '' });

    try {
      console.log(`Deleting gazette with ID: ${gazetteToDelete}`);

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

        const updatedGazettes = gazettes.filter(gazette => gazette.id !== gazetteToDelete);
        setGazettes(updatedGazettes);

        setNotification({ type: 'success', message: data.message || 'Gazette deleted successfully' });


      } else {
        console.error('Failed to delete gazette:', data.message);
        fetchGazettes();
        setNotification({ type: 'error', message: data.message || 'Failed to delete gazette' });
      }
    } catch (err: any) {
      console.error('Error deleting gazette:', err);
      fetchGazettes();
      setNotification({ type: 'error', message: `Failed to delete gazette: ${err.message}` });
    } finally {
      setShowDeleteModal(false);
      setGazetteToDelete(null);
      setDeleteCredentials({ username: '', password: '' });
    }
  };




  const notificationBaseClasses = "flex items-center p-4 mb-6 rounded-lg border relative";
  const notificationSuccessClasses = "bg-green-50 text-green-800 border-green-200";
  const notificationErrorClasses = "bg-red-50 text-red-800 border-red-200";
  const notificationWarningClasses = "bg-yellow-50 text-yellow-800 border-yellow-200";
  const notificationIconClasses = "mr-3 flex-shrink-0";
  const closeNotificationClasses = "absolute right-2 top-2 text-gray-500 hover:text-gray-700 text-xl font-bold cursor-pointer";

  const containerClasses = "w-full min-h-screen flex flex-col bg-slate-100 font-sans leading-relaxed text-gray-800";

  const navbarClasses = "flex justify-between items-center py-4 px-8 bg-teal-800 text-white shadow-xl sticky top-0 z-50";
  const brandClasses = "text-2xl font-bold tracking-wide";
  const navLinksClasses = "flex space-x-6";
  const navLinkBaseClasses = "py-2 px-4 rounded transition-all duration-300 font-medium";
  const navLinkHoverClasses = "hover:bg-white/15 hover:-translate-y-px";
  const navLinkHighlightClasses = "bg-white/20 font-bold shadow-sm";


  const mainContentClasses = "flex-1 p-8 max-w-[1200px] mx-auto w-full";
  const gazetteHeaderClasses = "text-center mb-12 relative";
  const gazetteHeaderH1Classes = "text-teal-800 mb-2 text-4xl font-bold";
  const gazetteHeaderPClasses = "text-gray-600 text-lg";

  const controlsSectionClasses = "flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-md flex-wrap gap-4";
  const searchFormClasses = "flex flex-wrap gap-4 flex-grow";
  const searchFormGroupClasses = "flex-1 min-w-[200px]";
  const searchContainerClasses = "relative flex items-center w-full border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm";
  const searchInputClasses = "flex-1 py-3 px-4 pl-12 border-none outline-none text-sm";
  const searchIconWrapperClasses = "absolute left-0 top-0 bottom-0 flex items-center pl-4 text-gray-500";
  const searchActionsClasses = "flex gap-3";
  const searchButtonClasses = "py-3 px-6 bg-teal-800 text-white rounded-md font-semibold cursor-pointer transition-colors duration-300 hover:bg-teal-900 flex items-center gap-2";
  const clearButtonClasses = "py-3 px-4 bg-gray-200 text-gray-800 rounded-md cursor-pointer font-medium transition-colors duration-300 hover:bg-gray-300";
  const uploadButtonClasses = "bg-teal-800 text-white border-none py-3 px-7 rounded-lg font-semibold cursor-pointer transition-all duration-300 flex items-center gap-2 shadow-md hover:bg-teal-900";

  const loadingContainerClasses = "flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-md mt-8";
  const loadingSpinnerClasses = "w-12 h-12 border-4 border-gray-200 border-t-teal-800 rounded-full animate-spin mb-4";
  const errorContainerClasses = "text-left p-6 bg-red-100 border-l-4 border-red-500 rounded-lg text-red-800 mt-8";
  const retryButtonClasses = "mt-4 py-2 px-4 bg-red-600 text-white rounded-md cursor-pointer hover:bg-red-700 inline-flex items-center gap-2";
  const noResultsClasses = "text-center p-12 bg-white rounded-lg shadow-md mt-8 text-gray-600";


  const gazettesGridClasses = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8";
  const gazetteCardClasses = "bg-white rounded-xl shadow-lg hover:shadow-xl overflow-hidden flex flex-col transition-all duration-400 hover:-translate-y-2 relative border border-gray-100 group";
  const gazetteIconClasses = "bg-gray-100 p-8 flex justify-center items-center h-36 relative overflow-hidden";
  const pdfIconFallbackClasses = "text-5xl flex justify-center items-center w-full h-full";
  const gazetteInfoClasses = "p-7 flex-1";
  const gazetteInfoH3Classes = "mt-0 mb-3 text-teal-800 text-xl font-semibold leading-tight";
  const gazetteNumberClasses = "inline-block font-semibold mb-3 text-gray-700 bg-gray-100 py-1.5 px-3 rounded-full text-sm";
  const gazetteDateClasses = "text-gray-600 text-sm mb-4 flex items-center gap-2";
  const gazetteUploaderClasses = "text-gray-600 text-sm mt-2 italic";

  const gazetteActionsClasses = "flex flex-wrap gap-2 p-5 bg-gray-50 border-t border-gray-200";
  const downloadButtonClasses = "py-2.5 px-5 rounded-md text-sm font-semibold text-center transition-all duration-300 bg-teal-800 text-white flex-1 justify-center hover:bg-teal-900 shadow-sm flex items-center gap-1";
  const viewButtonClasses = "py-2.5 px-5 rounded-md text-sm font-semibold text-center transition-all duration-300 bg-gray-200 text-teal-800 flex-1 justify-center border border-gray-300 hover:bg-gray-300 flex items-center gap-1";
  const deleteButtonClasses = "py-2.5 px-5 bg-red-100 text-red-700 border border-red-300 rounded-md cursor-pointer text-sm font-medium transition-colors duration-300 hover:bg-red-200";

  const modalOverlayClasses = "fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm animate-fadeIn";
  const modalContentClasses = "bg-white rounded-xl w-11/12 max-w-[550px] max-h-[90vh] overflow-y-auto shadow-xl animate-modalSlideIn border border-gray-100";
  const modalHeaderClasses = "flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50";
  const modalHeaderH2Classes = "m-0 text-teal-800 text-xl font-bold";
  const closeModalClasses = "bg-none border-none text-2xl cursor-pointer text-gray-600 transition-colors duration-300 w-10 h-10 flex items-center justify-center rounded-full hover:text-red-600 hover:bg-gray-100";

  const modalBodyClasses = "p-8";
  const modalFormActionsClasses = "flex justify-between gap-4 mt-8";

  const deleteConfirmButtonClasses = "py-3 px-6 bg-red-600 text-white border-none rounded-md cursor-pointer font-semibold transition-colors duration-300 hover:bg-red-700";

   const formGroupClasses = "mb-7";
   const formLabelClasses = "block mb-3 font-semibold text-gray-700 text-sm";
   const formInputBaseClasses = "w-full py-3 px-4 border border-gray-300 rounded-lg text-base transition-all duration-300 shadow-sm focus:border-teal-800 focus:ring focus:ring-teal-800/10 outline-none";
   const fileHintClasses = "mt-3 text-xs text-gray-600 flex items-center gap-1";
   const submitButtonClasses = "bg-teal-800 text-white border-none py-3 px-7 rounded-lg font-semibold cursor-pointer transition-all duration-300 flex-1 hover:bg-teal-900 shadow-md";
   const cancelButtonClasses = "bg-gray-100 text-gray-700 border border-gray-300 py-3 px-7 rounded-lg font-semibold cursor-pointer transition-all duration-300 flex-1 hover:bg-gray-200";


  const fileInputContainerClasses = "relative flex flex-col w-full";
  const fileInputClasses = "py-3 px-4 bg-gray-50 border border-dashed border-gray-400 rounded-lg cursor-pointer transition-all duration-300 hover:bg-gray-100 hover:border-teal-800";
  const fileInputSelectedClasses = "text-transparent pb-10";
  const selectedFileInfoClasses = "absolute bottom-0 left-0 right-0 bg-blue-100 py-2 px-3 rounded-b-lg flex justify-between items-center border-t border-blue-300";
  const fileNameClasses = "text-sm text-blue-700 truncate max-w-[80%]";
  const clearFileClasses = "bg-red-500 text-white border-none rounded-full w-5 h-5 flex items-center justify-center cursor-pointer text-sm leading-none hover:bg-red-600";


  return (
    <div className={containerClasses}>
      <nav className={navbarClasses}>
        <div className={brandClasses}>Government Nutrition Program</div>
        <div className={navLinksClasses}>
          <Link href="/" className={`${navLinkBaseClasses} ${navLinkHoverClasses} ${pathname === "/" ? navLinkHighlightClasses : ""}`}>
            Home
          </Link>
          <Link href="/about" className={`${navLinkBaseClasses} ${navLinkHoverClasses} ${pathname === "/about" ? navLinkHighlightClasses : ""}`}>
            About Program
          </Link>
          <Link href="/" className={`${navLinkBaseClasses} ${navLinkHoverClasses} ${pathname === "/" ? navLinkHighlightClasses : ""}`}>
            Logout
          </Link>
          <Link href="/gazette" className={`${navLinkBaseClasses} ${navLinkHoverClasses} ${pathname === "/gazette" ? navLinkHighlightClasses : ""}`}>
            Gazette
          </Link>
        </div>
      </nav>

      <div className={mainContentClasses}>
        <div className={gazetteHeaderClasses}>
          <h1 className={gazetteHeaderH1Classes}>Government Gazettes</h1>
          <p className={gazetteHeaderPClasses}>Access official government gazette publications</p>
        </div>

        <div className={controlsSectionClasses}>
          <div className={searchFormClasses}>
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
                  onKeyDown={(e) => {
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
                className={formInputBaseClasses}
              />
            </div>
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
                  fetchGazettes();
                }}
                 disabled={loading}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              className={uploadButtonClasses}
              onClick={() => {
                setUploadForm({
                  gazette_name: '',
                  publishDate: '',
                  is_active: 'yes',
                  pdfFile: null
                });
                setShowUploadModal(true);
                setNotification({type: null, message: ''});
              }}
            >
              Upload New Gazette (PDF)
            </button>
          </div>
        </div>

        {notification.type && (
          <div className={`${notificationBaseClasses} ${
            notification.type === 'success'
              ? notificationSuccessClasses
              : notification.type === 'warning'
                ? notificationWarningClasses
                : notificationErrorClasses
          }`}>
            <span className={notificationIconClasses}>
              {notification.type === 'success'
                ? '✅'
                : notification.type === 'warning'
                  ? '⚠️'
                  : '❌'}
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

        {loading ? (
          <div className={loadingContainerClasses}>
            <div className={loadingSpinnerClasses}></div>
            <p className="text-gray-700">Loading gazettes...</p>
          </div>
        ) : error && displayedGazettes.length === 0 ? (
          <div className={errorContainerClasses}>
             <h3 className="text-lg font-semibold mb-2">⚠️ Error Loading Gazettes</h3>
            <p className="text-red-800">{error}</p>
            <button onClick={fetchGazettes} className={retryButtonClasses}>🔄 Retry</button>
          </div>
        ) : displayedGazettes.length === 0 ? (
          <div className={noResultsClasses}>
            <p className="text-gray-600 text-lg">📄 No gazettes found. {(searchName || searchDate) ? 'Try different search criteria or check the server connection.' : ''}</p>
          </div>
        ) : (
             <div className={gazettesGridClasses}>
               {displayedGazettes.map((gazette, index) => (
                 <div key={gazette.id || `gazette-${index}`} className={gazetteCardClasses}>
                   <div className={gazetteIconClasses}>
                       <div className={pdfIconFallbackClasses}>📄</div>
                   </div>
                   <div className={gazetteInfoClasses}>
                     <span className={gazetteNumberClasses}>ID: {gazette.id}</span>
                     <h3 className={gazetteInfoH3Classes}>{gazette.gazette_name}</h3>
                     <p className={gazetteDateClasses}>
                       {gazette.publish_date ? `Published: ${formatDate(gazette.publish_date)}` : ''}
                       {gazette.publish_date && gazette.created_at ? ' | ' : ''}
                       {gazette.created_at ? `Added: ${formatDate(gazette.created_at)}` : ''}
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
                       <a
                           href={gazette.url}
                           className={viewButtonClasses}
                           target="_blank"
                           rel="noopener noreferrer"
                         >
                            View
                         </a>
                     )}
                   </div>
                 </div>
               ))}
             </div>
        )}
      </div>



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
                    setUploadForm({
                      gazette_name: '',
                      publishDate: '',
                      is_active: 'yes',
                      pdfFile: null
                    });
                    setNotification({type: null, message: ''});
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
                <div className={formGroupClasses}>
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
                               const fileInput = document.getElementById('gazettePdf') as HTMLInputElement;
                               if (fileInput) {
                                 fileInput.value = '';
                               }
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
                  <p className={fileHintClasses}> Only PDF files are allowed (max 10MB)</p>
                </div>
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
                      setUploadForm({
                        gazette_name: '',
                        publishDate: '',
                        is_active: 'yes',
                        pdfFile: null
                      });
                      setNotification({type: null, message: ''});
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

      {showDeleteCredentialsModal && (
        <div className={modalOverlayClasses}>
          <div className={modalContentClasses}>
            <div className={modalHeaderClasses}>
              <h2 className={modalHeaderH2Classes}>Authentication Required (Deletion)</h2>
              <button
                className={closeModalClasses}
                onClick={() => {
                  setShowDeleteCredentialsModal(false);
                  setGazetteToDelete(null);
                  setDeleteCredentials({ username: '', password: '' });
                   setNotification({type: null, message: ''});
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
                  <p className={fileHintClasses}>Enter your Data Entry Officer username (e.g., dataeo1, dataeo2, etc.)</p>
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
                  <p className={fileHintClasses}>Password format: [username]123 (e.g., dataeo1123, dataeo2123, etc.)</p>
                </div>
                <div className={modalFormActionsClasses}>
                  <button type="submit" className={submitButtonClasses} disabled={!deleteCredentials.username || !deleteCredentials.password}>Verify</button>
                  <button
                    type="button"
                    className={cancelButtonClasses}
                    onClick={() => {
                      setShowDeleteCredentialsModal(false);
                      setGazetteToDelete(null);
                      setDeleteCredentials({ username: '', password: '' });
                       setNotification({type: null, message: ''});
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

      {showDeleteModal && (
        <div className={modalOverlayClasses}>
          <div className={modalContentClasses}>
            <div className={modalHeaderClasses}>
              <h2 className={modalHeaderH2Classes}>Confirm Deletion</h2>
              <button
                className={closeModalClasses}
                onClick={() => {
                  setShowDeleteModal(false);
                  setGazetteToDelete(null);
                   setNotification({type: null, message: ''});
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
                    setGazetteToDelete(null);
                     setNotification({type: null, message: ''});
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