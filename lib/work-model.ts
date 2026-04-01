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
import { db } from "./firebase";

export type Priority = "low" | "medium" | "high" | "critical";
export type WorkStatus = "blocked" | "in-progress" | "done";

export interface Work {
  id: string;
  name: string;
  assignedTo: string; // userId
  priority: Priority;
  progress: number; // 0–100
  status: WorkStatus;
  dueDate: string; // ISO date string YYYY-MM-DD for calendar placement
  createdAt: unknown;
  updatedAt: unknown;
}

export type WorkInput = Omit<Work, "id" | "createdAt" | "updatedAt">;

const col = () => collection(db, "works");

export function subscribeToWorks(cb: (works: Work[]) => void) {
  return onSnapshot(query(col()), (snap) => {
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

export async function createWork(input: WorkInput): Promise<string> {
  const ref = await addDoc(col(), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateWork(id: string, patch: Partial<WorkInput>): Promise<void> {
  await updateDoc(doc(db, "works", id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteWork(id: string): Promise<void> {
  await deleteDoc(doc(db, "works", id));
}
