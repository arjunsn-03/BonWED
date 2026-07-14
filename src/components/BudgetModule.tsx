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
import type { BudgetEntry, WeddingOption, EventType } from "@/lib/types";

interface BudgetFormData {
  label: string;
  category: string;
  planned: string;
  actual: string;
  notes: string;
}

const DEFAULT_FORM: BudgetFormData = {
  label: "",
  category: "",
  planned: "",
  actual: "",
  notes: "",
};

interface BudgetModuleProps {
  eventType: EventType;
}

export default function BudgetModule({ eventType }: BudgetModuleProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);
  const [form, setForm] = useState<BudgetFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Manual budget entries
  const { data: entries, loading: entriesLoading } =
    useFirestoreCollection<BudgetEntry>(COLLECTIONS.budgetEntries, [
      where("eventType", "==", eventType),
    ]);

  // Auto-calculate from booked options
  const { data: bookedOptions, loading: optionsLoading } =
    useFirestoreCollection<WeddingOption>(COLLECTIONS.options, [
      where("eventType", "==", eventType),
      where("status", "==", "booked"),
    ]);

  const loading = entriesLoading || optionsLoading;

  // Sum of manual entries
  const manualPlanned = entries.reduce(
    (sum, e) => sum + (parseFloat(String(e.planned)) || 0),
    0
  );
  const manualActual = entries.reduce(
    (sum, e) => sum + (parseFloat(String(e.actual)) || 0),
    0
  );

  // Sum from booked options (auto)
  const autoActual = bookedOptions.reduce(
    (sum, o) => sum + (o.cost ?? 0),
    0
  );

  const totalPlanned = manualPlanned;
  const totalActual = manualActual + autoActual;

  function openAdd() {
    setEditingEntry(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEdit(entry: BudgetEntry) {
    setEditingEntry(entry);
    setForm({
      label: entry.label,
      category: entry.category,
      planned: String(entry.planned),
      actual: String(entry.actual),
      notes: entry.notes,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!user || !form.label.trim()) return;
    setSaving(true);
    const data: Omit<BudgetEntry, "id"> = {
      eventType,
      label: form.label.trim(),
      category: form.category.trim(),
      planned: parseFloat(form.planned) || 0,
      actual: parseFloat(form.actual) || 0,
      notes: form.notes.trim(),
      createdBy: editingEntry?.createdBy ?? user.uid,
      createdAt: editingEntry?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    try {
      if (editingEntry) {
        await updateDoc(
          doc(db, COLLECTIONS.budgetEntries, editingEntry.id),
          data
        );
      } else {
        await addDoc(collection(db, COLLECTIONS.budgetEntries), data);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId: string) {
    setDeletingId(entryId);
    try {
      await deleteDoc(doc(db, COLLECTIONS.budgetEntries, entryId));
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Budget</h1>
        <button
          onClick={openAdd}
          className="bg-pink-600 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-pink-700 transition-colors"
        >
          + Add Entry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="p-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Planned</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            ₹{totalPlanned.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Spent / Committed</p>
          <p
            className={`text-xl font-bold mt-1 ${
              totalActual > totalPlanned && totalPlanned > 0
                ? "text-red-600"
                : "text-gray-900"
            }`}
          >
            ₹{totalActual.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-gray-500">From booked options</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            ₹{autoActual.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {bookedOptions.length} booked items
          </p>
        </div>
      </div>

      {/* Auto-generated from booked options */}
      {bookedOptions.length > 0 && (
        <div className="px-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            From Booked Options
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {bookedOptions.map((opt) => (
              <div
                key={opt.id}
                className="px-3 py-2.5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-900 font-medium">{opt.title}</p>
                  <p className="text-xs text-gray-400 capitalize">
                    {opt.category}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {opt.cost !== null ? `₹${opt.cost.toLocaleString()}` : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Entries */}
      <div className="px-4 pb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Manual Entries
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">
              No manual entries — tap + to add one
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {sorted.map((entry) => (
              <div key={entry.id} className="px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.label}
                    </p>
                    {entry.category && (
                      <p className="text-xs text-gray-400">{entry.category}</p>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      ₹{entry.actual.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      of ₹{entry.planned.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => openEdit(entry)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(entry.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">
                {editingEntry ? "Edit Entry" : "Add Budget Entry"}
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
                  Label *
                </label>
                <input
                  value={form.label}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, label: e.target.value }))
                  }
                  placeholder="e.g. Florist deposit"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  placeholder="e.g. Decoration"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.planned}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, planned: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actual (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.actual}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, actual: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
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
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !form.label.trim()}
                className="w-full bg-pink-600 text-white rounded-xl py-3 font-medium text-sm disabled:opacity-50 hover:bg-pink-700"
              >
                {saving ? "Saving…" : editingEntry ? "Save Changes" : "Add Entry"}
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
              Delete this budget entry? This cannot be undone.
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
