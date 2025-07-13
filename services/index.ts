// Re-export all services for easy import
export { authService } from './authService';
export { hotelService } from './hotelService';
export { bookingService } from './bookingService';
export { reviewService } from './reviewService';
export { storageService } from './storageService';

// Re-export types for convenience
export type { UploadProgress, UploadOptions } from './storageService';