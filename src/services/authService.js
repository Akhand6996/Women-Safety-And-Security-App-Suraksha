// src/services/authService.js

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export const authService = {
  // Register new user
  async register({ name, email, password, phone }) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name,
      email,
      phone,
      bloodGroup: '',
      emergencyContacts: [],
      safeZones: [],
      createdAt: serverTimestamp(),
      isProfileComplete: false,
    });

    return user;
  },

  // Login
  async login({ email, password }) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if user profile exists in Firestore, create if not
    const profileDoc = await getDoc(doc(db, 'users', user.uid));
    if (!profileDoc.exists()) {
      console.log('authService: login - creating missing profile for user:', user.uid);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: user.displayName || '',
        email: user.email,
        phone: '',
        bloodGroup: '',
        emergencyContacts: [],
        safeZones: [],
        createdAt: serverTimestamp(),
        isProfileComplete: false,
      });
    }
    
    return user;
  },

  // Logout
  async logout() {
    await signOut(auth);
  },

  // Reset password
  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  },

  // Get current user profile from Firestore
  async getUserProfile(uid) {
    console.log('authService: getUserProfile called for uid:', uid);
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      console.log('authService: getUserProfile - document exists:', snap.exists());
      if (snap.exists()) {
        const data = snap.data();
        console.log('authService: getUserProfile - returning data:', data);
        return data;
      }
      console.log('authService: getUserProfile - no document found, returning null');
      return null;
    } catch (error) {
      console.log('authService: getUserProfile - error:', error);
      return null;
    }
  },

  // Update user profile
  async updateUserProfile(uid, data) {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
  },

  // Auth state listener
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser() {
    return auth.currentUser;
  },
};
