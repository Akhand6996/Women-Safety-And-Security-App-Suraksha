// src/context/AuthContext.js

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  console.log('AuthProvider: Initializing...');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: useEffect started, setting up auth state listener...');
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      console.log('AuthProvider: Auth state changed, user:', firebaseUser ? 'logged in' : 'logged out');
      setUser(firebaseUser);
      if (firebaseUser) {
        console.log('AuthProvider: Getting user profile for uid:', firebaseUser.uid);
        const p = await authService.getUserProfile(firebaseUser.uid);
        console.log('AuthProvider: User profile loaded:', p);
        setProfile(p);
      } else {
        console.log('AuthProvider: User logged out, clearing profile');
        setProfile(null);
      }
      console.log('AuthProvider: Setting loading to false');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    console.log('AuthProvider: refreshProfile called');
    if (user) {
      const p = await authService.getUserProfile(user.uid);
      setProfile(p);
    }
  };

  console.log('AuthProvider: Rendering provider, loading:', loading, 'user:', !!user);
  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
