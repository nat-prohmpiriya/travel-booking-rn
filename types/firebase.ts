import { Timestamp } from 'firebase/firestore';

// Firebase specific types
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirebaseError {
  code: string;
  message: string;
}

// Query and pagination types
export interface QueryOptions {
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  startAfter?: any;
  where?: WhereClause[];
}

export interface WhereClause {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any';
  value: any;
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: any;
  total?: number;
}

// Firebase response types
export interface FirebaseResponse<T> {
  success: boolean;
  data?: T;
  error?: FirebaseError;
}

export interface FirebaseUploadResult {
  downloadURL: string;
  fullPath: string;
  size: number;
  contentType: string;
}