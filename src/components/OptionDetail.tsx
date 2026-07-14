"use client";

import { useState } from "react";

import {
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";
import type { WeddingOption } from "@/lib/types";
import OptionForm from "./OptionForm";

interface OptionDetailProps {
  option: WeddingOption;
  allInCategory: WeddingOption[];
  onClose: () => void;
}

export default function OptionDetail({
  option,
  allInCategory,
  onClose,
}: OptionDetailProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [actioning, setActioning] = useState(false);

  if (editing) {
    return (
      <OptionForm
        eventType={option.eventType}
        category={option.category}
        existing={option}
        onClose={() => {
          setEditing(false);
          onClose();
        }}
      />
    );
  }

  async function handleMarkFinal() {
    if (actioning) return;
    setActioning(true);
    try {
      // Un-mark any previous final in this category
      for (const o of allInCategory) {
        if (o.isFinal && o.id !== option.id) {
          await updateDoc(doc(db, COLLECTIONS.options, o.id), {
            isFinal: false,
            updatedAt: Date.now(),
          });
        }
      }
      await updateDoc(doc(db, COLLECTIONS.options, option.id), {
        isFinal: !option.isFinal,
        updatedAt: Date.now(),
      });
      onClose();
    } finally {
      setActioning(false);
    }
  }

  async function handleDelete() {
    if (actioning) return;
    setActioning(true);
    try {
      await deleteDoc(doc(db, COLLECTIONS.options, option.id));
      onClose();
    } finally {
      setActioning(false);
    }
  }

  const statusColors: Record<string, string> = {
    considering: "bg-yellow-100 text-yellow-800",
    shortlisted: "bg-blue-100 text-blue-800",
    booked: "bg-green-100 text-green-800",
    rejected: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900 truncate pr-4">{option.title}</h2>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">✕</button>
        </div>

        {/* Photo Carousel */}
        {option.photos.length > 0 && (
          <div className="relative w-full aspect-[4/3] bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={option.photos[currentPhotoIdx]}
              alt={`${option.title} photo ${currentPhotoIdx + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {option.photos.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentPhotoIdx((i) =>
                      i === 0 ? option.photos.length - 1 : i - 1
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setCurrentPhotoIdx((i) =>
                      i === option.photos.length - 1 ? 0 : i + 1
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center"
                >
                  ›
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {option.photos.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i === currentPhotoIdx ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Status + Final badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                statusColors[option.status]
              }`}
            >
              {option.status.charAt(0).toUpperCase() + option.status.slice(1)}
            </span>
            {option.isFinal && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-pink-100 text-pink-700">
                Final Pick ✓
              </span>
            )}
            {option.rating !== null && (
              <span className="text-sm">
                {"★".repeat(option.rating)}
                {"☆".repeat(5 - (option.rating ?? 0))}
              </span>
            )}
          </div>

          {/* Cost */}
          {option.cost !== null && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Cost:</span>
              <span className="text-sm font-semibold text-gray-900">
                ₹{option.cost.toLocaleString()}
              </span>
            </div>
          )}

          {/* Link */}
          {option.link && (
            <a
              href={option.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-pink-600 underline break-all"
            >
              🔗 {option.link}
            </a>
          )}

          {/* Contact */}
          {option.contact && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Contact
              </p>
              {option.contact.name && (
                <p className="text-sm font-medium text-gray-900">
                  {option.contact.name}
                </p>
              )}
              {option.contact.phone && (
                <a
                  href={`tel:${option.contact.phone}`}
                  className="text-sm text-pink-600"
                >
                  {option.contact.phone}
                </a>
              )}
              {option.contact.notes && (
                <p className="text-sm text-gray-600">{option.contact.notes}</p>
              )}
            </div>
          )}

          {/* Notes */}
          {option.notes && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {option.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => setEditing(true)}
              className="border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ✏️ Edit
            </button>
            <button
              onClick={handleMarkFinal}
              disabled={actioning}
              className={`rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                option.isFinal
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-pink-600 text-white hover:bg-pink-700"
              }`}
            >
              {option.isFinal ? "Unmark Final" : "Mark as Final"}
            </button>
          </div>

          {/* Delete */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full text-sm text-red-500 hover:text-red-700 py-1"
            >
              Delete option
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
              <p className="text-sm text-red-700 font-medium text-center">
                Delete &ldquo;{option.title}&rdquo;? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actioning}
                  className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
                >
                  {actioning ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
