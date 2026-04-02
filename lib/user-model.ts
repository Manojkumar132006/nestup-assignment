/**
 * User domain types.
 * Mutations are handled via userRepo (lib/db/index.ts).
 */

export type UserRole = "admin" | "user";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  skills: string[];
  createdAt: unknown;
  updatedAt: unknown;
}
