import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { authService } from '../services/authService';
import { AuthContextType, AuthState, UserProfile, CreateUserData } from '../types/user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const setLoading = (isLoading: boolean): void => {
    setState(prev => ({ ...prev, isLoading }));
  };

  const setError = (error: string | null): void => {
    setState(prev => ({ ...prev, error }));
  };

  const setUser = (user: UserProfile | null): void => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }));
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.signIn(email, password);
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        const errorMessage: string = response.error?.message || 'เข้าสู่ระบบไม่สำเร็จ';
        setError(errorMessage);
        setLoading(false);
      }
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: CreateUserData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(email, password, userData);
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        const errorMessage: string = response.error?.message || 'สมัครสมาชิกไม่สำเร็จ';
        setError(errorMessage);
        setLoading(false);
      }
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Sign out from Google if signed in with Google
      await authService.signOutFromGoogle();
      
      const response = await authService.signOut();
      
      if (response.success) {
        setUser(null);
      } else {
        const errorMessage: string = response.error?.message || 'ออกจากระบบไม่สำเร็จ';
        setError(errorMessage);
        setLoading(false);
      }
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการออกจากระบบ');
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.signInWithGoogle();
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        const errorMessage: string = response.error?.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ';
        setError(errorMessage);
        setLoading(false);
      }
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      setError(null);
      
      const response = await authService.resetPassword(email);
      
      if (!response.success) {
        const errorMessage: string = response.error?.message || 'ส่งอีเมลรีเซ็ตรหัสผ่านไม่สำเร็จ';
        setError(errorMessage);
      }
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน');
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // User is signed in, get their profile
        const userProfile: UserProfile | null = await authService.getUserProfile(firebaseUser.uid);
        setUser(userProfile);
      } else {
        // User is signed out
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context: AuthContextType | undefined = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};