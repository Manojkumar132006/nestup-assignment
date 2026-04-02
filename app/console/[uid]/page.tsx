"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAllUsers } from "@/lib/users-service";
import { UserProfile } from "@/lib/user-model";
import MemberDashboard from "@/components/MemberDashboard";

export default function MemberPage(props: PageProps<"/console/[uid]">) {
  const { uid } = use(props.params);
  const { role, loading } = useAuth();
  const [member, setMember] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (role !== "admin") { setFetching(false); return; }
    getAllUsers().then((users) => {
      setMember(users.find((u) => u.uid === uid) ?? null);
      setFetching(false);
    });
  }, [uid, role, loading]);

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
    <main className="flex flex-1 flex-col p-6 max-w-2xl mx-auto w-full gap-6">
      <Link
        href="/console"
        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1 w-fit"
      >
        ← Back to members
      </Link>
      {member ? (
        <MemberDashboard member={member} />
      ) : (
        <p className="text-sm text-zinc-400">Member not found.</p>
      )}
    </main>
  );
}
