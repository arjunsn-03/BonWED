"use client";

import { useState, useRef } from "react";

import { addDoc, updateDoc, doc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadPhoto, optionPhotoPath } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { COLLECTIONS } from "@/lib/collections";
import type {
  WeddingOption,
  OptionStatus,
  OptionCategory,
  EventType,
} from "@/lib/types";

interface OptionFormProps {
  eventType: EventType;
  category: OptionCategory;
  existing?: WeddingOption;
  onClose: () => void;
}

const STATUS_OPTIONS: OptionStatus[] = [
  "considering",
  "shortlisted",
  "booked",
  "rejected",
];

export default function OptionForm({
  eventType,
  category,
  existing,
  onClose,
}: OptionFormProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [status, setStatus] = useState<OptionStatus>(
    existing?.status ?? "considering"
  );
  const [cost, setCost] = useState(
    existing?.cost !== null && existing?.cost !== undefined
      ? String(existing.cost)
      : ""
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [link, setLink] = useState(existing?.link ?? "");
  const [rating, setRating] = useState<number>(existing?.rating ?? 0);
  const [contactName, setContactName] = useState(existing?.contact?.name ?? "");
  const [contactPhone, setContactPhone] = useState(
    existing?.contact?.phone ?? ""
  );
  const [contactNotes, setContactNotes] = useState(
    existing?.contact?.notes ?? ""
  );
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setUploading(true);
    setError("");
    try {
      const tempId = existing?.id ?? `temp_${Date.now()}`;
      const urls: string[] = [];
      for (const file of Array.from(e.target.files)) {
        const path = optionPhotoPath(tempId, file.name);
        const url = await uploadPhoto(file, path);
        urls.push(url);
      }
      setPhotos((prev) => [...prev, ...urls]);
    } catch {
      setError("Failed to upload photo(s). Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setSaving(true);
    setError("");

    const hasContact = contactName || contactPhone;
    const data: Omit<WeddingOption, "id"> = {
      eventType,
      category,
      title: title.trim(),
      status,
      photos,
      cost: cost.trim() ? parseFloat(cost) : null,
      contact: hasContact
        ? {
            name: contactName,
            phone: contactPhone,
            notes: contactNotes,
          }
        : null,
      link: link.trim() || null,
      notes: notes.trim(),
      rating: rating > 0 ? rating : null,
      isFinal: existing?.isFinal ?? false,
      createdBy: existing?.createdBy ?? user.uid,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    try {
      if (existing) {
        await updateDoc(doc(db, COLLECTIONS.options, existing.id), data);
      } else {
        await addDoc(collection(db, COLLECTIONS.options), data);
      }
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900">
            {existing ? "Edit Option" : "Add Option"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Sunset Gardens"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OptionStatus)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className={`text-2xl transition-colors ${
                    star <= rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost (₹)
            </label>
            <input
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="e.g. 150000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link (Instagram / website / maps)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {/* Contact */}
          <div className="border border-gray-200 rounded-xl p-3 space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Contact (optional)
            </p>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Phone number"
              type="tel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <textarea
              value={contactNotes}
              onChange={(e) => setContactNotes(e.target.value)}
              placeholder="Notes about contact…"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes…"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {photos.map((url, i) => (
                <div key={i} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
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
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-pink-300 hover:text-pink-500 transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "+ Add Photos"}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || uploading || !title.trim()}
            className="w-full bg-pink-600 text-white rounded-xl py-3 font-medium text-sm disabled:opacity-50 hover:bg-pink-700 transition-colors"
          >
            {saving ? "Saving…" : existing ? "Save Changes" : "Add Option"}
          </button>
        </form>
      </div>
    </div>
  );
}
