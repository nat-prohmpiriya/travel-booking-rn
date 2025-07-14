import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'partner' | 'user';

// =================== SIMPLIFIED USER INTERFACES ===================
export interface UserProfile {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    phone?: string;
    photoURL?: string;
    role: UserRole;
    preferences: {
        currency: string;
        language: string;
        timezone: string;
        notifications: {
            email: boolean;
            sms: boolean;
            push: boolean;
            marketing: boolean;
        };
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
    isActive?: boolean;
    // Optional fields for detailed profile
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    nationality?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
}

export interface CreateUserData {
    firstName: string;
    lastName: string;
    phone?: string;
}

export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: UserProfile['gender'];
    nationality?: string;
    photoURL?: string;
    address?: Partial<UserProfile['address']>;
    preferences?: Partial<UserProfile['preferences']>;
}

// =================== AUTH STATE INTERFACES ===================
export interface AuthState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface AuthContextType extends AuthState {
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, userData: CreateUserData) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    clearError: () => void;
}

