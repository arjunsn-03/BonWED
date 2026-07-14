"use client";

import { useState } from "react";

// where is not used directly (no constraints in these queries)
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { COLLECTIONS } from "@/lib/collections";
import type {
  WeddingOption,
  OptionCategory,
  EventType,
  ScheduleItem,
} from "@/lib/types";

type FilterEvent = "all" | EventType;
type FilterCategory = "all" | OptionCategory | "schedule";

const EVENT_OPTIONS: { value: FilterEvent; label: string }[] = [
  { value: "all", label: "All Events" },
  { value: "engagement", label: "Engagement" },
  { value: "marriage", label: "Marriage" },
];

const CATEGORY_OPTIONS: { value: FilterCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "venue", label: "Venue" },
  { value: "clothing", label: "Clothing" },
  { value: "makeup", label: "Makeup" },
  { value: "invitations", label: "Invitations" },
  { value: "accommodation", label: "Accommodation" },
  { value: "vendor", label: "Vendors" },
  { value: "schedule", label: "Schedule" },
];

interface PhotoItem {
  url: string;
  eventType: EventType;
  category: string;
  title: string;
}

export default function GalleryPage() {
  const [filterEvent, setFilterEvent] = useState<FilterEvent>("all");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: options } = useFirestoreCollection<WeddingOption>(
    COLLECTIONS.options
  );
  const { data: scheduleItems } = useFirestoreCollection<ScheduleItem>(
    COLLECTIONS.scheduleItems
  );

  // Collect all photos
  const allPhotos: PhotoItem[] = [];

  for (const opt of options) {
    for (const url of opt.photos) {
      allPhotos.push({
        url,
        eventType: opt.eventType,
        category: opt.category,
        title: opt.title,
      });
    }
  }

  for (const item of scheduleItems) {
    for (const url of item.photos ?? []) {
      allPhotos.push({
        url,
        eventType: item.eventType,
        category: "schedule",
        title: item.title,
      });
    }
  }

  // Apply filters
  const filtered = allPhotos.filter((p) => {
    if (filterEvent !== "all" && p.eventType !== filterEvent) return false;
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    return true;
  });

  function openLightbox(url: string) {
    const idx = filtered.findIndex((p) => p.url === url);
    setLightboxUrl(url);
    setLightboxIndex(idx);
  }

  function prevPhoto() {
    const newIdx = lightboxIndex === 0 ? filtered.length - 1 : lightboxIndex - 1;
    setLightboxIndex(newIdx);
    setLightboxUrl(filtered[newIdx].url);
  }

  function nextPhoto() {
    const newIdx = lightboxIndex === filtered.length - 1 ? 0 : lightboxIndex + 1;
    setLightboxIndex(newIdx);
    setLightboxUrl(filtered[newIdx].url);
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-lg font-bold text-gray-900">Gallery</h1>
        <p className="text-xs text-gray-400">{filtered.length} photos</p>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {EVENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterEvent(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                filterEvent === opt.value
                  ? "bg-pink-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterCategory(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                filterCategory === opt.value
                  ? "bg-gray-700 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Photo Grid */}
      <div className="p-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🖼️</div>
            <p className="text-sm">No photos yet — add photos to your options</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
            {filtered.map((photo, i) => (
              <button
                key={i}
                onClick={() => openLightbox(photo.url)}
                className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1">
                  <p className="text-white text-[9px] truncate">{photo.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative w-full max-w-2xl max-h-screen p-4">
            <div
              className="relative aspect-square md:aspect-[4/3] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl}
                alt="Full size"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Controls */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
            >
              ›
            </button>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-6 right-6 bg-white/20 hover:bg-white/40 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
            >
              ✕
            </button>

            {/* Caption */}
            {filtered[lightboxIndex] && (
              <div className="text-center mt-2">
                <p className="text-white text-sm font-medium">
                  {filtered[lightboxIndex].title}
                </p>
                <p className="text-gray-400 text-xs capitalize">
                  {filtered[lightboxIndex].eventType} ·{" "}
                  {filtered[lightboxIndex].category}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
