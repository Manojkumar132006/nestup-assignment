"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAllUsers, updateUserRole } from "@/lib/users-service";
import { UserProfile } from "@/lib/user-model";

export default function ConsolePage() {
  const { role, loading } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  // Start false — only flip true once we know the user is admin
  const [fetching, setFetching] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (role !== "admin") return;
    setFetching(true);
    getAllUsers().then((users) => {
      setMembers(users);
      setFetching(false);
    });
  }, [role, loading]);

  async function handleToggleAdmin(member: UserProfile) {
    const next = member.role === "admin" ? "user" : "admin";
    setPromoting(member.uid);
    try {
      await updateUserRole(member.uid, next);
      setMembers((prev) =>
        prev.map((m) => (m.uid === member.uid ? { ...m, role: next } : m))
      );
    } finally {
      setPromoting(null);
    }
  }

  if (loading || fetching) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Access denied.
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col p-6 max-w-4xl mx-auto w-full gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Console — Members</h1>
      {members.length === 0 ? (
        <p className="text-sm text-zinc-400">No members found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.map((m) => (
            <div
              key={m.uid}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4"
            >
              {/* Avatar */}
              {m.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photoURL} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-500 flex-shrink-0">
                  {(m.displayName ?? m.email)[0].toUpperCase()}
                </div>
              )}

              {/* Name / email — links to detail page */}
              <Link
                href={`/console/${m.uid}`}
                className="min-w-0 flex-1 hover:underline"
              >
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                  {m.displayName ?? "—"}
                </p>
                <p className="text-xs text-zinc-400 truncate">{m.email}</p>
              </Link>

              {/* Role badge */}
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${
                m.role === "admin"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}>
                {m.role}
              </span>

              {/* Promote / demote button */}
              <button
                onClick={() => handleToggleAdmin(m)}
                disabled={promoting === m.uid}
                title={m.role === "admin" ? "Remove admin" : "Make admin"}
                className="flex-shrink-0 rounded-md border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
              >
                {promoting === m.uid
                  ? "…"
                  : m.role === "admin"
                  ? "Demote"
                  : "Make admin"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
