// context/AuthContext.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (authUser) {
          try {
            const token = await authUser.getIdToken();
            const response = await fetch('/api/users/profile', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              throw new Error('Profile lookup failed.');
            }

            const profile = await response.json();
            setUser({
              uid: authUser.uid,
              email: authUser.email,
              role: profile.role || 'representative',
              displayName: profile.displayName || null,
            });
          } catch (profileError) {
            console.error('Profile fetch error:', profileError);
            setUser({ uid: authUser.uid, email: authUser.email, role: 'representative' });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth context error:', error);
        if (authUser) {
          setUser({ uid: authUser.uid, email: authUser.email, role: 'representative' });
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);
  
  const logout = async () => {
    await signOut(auth);
    // User state will be set to null by the onAuthStateChanged listener
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);