"use client";

import { useEffect, useState } from "react";
import { subscribeToWorks, Work, Priority, WorkStatus } from "../lib/work-model";
import { UserProfile } from "../lib/user-model";

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_COLORS: Record<WorkStatus, string> = {
  blocked: "text-red-500",
  "in-progress": "text-yellow-500",
  done: "text-green-500",
};

const STATUS_DOT: Record<WorkStatus, string> = {
  blocked: "bg-red-500",
  "in-progress": "bg-yellow-400",
  done: "bg-green-500",
};

interface Props {
  member: UserProfile;
}

export default function MemberDashboard({ member }: Props) {
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    return subscribeToWorks((all) =>
      setWorks(all.filter((w) => w.assignedTo === member.uid))
    );
  }, [member.uid]);

  const total = works.length;
  const done = works.filter((w) => w.status === "done").length;
  const blocked = works.filter((w) => w.status === "blocked").length;
  const inProgress = works.filter((w) => w.status === "in-progress").length;
  const avgProgress =
    total > 0 ? Math.round(works.reduce((s, w) => s + w.progress, 0) / total) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Member header */}
      <div className="flex items-center gap-3">
        {member.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.photoURL} alt="" className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-semibold text-zinc-500">
            {(member.displayName ?? member.email)[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {member.displayName ?? "—"}
          </p>
          <p className="text-xs text-zinc-400">{member.email}</p>
        </div>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 capitalize">
          {member.role}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: total, color: "text-zinc-900 dark:text-zinc-50" },
          { label: "In Progress", value: inProgress, color: "text-yellow-500" },
          { label: "Blocked", value: blocked, color: "text-red-500" },
          { label: "Done", value: done, color: "text-green-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 flex flex-col gap-1">
            <span className="text-xs text-zinc-400">{s.label}</span>
            <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Avg progress bar */}
      <div>
        <div className="flex justify-between text-xs text-zinc-400 mb-1">
          <span>Average progress</span>
          <span>{avgProgress}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
      </div>

      {/* Works list */}
      {total === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-6">No works assigned.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {works.map((w) => (
            <div
              key={w.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[w.status]}`} />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{w.name}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_COLORS[w.priority]}`}>
                    {w.priority}
                  </span>
                  <span className={`text-[10px] font-medium ${STATUS_COLORS[w.status]}`}>
                    {w.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${w.progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 w-8 text-right">{w.progress}%</span>
              </div>
              {w.dueDate && (
                <p className="text-[10px] text-zinc-400">Due {w.dueDate}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
