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
    return userCredential.user;
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
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return snap.data();
    return null;
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
