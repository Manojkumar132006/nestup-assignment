"use client";

import { useEffect, useState } from "react";
import { Work, WorkInput, subscribeToWorks, createWork, updateWork, deleteWork, Priority, WorkStatus } from "../lib/work-model";
import { useAuth } from "../lib/auth-context";

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_COLORS: Record<WorkStatus, string> = {
  "blocked": "bg-red-500",
  "in-progress": "bg-yellow-400",
  "done": "bg-green-500",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

interface WorkFormData {
  name: string;
  assignedTo: string;
  priority: Priority;
  progress: number;
  status: WorkStatus;
  dueDate: string;
}

const EMPTY_FORM: WorkFormData = {
  name: "",
  assignedTo: "",
  priority: "medium",
  progress: 0,
  status: "in-progress",
  dueDate: "",
};

export default function WorkCalendar() {
  const { user } = useAuth();
  const [works, setWorks] = useState<Work[]>([]);
  const [today] = useState(new Date());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [form, setForm] = useState<WorkFormData>(EMPTY_FORM);

  useEffect(() => {
    const unsub = subscribeToWorks(setWorks);
    return unsub;
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  function isoDate(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function worksForDate(dateStr: string) {
    return works.filter((w) => w.dueDate === dateStr);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function openNewForm(dateStr: string) {
    setEditingWork(null);
    setForm({ ...EMPTY_FORM, dueDate: dateStr, assignedTo: user?.uid ?? "" });
    setSelectedDate(dateStr);
    setShowForm(true);
  }

  function openEditForm(work: Work) {
    setEditingWork(work);
    setForm({
      name: work.name,
      assignedTo: work.assignedTo,
      priority: work.priority,
      progress: work.progress,
      status: work.status,
      dueDate: work.dueDate,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: WorkInput = { ...form, progress: Number(form.progress) };
    if (editingWork) {
      await updateWork(editingWork.id, input);
    } else {
      await createWork(input);
    }
    setShowForm(false);
    setEditingWork(null);
    setForm(EMPTY_FORM);
  }

  async function handleDelete(id: string) {
    await deleteWork(id);
    setShowForm(false);
    setEditingWork(null);
  }

  const todayStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate());

  // Build calendar grid cells (leading empty + day cells)
  const cells: Array<{ day: number | null; dateStr: string | null }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateStr: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: isoDate(viewYear, viewMonth, d) });
  }

  return (
    <div className="flex flex-col gap-4 p-4 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Work Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            ‹
          </button>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 w-36 text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            ›
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-700 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
        {cells.map((cell, i) => {
          if (!cell.day || !cell.dateStr) {
            return <div key={`empty-${i}`} className="bg-zinc-50 dark:bg-zinc-900 min-h-[90px]" />;
          }
          const dayWorks = worksForDate(cell.dateStr);
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDate;
          return (
            <div
              key={cell.dateStr}
              className={`bg-white dark:bg-zinc-900 min-h-[90px] p-1.5 cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${isSelected ? "ring-2 ring-inset ring-blue-500" : ""}`}
              onClick={() => { setSelectedDate(cell.dateStr); }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-blue-600 text-white" : "text-zinc-500 dark:text-zinc-400"}`}>
                  {cell.day}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); openNewForm(cell.dateStr!); }}
                  className="text-zinc-300 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-300 text-base leading-none"
                  title="Add work"
                >
                  +
                </button>
              </div>
              <div className="flex flex-col gap-0.5">
                {dayWorks.slice(0, 3).map((w) => (
                  <button
                    key={w.id}
                    onClick={(e) => { e.stopPropagation(); openEditForm(w); }}
                    className={`text-left text-[10px] px-1 py-0.5 rounded truncate w-full ${PRIORITY_COLORS[w.priority]}`}
                    title={w.name}
                  >
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${STATUS_COLORS[w.status]}`} />
                    {w.name}
                  </button>
                ))}
                {dayWorks.length > 3 && (
                  <span className="text-[10px] text-zinc-400 pl-1">+{dayWorks.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="font-medium">Priority:</span>
        {(["low","medium","high","critical"] as Priority[]).map(p => (
          <span key={p} className={`px-2 py-0.5 rounded ${PRIORITY_COLORS[p]}`}>{p}</span>
        ))}
        <span className="font-medium ml-4">Status:</span>
        {(["blocked","in-progress","done"] as WorkStatus[]).map(s => (
          <span key={s} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[s]}`} />{s}
          </span>
        ))}
      </div>

      {/* Work Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              {editingWork ? "Edit Work" : "New Work"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Assigned To (User ID)</label>
                <input
                  required
                  value={form.assignedTo}
                  onChange={(e) => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                    className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value as WorkStatus }))}
                    className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="blocked">Blocked</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Progress ({form.progress}%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
                  className="mt-1 w-full accent-blue-600"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Due Date</label>
                <input
                  type="date"
                  required
                  value={form.dueDate}
                  onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  {editingWork ? "Save" : "Create"}
                </button>
                {editingWork && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingWork.id)}
                    className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingWork(null); }}
                  className="rounded-md border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
