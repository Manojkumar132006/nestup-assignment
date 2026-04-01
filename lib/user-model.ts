import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "./firebase";

export type UserRole = "admin" | "user";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  skills: string[];
  createdAt: unknown; // Firestore Timestamp
  updatedAt: unknown;
}

/**
 * Ensures a user document exists in the `users` collection.
 * Creates it on first sign-in, otherwise leaves existing data intact.
 */
export async function syncUserToDb(firebaseUser: User): Promise<UserProfile> {
  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const newProfile: Omit<UserProfile, "createdAt" | "updatedAt"> & {
      createdAt: unknown;
      updatedAt: unknown;
    } = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      role: "user" as UserRole,
      skills: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, newProfile);
    return { ...newProfile } as UserProfile;
  }

  // Keep auth fields in sync on every login
  await updateDoc(ref, {
    email: firebaseUser.email ?? "",
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    updatedAt: serverTimestamp(),
  });

  return snap.data() as UserProfile;
}

/** Update the skills array for a user. */
export async function updateUserSkills(uid: string, skills: string[]): Promise<void> {
  await updateDoc(doc(db, "users", uid), { skills, updatedAt: serverTimestamp() });
}

/** Update the role for a user. */
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role, updatedAt: serverTimestamp() });
}
