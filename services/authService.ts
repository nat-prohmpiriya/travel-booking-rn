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
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { UserProfile, CreateUserData, UpdateUserData, FirebaseResponse } from '../types';

class AuthService {
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
}

export const authService = new AuthService();