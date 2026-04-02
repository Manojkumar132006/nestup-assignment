/**
 * User service — thin facade over userRepo.
 * Components import from here; the underlying DB is swapped in lib/db/index.ts.
 */

import { User } from "firebase/auth";
import { userRepo } from "./db";
import { UserProfile, UserRole } from "./user-model";

export const syncUserToDb   = (firebaseUser: User): Promise<UserProfile> =>
  userRepo.syncUser(firebaseUser);

export const getAllUsers     = (): Promise<UserProfile[]> =>
  userRepo.getAllUsers();

export const updateUserSkills = (uid: string, skills: string[]): Promise<void> =>
  userRepo.updateSkills(uid, skills);

export const updateUserRole   = (uid: string, role: UserRole): Promise<void> =>
  userRepo.updateRole(uid, role);
