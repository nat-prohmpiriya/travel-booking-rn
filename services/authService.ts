import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User,
  UserCredential,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { UserProfile, CreateUserData, UpdateUserData, FirebaseResponse } from '../types';

class AuthService {
  constructor() {
    // Configure Google Sign-in
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
  }

  // Register new user
  async register(
    email: string,
    password: string,
    userData: CreateUserData
  ): Promise<FirebaseResponse<UserProfile>> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user: User = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`,
      });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: `${userData.firstName} ${userData.lastName}`,
        phone: userData.phone,
        photoURL: user.photoURL,
        role: 'user',
        preferences: {
          currency: 'THB',
          language: 'th',
          timezone: 'Asia/Bangkok',
          notifications: {
            email: true,
            sms: true,
            push: true,
            marketing: false,
          },
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isActive: true,
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      return { success: true, data: userProfile };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }
  }

  // Sign in user
  async signIn(email: string, password: string): Promise<FirebaseResponse<UserProfile>> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userProfile: UserProfile | null = await this.getUserProfile(userCredential.user.uid);

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      return { success: true, data: userProfile };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }
  }

  // Sign out user
  async signOut(): Promise<FirebaseResponse<null>> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }
  }

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(
    uid: string,
    updateData: UpdateUserData
  ): Promise<FirebaseResponse<UserProfile>> {
    try {
      const userRef = doc(db, 'users', uid);
      const updatePayload = {
        ...updateData,
        updatedAt: Timestamp.now(),
      };

      // Update displayName if first or last name changed
      if (updateData.firstName || updateData.lastName) {
        const currentProfile: UserProfile | null = await this.getUserProfile(uid);
        if (currentProfile) {
          const firstName: string = updateData.firstName || currentProfile.firstName;
          const lastName: string = updateData.lastName || currentProfile.lastName;
          updatePayload.displayName = `${firstName} ${lastName}`;

          // Update Firebase Auth profile
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
              displayName: updatePayload.displayName,
            });
          }
        }
      }

      await updateDoc(userRef, updatePayload);

      const updatedProfile: UserProfile | null = await this.getUserProfile(uid);
      if (!updatedProfile) {
        throw new Error('Failed to get updated profile');
      }

      return { success: true, data: updatedProfile };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }
  }

  // Send password reset email
  async resetPassword(email: string): Promise<FirebaseResponse<null>> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }
  }

  // Change password
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<FirebaseResponse<null>> {
    try {
      const user: User | null = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user');
      }

      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  // Google Sign-in
  async signInWithGoogle(): Promise<FirebaseResponse<UserProfile>> {
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get the user's ID token
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.data?.idToken) {
        throw new Error('Google Sign-in failed: No ID token received');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);

      // Sign-in to Firebase with the Google credential
      const userCredential: UserCredential = await signInWithCredential(auth, googleCredential);
      const user: User = userCredential.user;

      // Check if user profile exists in Firestore
      let userProfile: UserProfile | null = await this.getUserProfile(user.uid);

      if (!userProfile) {
        // Create new user profile for Google sign-in
        const names: string[] = user.displayName?.split(' ') || ['', ''];
        const firstName: string = names[0] || '';
        const lastName: string = names.slice(1).join(' ') || '';

        userProfile = {
          uid: user.uid,
          email: user.email!,
          firstName,
          lastName,
          displayName: user.displayName || `${firstName} ${lastName}`,
          photoURL: user.photoURL,
          role: 'user',
          preferences: {
            currency: 'THB',
            language: 'th',
            timezone: 'Asia/Bangkok',
            notifications: {
              email: true,
              sms: true,
              push: true,
              marketing: false,
            },
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          isActive: true,
        };

        await setDoc(doc(db, 'users', user.uid), userProfile);
      }

      return { success: true, data: userProfile };
    } catch (error: any) {
      // Handle specific Google Sign-in errors
      if (error.code === 'signin_cancelled') {
        return {
          success: false,
          error: {
            code: 'signin_cancelled',
            message: 'การเข้าสู่ระบบถูกยกเลิก',
          },
        };
      } else if (error.code === 'in_progress') {
        return {
          success: false,
          error: {
            code: 'in_progress',
            message: 'การเข้าสู่ระบบกำลังดำเนินการอยู่',
          },
        };
      } else if (error.code === 'play_services_not_available') {
        return {
          success: false,
          error: {
            code: 'play_services_not_available',
            message: 'Google Play Services ไม่พร้อมใช้งาน',
          },
        };
      }

      return {
        success: false,
        error: {
          code: error.code || 'google_signin_error',
          message: error.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ',
        },
      };
    }
  }

  // Sign out from Google (if signed in with Google)
  async signOutFromGoogle(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Error signing out from Google:', error);
    }
  }
}

export const authService = new AuthService();