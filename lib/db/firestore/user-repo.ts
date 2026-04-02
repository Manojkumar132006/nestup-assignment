/**
 * Firestore implementation of IUserRepository.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "../../firebase";
import { UserProfile, UserRole } from "../../user-model";
import { IUserRepository } from "../types";

export class FirestoreUserRepository implements IUserRepository {
  async syncUser(firebaseUser: User): Promise<UserProfile> {
    const ref = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      const newProfile = {
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

    await updateDoc(ref, {
      email: firebaseUser.email ?? "",
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      updatedAt: serverTimestamp(),
    });

    return snap.data() as UserProfile;
  }

  async updateSkills(uid: string, skills: string[]): Promise<void> {
    await updateDoc(doc(db, "users", uid), { skills, updatedAt: serverTimestamp() });
  }

  async updateRole(uid: string, role: UserRole): Promise<void> {
    await updateDoc(doc(db, "users", uid), { role, updatedAt: serverTimestamp() });
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const snap = await getDocs(query(collection(db, "users")));
    return snap.docs.map((d) => d.data() as UserProfile);
  }
}
