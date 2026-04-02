"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { UserProfile, UserRole } from "./user-model";
import { syncUserToDb } from "./users-service";

export type Role = UserRole;

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  role: Role;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Unblock the UI immediately — profile sync happens in the background
        setLoading(false);
        syncUserToDb(firebaseUser).then((profile) => {
          setUserProfile(profile);
          setRole(profile.role ?? "user");
        });
      } else {
        setRole("user");
        setUserProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
    setRole("user");
    setUserProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, role, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
