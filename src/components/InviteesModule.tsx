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
import type { Guest, GuestSide, RsvpStatus, EventType } from "@/lib/types";

const SIDE_LABELS: Record<GuestSide, string> = {
  bride: "Bride's side",
  groom: "Groom's side",
  family: "Family",
  friends: "Friends",
};

const RSVP_STYLES: Record<RsvpStatus, string> = {
  pending: "bg-gray-100 text-gray-600",
  attending: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-600",
  maybe: "bg-yellow-100 text-yellow-700",
};

interface GuestFormData {
  name: string;
  phone: string;
  side: GuestSide;
  rsvpStatus: RsvpStatus;
  plusOnes: number;
  notes: string;
}

const DEFAULT_FORM: GuestFormData = {
  name: "",
  phone: "",
  side: "family",
  rsvpStatus: "pending",
  plusOnes: 0,
  notes: "",
};

interface InviteesModuleProps {
  eventType: EventType;
}

export default function InviteesModule({ eventType }: InviteesModuleProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState<GuestFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterSide, setFilterSide] = useState<"all" | GuestSide>("all");
  const [filterRsvp, setFilterRsvp] = useState<"all" | RsvpStatus>("all");
  const [search, setSearch] = useState("");

  const { data: guests, loading } = useFirestoreCollection<Guest>(
    COLLECTIONS.guests,
    [where("eventType", "==", eventType)]
  );

  const filtered = guests.filter((g) => {
    if (filterSide !== "all" && g.side !== filterSide) return false;
    if (filterRsvp !== "all" && g.rsvpStatus !== filterRsvp) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const totalPlusOnes = guests.reduce((sum, g) => sum + g.plusOnes, 0);
  const attendingCount = guests.filter((g) => g.rsvpStatus === "attending").length;

  function openAdd() {
    setEditingGuest(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEdit(guest: Guest) {
    setEditingGuest(guest);
    setForm({
      name: guest.name,
      phone: guest.phone,
      side: guest.side,
      rsvpStatus: guest.rsvpStatus,
      plusOnes: guest.plusOnes,
      notes: guest.notes,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!user || !form.name.trim()) return;
    setSaving(true);
    const data: Omit<Guest, "id"> = {
      eventType,
      name: form.name.trim(),
      phone: form.phone.trim(),
      side: form.side,
      rsvpStatus: form.rsvpStatus,
      plusOnes: form.plusOnes,
      notes: form.notes.trim(),
      createdBy: editingGuest?.createdBy ?? user.uid,
      createdAt: editingGuest?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    try {
      if (editingGuest) {
        await updateDoc(doc(db, COLLECTIONS.guests, editingGuest.id), data);
      } else {
        await addDoc(collection(db, COLLECTIONS.guests), data);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(guestId: string) {
    setDeletingId(guestId);
    try {
      await deleteDoc(doc(db, COLLECTIONS.guests, guestId));
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  async function updateRsvp(guest: Guest, rsvp: RsvpStatus) {
    // eslint-disable-next-line react-hooks/purity
    const ts = Date.now();
    await updateDoc(doc(db, COLLECTIONS.guests, guest.id), {
      rsvpStatus: rsvp,
      updatedAt: ts,
    });
  }

  function exportCSV() {
    const header = "Name,Phone,Side,RSVP,Plus Ones,Notes\n";
    const rows = guests
      .map(
        (g) =>
          `"${g.name}","${g.phone}","${g.side}","${g.rsvpStatus}",${g.plusOnes},"${g.notes}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `guests_${eventType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Invitees</h1>
          <p className="text-xs text-gray-400">
            {guests.length} guests ({attendingCount} attending · {totalPlusOnes} +1s)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="border border-gray-300 text-gray-600 rounded-full px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
          >
            CSV
          </button>
          <button
            onClick={openAdd}
            className="bg-pink-600 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-pink-700 transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guests…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(["all", "bride", "groom", "family", "friends"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSide(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                filterSide === s
                  ? "bg-pink-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {s === "all" ? "All sides" : SIDE_LABELS[s as GuestSide]}
            </button>
          ))}
          <div className="w-px bg-gray-200 mx-1 shrink-0" />
          {(["all", "attending", "pending", "maybe", "declined"] as const).map(
            (r) => (
              <button
                key={r}
                onClick={() => setFilterRsvp(r)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                  filterRsvp === r
                    ? "bg-gray-700 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {r === "all" ? "All RSVP" : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Guest List */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-sm">
              {guests.length === 0
                ? "No guests added yet — tap + to add one"
                : "No guests match your filters"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((guest) => (
              <div
                key={guest.id}
                className="bg-white rounded-xl border border-gray-200 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-gray-900">
                        {guest.name}
                      </p>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                        {SIDE_LABELS[guest.side]}
                      </span>
                      {guest.plusOnes > 0 && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                          +{guest.plusOnes}
                        </span>
                      )}
                    </div>
                    {guest.phone && (
                      <a
                        href={`tel:${guest.phone}`}
                        className="text-xs text-gray-400 mt-0.5 block"
                      >
                        {guest.phone}
                      </a>
                    )}
                    {guest.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {guest.notes}
                      </p>
                    )}
                  </div>

                  {/* RSVP selector */}
                  <div className="flex flex-col items-end gap-1">
                    <select
                      value={guest.rsvpStatus}
                      onChange={(e) =>
                        updateRsvp(guest, e.target.value as RsvpStatus)
                      }
                      className={`text-[10px] font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${
                        RSVP_STYLES[guest.rsvpStatus]
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="attending">Attending</option>
                      <option value="maybe">Maybe</option>
                      <option value="declined">Declined</option>
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(guest)}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(guest.id)}
                        className="text-gray-400 hover:text-red-500 text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guest Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">
                {editingGuest ? "Edit Guest" : "Add Guest"}
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
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Full name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="+91 98765 43210"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Side
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["bride", "groom", "family", "friends"] as GuestSide[]).map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, side: s }))}
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          form.side === s
                            ? "bg-pink-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {SIDE_LABELS[s]}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RSVP Status
                </label>
                <select
                  value={form.rsvpStatus}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      rsvpStatus: e.target.value as RsvpStatus,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="pending">Pending</option>
                  <option value="attending">Attending</option>
                  <option value="maybe">Maybe</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plus Ones
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.plusOnes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      plusOnes: parseInt(e.target.value) || 0,
                    }))
                  }
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
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="w-full bg-pink-600 text-white rounded-xl py-3 font-medium text-sm disabled:opacity-50 hover:bg-pink-700"
              >
                {saving ? "Saving…" : editingGuest ? "Save Changes" : "Add Guest"}
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
              Remove this guest? This cannot be undone.
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
                {deletingId ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
