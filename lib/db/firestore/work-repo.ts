/**
 * Firestore implementation of IWorkRepository.
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Work, WorkInput } from "../../work-model";
import { IWorkRepository } from "../types";

export class FirestoreWorkRepository implements IWorkRepository {
  private col() {
    return collection(db, "works");
  }

  subscribe(cb: (works: Work[]) => void): () => void {
    return onSnapshot(query(this.col()), (snap) => {
      cb(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            ...(data as Omit<Work, "id">),
            id: d.id,
            // Normalize Firestore Timestamp → ISO string for dueDate if needed
            dueDate:
              data.dueDate instanceof Timestamp
                ? data.dueDate.toDate().toISOString().slice(0, 10)
                : data.dueDate ?? "",
          };
        })
      );
    });
  }

  async create(input: WorkInput): Promise<string> {
    const ref = await addDoc(this.col(), {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async update(id: string, patch: Partial<WorkInput>): Promise<void> {
    await updateDoc(doc(db, "works", id), { ...patch, updatedAt: serverTimestamp() });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "works", id));
  }
}
