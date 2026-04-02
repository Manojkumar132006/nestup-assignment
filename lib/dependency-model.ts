/**
 * Dependency domain types, pure graph algorithms, and public API.
 * All persistence is delegated to dependencyRepo (lib/db/index.ts).
 *
 * The cycle-detection helpers (wouldCreateCycle, findCycles) are kept here
 * because they are pure functions with no DB dependency — the Firestore and
 * future MongoDB repos both import them.
 */

import { dependencyRepo } from "./db";

export type DependencyType = "partial" | "full";

export interface Dependency {
  id: string;
  /** The work item that depends on another */
  toId: string;
  /** The work item being depended upon */
  fromId: string;
  type: DependencyType;
  /** 0–100; always 100 when type is "full" */
  threshold: number;
  createdAt: unknown;
  updatedAt: unknown;
}

export type DependencyInput = Omit<Dependency, "id" | "createdAt" | "updatedAt">;

// ---------------------------------------------------------------------------
// Pure graph helpers (no DB dependency — safe to import anywhere)
// ---------------------------------------------------------------------------

/** Builds an adjacency map: fromId → [toId, ...] */
function buildGraph(deps: Dependency[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const d of deps) {
    if (!graph.has(d.fromId)) graph.set(d.fromId, []);
    graph.get(d.fromId)!.push(d.toId);
  }
  return graph;
}

/**
 * Returns true if adding fromId → toId would create a cycle.
 * Uses iterative DFS to avoid stack overflow on large graphs.
 */
export function wouldCreateCycle(
  existingDeps: Dependency[],
  fromId: string,
  toId: string
): boolean {
  if (fromId === toId) return true;

  const graph = buildGraph(existingDeps);
  if (!graph.has(fromId)) graph.set(fromId, []);
  graph.get(fromId)!.push(toId);

  const visited = new Set<string>();
  const stack = [toId];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node === fromId) return true;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const neighbour of graph.get(node) ?? []) stack.push(neighbour);
  }

  return false;
}

/**
 * Finds all cycles via Tarjan's SCC algorithm.
 * Returns arrays of node IDs that form cycles.
 */
export function findCycles(deps: Dependency[]): string[][] {
  const graph = buildGraph(deps);
  const nodes = Array.from(new Set(deps.flatMap((d) => [d.fromId, d.toId])));

  const index   = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Map<string, boolean>();
  const stack: string[] = [];
  const sccs: string[][] = [];
  let counter = 0;

  function strongconnect(v: string) {
    index.set(v, counter);
    lowlink.set(v, counter);
    counter++;
    stack.push(v);
    onStack.set(v, true);

    for (const w of graph.get(v) ?? []) {
      if (!index.has(w)) {
        strongconnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.get(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
      }
    }

    if (lowlink.get(v) === index.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.set(w, false);
        scc.push(w);
      } while (w !== v);
      if (scc.length > 1) sccs.push(scc);
    }
  }

  for (const n of nodes) {
    if (!index.has(n)) strongconnect(n);
  }

  return sccs;
}

// ---------------------------------------------------------------------------
// Public API — delegates to the active repo
// ---------------------------------------------------------------------------

export const subscribeToDependencies = (cb: (deps: Dependency[]) => void) =>
  dependencyRepo.subscribe(cb);

export const createDependency = (input: DependencyInput, existingDeps: Dependency[]) =>
  dependencyRepo.create(input, existingDeps);

export const updateDependency = (
  id: string,
  patch: Partial<Pick<DependencyInput, "type" | "threshold">>,
  existingDeps: Dependency[]
) => dependencyRepo.update(id, patch, existingDeps);

export const deleteDependency = (id: string) =>
  dependencyRepo.delete(id);

export const resolveCircularDependencies = (deps: Dependency[]) =>
  dependencyRepo.resolveCircular(deps);
