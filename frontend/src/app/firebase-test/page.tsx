'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function FirebaseTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if Firebase is initialized on component mount
  useEffect(() => {
    // Verify that Firebase Storage is properly initialized
    if (!storage) {
      console.error('[FIREBASE_TEST] Firebase Storage is not initialized');
      setError('Firebase Storage is not initialized. Please check your Firebase configuration.');
    } else {
      console.log('[FIREBASE_TEST] Firebase Storage is initialized with details:', {
        exists: !!storage,
        hasApp: !!storage.app,
        bucket: storage?.app?.options?.storageBucket || 'unknown',
        appName: storage?.app?.name || 'unknown'
      });

      // Test connectivity to Firebase Storage
      try {
        const testRef = ref(storage, 'test-connectivity');
        console.log('[FIREBASE_TEST] Successfully created test reference:', testRef.fullPath);
      } catch (err: any) {
        console.error('[FIREBASE_TEST] Error creating test reference:', err);
        setError(`Error connecting to Firebase Storage: ${err.message || 'Unknown error'}`);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      setDownloadURL(null);

      // Verify that Firebase Storage is properly initialized
      if (!storage) {
        throw new Error('Firebase Storage is not initialized. Please check your Firebase configuration.');
      }

      console.log('[FIREBASE_TEST] Firebase Storage instance:', {
        exists: !!storage,
        hasApp: !!storage.app,
        bucket: storage?.app?.options?.storageBucket || 'unknown'
      });

      // Create a unique file path
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');

      // Use the test folder to match Firebase security rules
      const filePath = `test/${timestamp}_${randomString}_${fileName}`;

      console.log('[FIREBASE_TEST] Uploading file to:', filePath);
      console.log('[FIREBASE_TEST] File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Add metadata
      const metadata = {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
        customMetadata: {
          upload_name: 'Test Upload',
          upload_date: new Date().toISOString().split('T')[0],
          uploader: 'Test User'
        }
      };

      // Create a storage reference
      const storageRef = ref(storage, filePath);

      // Create the upload task
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      // Listen for state changes, errors, and completion of the upload
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Get upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('[FIREBASE_TEST] Upload progress:', progress.toFixed(2), '%');
          setUploadProgress(progress);
        },
        (error) => {
          // Handle unsuccessful uploads with detailed logging
          console.error('[FIREBASE_TEST] Upload error:', error);
          console.error('[FIREBASE_TEST] Upload error details:', {
            code: error.code,
            message: error.message,
            serverResponse: error.serverResponse || 'No server response',
            fullError: JSON.stringify(error)
          });

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
            case 'storage/quota-exceeded':
              errorMessage += 'Storage quota exceeded';
              break;
            case 'storage/invalid-argument':
              errorMessage += 'Invalid argument provided';
              break;
            case 'storage/retry-limit-exceeded':
              errorMessage += 'Upload retry limit exceeded';
              break;
            default:
              errorMessage += error.message || 'Unknown error';
          }

          setError(errorMessage);
          setUploading(false);
        },
        async () => {
          // Handle successful uploads
          console.log('[FIREBASE_TEST] Upload completed successfully');

          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('[FIREBASE_TEST] Download URL:', url);
            setDownloadURL(url);
          } catch (err: any) {
            console.error('[FIREBASE_TEST] Error getting download URL:', err);
            setError(`Failed to get download URL: ${err.message}`);
          } finally {
            setUploading(false);
          }
        }
      );
    } catch (err: any) {
      console.error('[FIREBASE_TEST] Error starting upload:', err);
      setError(`Error starting upload: ${err.message}`);
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setDownloadURL(null);
    setUploadProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Firebase Storage Test</h1>

          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              This page allows you to test uploading files to Firebase Storage. Select a file and click the upload button to test the functionality.
            </p>
          </div>

          <div className="space-y-6">
            {/* File Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select a file to upload
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border border-gray-300 rounded-md"
                disabled={uploading}
              />
              {file && (
                <div className="mt-2 text-sm text-gray-500">
                  <FileText className="inline-block w-4 h-4 mr-1" />
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  !file || uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload to Firebase
                  </>
                )}
              </button>

              {file && !uploading && (
                <button
                  onClick={resetForm}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Progress: {uploadProgress.toFixed(0)}%
                </label>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {downloadURL && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-green-700 font-medium">File uploaded successfully!</p>
                    <p className="text-sm text-green-600 mt-1">
                      Your file has been uploaded to Firebase Storage and is available at:
                    </p>
                    <a
                      href={downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-sm text-blue-600 hover:underline break-all"
                    >
                      {downloadURL}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
