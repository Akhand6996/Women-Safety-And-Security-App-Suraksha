// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app"; // getApps aur getApp bhi import karein

// initializeAuth aur React Native persistence types ko import karein
import {
  initializeAuth,
  getReactNativePersistence // Naya import: React Native persistence ke liye
} from "firebase/auth"; // For Firebase Authentication

// Async Storage ko import karein jo ki React Native persistence ke liye zaroori hai
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // Naya import

import { getFirestore } from "firebase/firestore"; // For Cloud Firestore
import { getStorage } from "firebase/storage"; // For Cloud Storage
// Optional: import { getAnalytics } from "firebase/analytics"; // Agar Analytics use kar rahe hain

// Aapke web app ka Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyD5D1XepBq4EbS3-rLTV_YgytqEZSSDS3g",
  authDomain: "women-safety-and-securit-8a099.firebaseapp.com",
  projectId: "women-safety-and-securit-8a099",
  storageBucket: "women-safety-and-securit-8a099.appspot.com",
  messagingSenderId: "119163199936",
  appId: "1:119163199936:web:25faeca8fc3db3e6852825",
  measurementId: "G-6JPG335SWS" // Analytics ke liye
};

// Check karein ki Firebase app pehle se initialized hai ya nahi
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Agar pehle se initialized hai, toh existing app instance use karein
}

// Firebase services ko initialize karein
// initializeAuth ka istemal React Native persistence ke saath
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
// Optional: export const analytics = getAnalytics(app); // Agar Analytics use kar rahe hain

// Aapka `firebase.js` file ab update ho gaya hai!
