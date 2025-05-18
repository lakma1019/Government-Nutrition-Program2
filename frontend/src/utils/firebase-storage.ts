
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';

// Type assertion for storage
const typedStorage = storage;

/**
 * Upload a file to Firebase Storage
 * @param file The file to upload
 * @param path The path in Firebase Storage to upload to
 * @param metadata Optional metadata for the file
 * @param progressCallback Optional callback for upload progress
 * @returns Promise that resolves with the download URL
 */
const uploadFileToFirebase = async (
  file: File,
  path: string,
  metadata?: Record<string, any>,
  progressCallback?: (progress: number) => void
): Promise<string> => {
  try {
    console.log('[FIREBASE] Starting upload process for file:', file.name);
    console.log('[FIREBASE] File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('[FIREBASE] Storage path:', path);
    console.log('[FIREBASE] Metadata:', JSON.stringify(metadata, null, 2));

    // Create a storage reference
    const storageRef = ref(typedStorage, path);

    // Prepare file metadata
    const fileMetadata = {
      contentType: file.type,
      customMetadata: metadata?.customMetadata || {},
    };

    console.log('[FIREBASE] File metadata prepared:', JSON.stringify(fileMetadata, null, 2));

    // Upload the file and metadata
    console.log('[FIREBASE] Creating upload task with file size:', file.size, 'bytes');
    
    // Create the upload task
    const uploadTask = uploadBytesResumable(storageRef, file, fileMetadata);
    console.log('[FIREBASE] Upload task created');

    // Return a promise that resolves with the download URL when complete
    return new Promise((resolve, reject) => {
      // Set a timeout to check if upload is stuck
      const uploadStartTime = Date.now();
      const uploadTimeoutCheck = setTimeout(() => {
        console.warn('[FIREBASE] Upload seems to be taking a long time. It might be stuck.');
      }, 30000); // 30 seconds

      // Listen for state changes, errors, and completion of the upload
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Get upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('[FIREBASE] Upload progress:', progress.toFixed(2), '%');
          
          // Call progress callback if provided
          if (progressCallback) {
            progressCallback(progress);
          }
        },
        (error) => {
          // Handle unsuccessful uploads
          console.error('[FIREBASE] Upload error:', error);
          console.error('[FIREBASE_TEST] Upload error details:', {
            code: error.code,
            message: error.message,
            serverResponse: error.serverResponse
          });
          clearTimeout(uploadTimeoutCheck);
          reject(error);
        },
        async () => {
          // Handle successful uploads
          clearTimeout(uploadTimeoutCheck);
          console.log('[FIREBASE] Upload completed in', ((Date.now() - uploadStartTime) / 1000).toFixed(2), 'seconds');
          
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('[FIREBASE] Download URL:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error('[FIREBASE] Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('[FIREBASE] Error in uploadFileToFirebase:', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param path The path to the file in Firebase Storage
 * @returns Promise that resolves when the file is deleted
 */
const deleteFileFromFirebase = async (path: string): Promise<void> => {
  try {
    console.log('[FIREBASE] Deleting file at path:', path);
    const fileRef = ref(typedStorage, path);
    await deleteObject(fileRef);
    console.log('[FIREBASE] File deleted successfully');
  } catch (error) {
    console.error('[FIREBASE] Error deleting file:', error);
    throw error;
  }
};

/**
 * Generate a unique path for a file in Firebase Storage
 * @param file The file to generate a path for
 * @param folder The folder to store the file in
 * @returns The generated path
 */
const generateFirebaseStoragePath = (file: File, folder = 'gazettes'): string => {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_'); // Replace non-alphanumeric chars
  return `test/${timestamp}_${randomString}_${fileName}`;
};

export { uploadFileToFirebase, deleteFileFromFirebase, generateFirebaseStoragePath };