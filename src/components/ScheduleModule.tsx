"use client";

import { useState, useRef } from "react";

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
import { uploadPhoto, schedulePhotoPath } from "@/lib/storage";
import type { ScheduleItem, EventType } from "@/lib/types";

interface ScheduleFormData {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

const DEFAULT_FORM: ScheduleFormData = {
  title: "",
  date: "",
  time: "",
  location: "",
  description: "",
};

interface ScheduleModuleProps {
  eventType: EventType;
}

export default function ScheduleModule({ eventType }: ScheduleModuleProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState<ScheduleFormData>(DEFAULT_FORM);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: items, loading } = useFirestoreCollection<ScheduleItem>(
    COLLECTIONS.scheduleItems,
    [where("eventType", "==", eventType)]
  );

  const sorted = [...items].sort((a, b) => {
    const aKey = `${a.date}T${a.time}`;
    const bKey = `${b.date}T${b.time}`;
    return aKey.localeCompare(bKey);
  });

  // Group by date
  const grouped: Record<string, ScheduleItem[]> = {};
  for (const item of sorted) {
    const key = item.date || "No date";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  function openAdd() {
    setEditingItem(null);
    setForm(DEFAULT_FORM);
    setPhotos([]);
    setShowForm(true);
  }

  function openEdit(item: ScheduleItem) {
    setEditingItem(item);
    setForm({
      title: item.title,
      date: item.date,
      time: item.time,
      location: item.location,
      description: item.description,
    });
    setPhotos(item.photos ?? []);
    setShowForm(true);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      const tempId = editingItem?.id ?? `temp_${Date.now()}`;
      const urls: string[] = [];
      for (const file of Array.from(e.target.files)) {
        const path = schedulePhotoPath(tempId, file.name);
        const url = await uploadPhoto(file, path);
        urls.push(url);
      }
      setPhotos((prev) => [...prev, ...urls]);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!user || !form.title.trim()) return;
    setSaving(true);
    const data: Omit<ScheduleItem, "id"> = {
      eventType,
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      location: form.location.trim(),
      description: form.description.trim(),
      photos,
      createdBy: editingItem?.createdBy ?? user.uid,
      createdAt: editingItem?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    try {
      if (editingItem) {
        await updateDoc(
          doc(db, COLLECTIONS.scheduleItems, editingItem.id),
          data
        );
      } else {
        await addDoc(collection(db, COLLECTIONS.scheduleItems), data);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId);
    try {
      await deleteDoc(doc(db, COLLECTIONS.scheduleItems, itemId));
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "No date";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Schedule</h1>
        <button
          onClick={openAdd}
          className="bg-pink-600 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-pink-700 transition-colors"
        >
          + Add Event
        </button>
      </div>

      {/* Timeline */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-sm">No schedule events yet — tap + to add one</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dateItems]) => (
              <div key={date}>
                <h2 className="text-sm font-semibold text-pink-700 mb-3 flex items-center gap-2">
                  <span className="flex-1 border-t border-pink-200" />
                  {formatDate(date)}
                  <span className="flex-1 border-t border-pink-200" />
                </h2>
                <div className="space-y-2 relative pl-5">
                  {/* Timeline line */}
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />

                  {dateItems.map((item) => (
                    <div key={item.id} className="relative">
                      {/* Dot */}
                      <div className="absolute -left-[13px] top-3 w-2.5 h-2.5 rounded-full bg-pink-400 border-2 border-white" />

                      <div className="bg-white rounded-xl border border-gray-200 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {item.time && (
                                <span className="text-xs font-bold text-pink-600">
                                  {item.time}
                                </span>
                              )}
                              <p className="font-medium text-sm text-gray-900">
                                {item.title}
                              </p>
                            </div>
                            {item.location && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                📍 {item.location}
                              </p>
                            )}
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => openEdit(item)}
                              className="text-gray-400 hover:text-gray-600 text-sm px-1"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(item.id)}
                              className="text-gray-400 hover:text-red-500 text-sm px-1"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Photos strip */}
                        {item.photos && item.photos.length > 0 && (
                          <div className="flex gap-1 mt-2 overflow-x-auto no-scrollbar">
                            {item.photos.map((url, i) => (
                              <div
                                key={i}
                                className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt=""
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">
                {editingItem ? "Edit Event" : "Add Schedule Event"}
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
                  placeholder="e.g. Mehendi ceremony"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, time: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="e.g. Mandap Hall, Ground Floor"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Photos
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {photos.map((url, i) => (
                    <div
                      key={i}
                      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl py-2.5 text-sm text-gray-500 hover:border-pink-300 hover:text-pink-500 transition-colors disabled:opacity-50"
                >
                  {uploading ? "Uploading…" : "+ Add Photos"}
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || uploading || !form.title.trim()}
                className="w-full bg-pink-600 text-white rounded-xl py-3 font-medium text-sm disabled:opacity-50 hover:bg-pink-700"
              >
                {saving
                  ? "Saving…"
                  : editingItem
                  ? "Save Changes"
                  : "Add Event"}
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
              Delete this schedule event? This cannot be undone.
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
