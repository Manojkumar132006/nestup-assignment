/**
 * Database-agnostic repository interfaces.
 *
 * To migrate from Firestore to MongoDB (or any other backend):
 *   1. Create a new folder under lib/db/ (e.g. lib/db/mongodb/)
 *   2. Implement each interface below for the new backend
 *   3. Update lib/db/index.ts to export the new implementations
 *
 * No component or model file needs to change — they all consume these interfaces.
 */

import { User } from "firebase/auth";
import { UserProfile, UserRole } from "../user-model";
import { Work, WorkInput } from "../work-model";
import { Dependency, DependencyInput } from "../dependency-model";

// ---------------------------------------------------------------------------
// User Repository
// ---------------------------------------------------------------------------

export interface IUserRepository {
  /**
   * Upserts a user profile on sign-in.
   * Creates the document on first login; syncs auth fields on subsequent logins.
   */
  syncUser(firebaseUser: User): Promise<UserProfile>;

  /** Replace the skills array for a user. */
  updateSkills(uid: string, skills: string[]): Promise<void>;

  /** Change the role for a user. */
  updateRole(uid: string, role: UserRole): Promise<void>;

  /** Return all user profiles (admin use only). */
  getAllUsers(): Promise<UserProfile[]>;
}

// ---------------------------------------------------------------------------
// Work Repository
// ---------------------------------------------------------------------------

export interface IWorkRepository {
  /**
   * Subscribe to all work items.
   * @returns unsubscribe function — call it in useEffect cleanup.
   */
  subscribe(cb: (works: Work[]) => void): () => void;

  /** Create a new work item and return its generated ID. */
  create(input: WorkInput): Promise<string>;

  /** Partially update a work item. */
  update(id: string, patch: Partial<WorkInput>): Promise<void>;

  /** Delete a work item by ID. */
  delete(id: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Dependency Repository
// ---------------------------------------------------------------------------

export interface IDependencyRepository {
  /**
   * Subscribe to all dependency records.
   * @returns unsubscribe function — call it in useEffect cleanup.
   */
  subscribe(cb: (deps: Dependency[]) => void): () => void;

  /**
   * Create a dependency after validating it won't introduce a cycle.
   * Throws if a cycle would be created.
   */
  create(input: DependencyInput, existingDeps: Dependency[]): Promise<string>;

  /** Partially update a dependency (type / threshold). */
  update(
    id: string,
    patch: Partial<Pick<DependencyInput, "type" | "threshold">>,
    existingDeps: Dependency[]
  ): Promise<void>;

  /** Delete a dependency by ID. */
  delete(id: string): Promise<void>;

  /**
   * Detect and remove circular dependencies.
   * Returns the IDs of the removed records.
   */
  resolveCircular(deps: Dependency[]): Promise<string[]>;
}
