"use client";

import { useState } from "react";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  collection,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useAuth } from "@/context/AuthContext";
import type { Task, TaskPriority, EventType } from "@/lib/types";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

interface TaskFormData {
  title: string;
  dueDate: string;
  priority: TaskPriority;
  notes: string;
  assigneeName: string;
}

const DEFAULT_FORM: TaskFormData = {
  title: "",
  dueDate: "",
  priority: "medium",
  notes: "",
  assigneeName: "",
};

interface TasksModuleProps {
  eventType: EventType;
}

export default function TasksModule({ eventType }: TasksModuleProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<"all" | TaskPriority>(
    "all"
  );
  const [filterDone, setFilterDone] = useState<"all" | "pending" | "done">(
    "pending"
  );

  const { data: tasks, loading } = useFirestoreCollection<Task>(
    COLLECTIONS.tasks,
    [where("eventType", "==", eventType)]
  );

  const filtered = tasks.filter((t) => {
    if (filterDone === "pending" && t.done) return false;
    if (filterDone === "done" && !t.done) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    // High priority first, then by due date
    const pOrder = { high: 0, medium: 1, low: 2 };
    const pa = pOrder[a.priority];
    const pb = pOrder[b.priority];
    if (pa !== pb) return pa - pb;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt - a.createdAt;
  });

  function openAdd() {
    setEditingTask(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      dueDate: task.dueDate ?? "",
      priority: task.priority,
      notes: task.notes,
      assigneeName: task.assigneeName ?? "",
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!user || !form.title.trim()) return;
    setSaving(true);
    const data: Omit<Task, "id"> = {
      eventType,
      title: form.title.trim(),
      done: editingTask?.done ?? false,
      dueDate: form.dueDate || null,
      assigneeUid: null,
      assigneeName: form.assigneeName.trim() || null,
      priority: form.priority,
      notes: form.notes.trim(),
      createdBy: editingTask?.createdBy ?? user.uid,
      createdAt: editingTask?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    try {
      if (editingTask) {
        await updateDoc(doc(db, COLLECTIONS.tasks, editingTask.id), data);
      } else {
        await addDoc(collection(db, COLLECTIONS.tasks), data);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleDone(task: Task) {
    // eslint-disable-next-line react-hooks/purity
    const ts = Date.now();
    await updateDoc(doc(db, COLLECTIONS.tasks, task.id), {
      done: !task.done,
      updatedAt: ts,
    });
  }

  async function handleDelete(taskId: string) {
    setDeletingId(taskId);
    try {
      await deleteDoc(doc(db, COLLECTIONS.tasks, taskId));
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  const pendingCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Tasks</h1>
          <p className="text-xs text-gray-400">
            {pendingCount} pending · {doneCount} done
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-pink-600 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-pink-700 transition-colors"
        >
          + Add Task
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
        {(["pending", "all", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterDone(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
              filterDone === f
                ? "bg-pink-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="w-px bg-gray-200 mx-1 shrink-0" />
        {(["all", "high", "medium", "low"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
              filterPriority === p
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {p === "all" ? "All priority" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-sm">
              {filterDone === "pending" && tasks.length > 0
                ? "All tasks are done!"
                : "No tasks yet — tap + to add one"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-xl border border-gray-200 p-3 flex items-start gap-3 ${
                  task.done ? "opacity-60" : ""
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleDone(task)}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    task.done
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 hover:border-pink-400"
                  }`}
                >
                  {task.done && <span className="text-xs">✓</span>}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium text-gray-900 ${
                      task.done ? "line-through" : ""
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        PRIORITY_STYLES[task.priority]
                      }`}
                    >
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-[10px] text-gray-400">
                        Due{" "}
                        {new Date(task.dueDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                    {task.assigneeName && (
                      <span className="text-[10px] text-gray-400">
                        👤 {task.assigneeName}
                      </span>
                    )}
                  </div>
                  {task.notes && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {task.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(task)}
                    className="text-gray-400 hover:text-gray-600 text-sm px-1"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(task.id)}
                    className="text-gray-400 hover:text-red-500 text-sm px-1"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">
                {editingTask ? "Edit Task" : "Add Task"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Book caterer"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, priority: p }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        form.priority === p
                          ? PRIORITY_STYLES[p]
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee
                </label>
                <input
                  value={form.assigneeName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assigneeName: e.target.value }))
                  }
                  placeholder="e.g. Mom, Sister"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="w-full bg-pink-600 text-white rounded-xl py-3 font-medium text-sm disabled:opacity-50 hover:bg-pink-700"
              >
                {saving ? "Saving…" : editingTask ? "Save Changes" : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="text-sm font-medium text-gray-900 text-center mb-4">
              Delete this task? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={!!deletingId}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {deletingId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
