"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import type { UserProfile } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAllowed: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isAllowed: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      // Check allowlist
      const phone = firebaseUser.phoneNumber ?? "";
      const normalizedPhone = phone.replace(/\s+/g, "");
      const allowRef = doc(db, COLLECTIONS.allowlist, normalizedPhone);
      const allowSnap = await getDoc(allowRef);

      if (!allowSnap.exists()) {
        // Phone not in allowlist — sign them out
        await firebaseSignOut(auth);
        setUser(null);
        setProfile(null);
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      setIsAllowed(true);

      // Create or update user profile
      const userRef = doc(db, COLLECTIONS.users, firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          phone: normalizedPhone,
          displayName: allowSnap.data()?.name ?? null,
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        };
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
      } else {
        const existingProfile = userSnap.data() as UserProfile;
        // Update lastLoginAt
        await setDoc(userRef, { ...existingProfile, lastLoginAt: Date.now() });
        setProfile({ ...existingProfile, lastLoginAt: Date.now() });
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAllowed, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
