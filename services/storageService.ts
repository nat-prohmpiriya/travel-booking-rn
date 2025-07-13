import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageReference,
  UploadResult,
  UploadTask,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from '../../firebaseConfig';
import { FirebaseResponse, FirebaseUploadResult } from '../types';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  metadata?: {
    contentType?: string;
    customMetadata?: Record<string, string>;
  };
}

class StorageService {
  // Upload file with progress tracking
  async uploadFile(
    file: File | Blob,
    path: string,
    options?: UploadOptions
  ): Promise<FirebaseResponse<FirebaseUploadResult>> {
    try {
      const storageRef: StorageReference = ref(storage, path);
      
      let uploadTask: UploadTask;
      
      if (options?.metadata) {
        uploadTask = uploadBytesResumable(storageRef, file, options.metadata);
      } else {
        uploadTask = uploadBytesResumable(storageRef, file);
      }

      return new Promise((resolve) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            if (options?.onProgress) {
              const progress: UploadProgress = {
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              };
              options.onProgress(progress);
            }
          },
          (error) => {
            resolve({
              success: false,
              error: { code: error.code, message: error.message },
            });
          },
          async () => {
            try {
              const downloadURL: string = await getDownloadURL(uploadTask.snapshot.ref);
              const result: FirebaseUploadResult = {
                downloadURL,
                fullPath: uploadTask.snapshot.ref.fullPath,
                size: uploadTask.snapshot.totalBytes,
                contentType: uploadTask.snapshot.metadata.contentType || 'unknown',
              };

              resolve({ success: true, data: result });
            } catch (error: any) {
              resolve({
                success: false,
                error: { code: error.code, message: error.message },
              });
            }
          }
        );
      });
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Simple upload without progress tracking
  async uploadFileSimple(
    file: File | Blob,
    path: string,
    metadata?: any
  ): Promise<FirebaseResponse<FirebaseUploadResult>> {
    try {
      const storageRef: StorageReference = ref(storage, path);
      
      let uploadResult: UploadResult;
      
      if (metadata) {
        uploadResult = await uploadBytes(storageRef, file, metadata);
      } else {
        uploadResult = await uploadBytes(storageRef, file);
      }

      const downloadURL: string = await getDownloadURL(uploadResult.ref);
      
      const result: FirebaseUploadResult = {
        downloadURL,
        fullPath: uploadResult.ref.fullPath,
        size: uploadResult.metadata.size || 0,
        contentType: uploadResult.metadata.contentType || 'unknown',
      };

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(
    files: (File | Blob)[],
    basePath: string,
    options?: UploadOptions
  ): Promise<FirebaseResponse<FirebaseUploadResult[]>> {
    try {
      const uploadPromises = files.map((file, index) => {
        const fileName: string = file instanceof File ? file.name : `file_${index}`;
        const filePath: string = `${basePath}/${Date.now()}_${fileName}`;
        return this.uploadFile(file, filePath, options);
      });

      const results = await Promise.all(uploadPromises);
      
      const failedUploads = results.filter(result => !result.success);
      if (failedUploads.length > 0) {
        return {
          success: false,
          error: {
            code: 'multiple-upload-failed',
            message: `${failedUploads.length} uploads failed`,
          },
        };
      }

      const successfulUploads: FirebaseUploadResult[] = results
        .filter(result => result.success && result.data)
        .map(result => result.data!);

      return { success: true, data: successfulUploads };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Upload user profile image
  async uploadUserProfileImage(
    userId: string,
    file: File | Blob,
    options?: UploadOptions
  ): Promise<FirebaseResponse<FirebaseUploadResult>> {
    const path: string = `users/${userId}/profile/${Date.now()}_profile_image`;
    const metadata = {
      contentType: file instanceof File ? file.type : 'image/jpeg',
      customMetadata: {
        userId,
        type: 'profile_image',
      },
    };

    return this.uploadFile(file, path, { ...options, metadata });
  }

  // Upload hotel images
  async uploadHotelImages(
    hotelId: string,
    files: (File | Blob)[],
    options?: UploadOptions
  ): Promise<FirebaseResponse<FirebaseUploadResult[]>> {
    const basePath: string = `hotels/${hotelId}/images`;
    return this.uploadMultipleFiles(files, basePath, options);
  }

  // Upload review images
  async uploadReviewImages(
    userId: string,
    reviewId: string,
    files: (File | Blob)[],
    options?: UploadOptions
  ): Promise<FirebaseResponse<FirebaseUploadResult[]>> {
    const basePath: string = `reviews/${reviewId}/images`;
    const metadata = {
      customMetadata: {
        userId,
        reviewId,
        type: 'review_image',
      },
    };

    return this.uploadMultipleFiles(files, basePath, { ...options, metadata });
  }

  // Delete file
  async deleteFile(filePath: string): Promise<FirebaseResponse<null>> {
    try {
      const storageRef: StorageReference = ref(storage, filePath);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Delete multiple files
  async deleteMultipleFiles(filePaths: string[]): Promise<FirebaseResponse<null>> {
    try {
      const deletePromises = filePaths.map(path => this.deleteFile(path));
      const results = await Promise.all(deletePromises);
      
      const failedDeletes = results.filter(result => !result.success);
      if (failedDeletes.length > 0) {
        return {
          success: false,
          error: {
            code: 'multiple-delete-failed',
            message: `${failedDeletes.length} deletes failed`,
          },
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Get download URL for existing file
  async getDownloadURL(filePath: string): Promise<FirebaseResponse<string>> {
    try {
      const storageRef: StorageReference = ref(storage, filePath);
      const downloadURL: string = await getDownloadURL(storageRef);
      return { success: true, data: downloadURL };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // List all files in a folder
  async listFiles(folderPath: string): Promise<FirebaseResponse<string[]>> {
    try {
      const storageRef: StorageReference = ref(storage, folderPath);
      const listResult = await listAll(storageRef);
      
      const downloadURLs: string[] = await Promise.all(
        listResult.items.map(item => getDownloadURL(item))
      );

      return { success: true, data: downloadURLs };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Delete all files in a folder
  async deleteFolder(folderPath: string): Promise<FirebaseResponse<null>> {
    try {
      const storageRef: StorageReference = ref(storage, folderPath);
      const listResult = await listAll(storageRef);
      
      const deletePromises = listResult.items.map(item => deleteObject(item));
      await Promise.all(deletePromises);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
  }

  // Helper method to generate unique file path
  generateFilePath(folder: string, fileName: string, userId?: string): string {
    const timestamp: number = Date.now();
    const randomId: string = Math.random().toString(36).substr(2, 9);
    const sanitizedFileName: string = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    if (userId) {
      return `${folder}/${userId}/${timestamp}_${randomId}_${sanitizedFileName}`;
    }
    
    return `${folder}/${timestamp}_${randomId}_${sanitizedFileName}`;
  }

  // Helper method to validate file type
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  // Helper method to validate file size
  validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes: number = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  // Validate image file
  validateImageFile(file: File, maxSizeInMB: number = 5): {
    isValid: boolean;
    error?: string;
  } {
    const allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    if (!this.validateFileType(file, allowedTypes)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
      };
    }

    if (!this.validateFileSize(file, maxSizeInMB)) {
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${maxSizeInMB}MB.`,
      };
    }

    return { isValid: true };
  }
}

export const storageService = new StorageService();