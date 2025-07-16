import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../env';
import notificationService from '../utils/notificationService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch profile logic moved from Profile.js
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const storedToken = token || await AsyncStorage.getItem('token');
      if (!storedToken) {
        setProfile(null);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json'
        }
      });
      setProfile(response.data);
    } catch (error) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Optionally, fetch profile on mount if token exists
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  // Placeholder login/signup/logout for context completeness
  const login = async (tokenValue) => {
    setToken(tokenValue);
    await AsyncStorage.setItem('token', tokenValue);
    fetchProfile();
    // Update notification token when user logs in
    await notificationService.updateTokenOnLogin();
  };
  const signup = async (...args) => {};
  const logout = async () => { 
    await AsyncStorage.clear();
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      profile,
      setProfile,
      login,
      signup,
      logout,
      loading,
      fetchProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
