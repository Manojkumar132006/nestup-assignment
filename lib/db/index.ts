/**
 * Active database implementation.
 *
 * ─── HOW TO MIGRATE TO MONGODB ───────────────────────────────────────────────
 *
 *  1. Create lib/db/mongodb/ and implement the three interfaces from types.ts:
 *       - MongoUserRepository       implements IUserRepository
 *       - MongoWorkRepository       implements IWorkRepository
 *       - MongoDependencyRepository implements IDependencyRepository
 *
 *  2. Replace the three imports below with your MongoDB classes, e.g.:
 *       import { MongoUserRepository }       from "./mongodb/user-repo";
 *       import { MongoWorkRepository }       from "./mongodb/work-repo";
 *       import { MongoDependencyRepository } from "./mongodb/dependency-repo";
 *
 *  3. That's it. No other file needs to change.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { FirestoreUserRepository }       from "./firestore/user-repo";
import { FirestoreWorkRepository }       from "./firestore/work-repo";
import { FirestoreDependencyRepository } from "./firestore/dependency-repo";

export const userRepo       = new FirestoreUserRepository();
export const workRepo       = new FirestoreWorkRepository();
export const dependencyRepo = new FirestoreDependencyRepository();
