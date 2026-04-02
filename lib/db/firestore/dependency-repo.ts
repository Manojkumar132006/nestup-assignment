/**
 * Firestore implementation of IDependencyRepository.
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
} from "firebase/firestore";
import { db } from "../../firebase";
import { Dependency, DependencyInput, wouldCreateCycle, findCycles } from "../../dependency-model";
import { IDependencyRepository } from "../types";

export class FirestoreDependencyRepository implements IDependencyRepository {
  private col() {
    return collection(db, "dependencies");
  }

  subscribe(cb: (deps: Dependency[]) => void): () => void {
    return onSnapshot(query(this.col()), (snap) => {
      cb(snap.docs.map((d) => ({ ...(d.data() as Omit<Dependency, "id">), id: d.id })));
    });
  }

  async create(input: DependencyInput, existingDeps: Dependency[]): Promise<string> {
    if (wouldCreateCycle(existingDeps, input.fromId, input.toId)) {
      throw new Error(
        `Circular dependency detected: adding ${input.fromId} → ${input.toId} would create a cycle.`
      );
    }

    const threshold = input.type === "full" ? 100 : Math.min(100, Math.max(0, input.threshold));

    const ref = await addDoc(this.col(), {
      toId: input.toId,
      fromId: input.fromId,
      type: input.type,
      threshold,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return ref.id;
  }

  async update(
    id: string,
    patch: Partial<Pick<DependencyInput, "type" | "threshold">>,
    existingDeps: Dependency[]
  ): Promise<void> {
    const current = existingDeps.find((d) => d.id === id);
    if (!current) throw new Error("Dependency not found");

    const type = patch.type ?? current.type;
    const threshold =
      type === "full"
        ? 100
        : Math.min(100, Math.max(0, patch.threshold ?? current.threshold));

    const others = existingDeps.filter((d) => d.id !== id);
    if (wouldCreateCycle(others, current.fromId, current.toId)) {
      throw new Error("Update would create a circular dependency.");
    }

    await updateDoc(doc(db, "dependencies", id), {
      type,
      threshold,
      updatedAt: serverTimestamp(),
    });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "dependencies", id));
  }

  async resolveCircular(deps: Dependency[]): Promise<string[]> {
    const cycles = findCycles(deps);
    if (cycles.length === 0) return [];

    const cycleNodeSets = cycles.map((c) => new Set(c));
    const toRemove = new Set<string>();

    for (const cycleNodes of cycleNodeSets) {
      const cycleDeps = deps.filter(
        (d) => cycleNodes.has(d.fromId) && cycleNodes.has(d.toId)
      );
      cycleDeps.sort((a, b) => b.id.localeCompare(a.id));
      if (cycleDeps[0]) toRemove.add(cycleDeps[0].id);
    }

    await Promise.all([...toRemove].map((id) => deleteDoc(doc(db, "dependencies", id))));
    return [...toRemove];
  }
}
