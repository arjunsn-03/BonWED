"use client";

import { useState } from "react";
import { where } from "firebase/firestore";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { COLLECTIONS } from "@/lib/collections";
import type {
  WeddingOption,
  OptionCategory,
  OptionStatus,
  EventType,
} from "@/lib/types";
import OptionCard from "./OptionCard";
import OptionForm from "./OptionForm";
import OptionDetail from "./OptionDetail";

interface OptionsPageProps {
  eventType: EventType;
  category: OptionCategory;
  title: string;
  emptyMessage?: string;
}

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "considering", label: "Considering" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "booked", label: "Booked" },
  { value: "rejected", label: "Rejected" },
] as const;

export default function OptionsPage({
  eventType,
  category,
  title,
  emptyMessage,
}: OptionsPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedOption, setSelectedOption] = useState<WeddingOption | null>(null);
  const [filter, setFilter] = useState<"all" | OptionStatus>("all");

  const { data: options, loading } = useFirestoreCollection<WeddingOption>(
    COLLECTIONS.options,
    [where("eventType", "==", eventType), where("category", "==", category)]
  );

  const filtered =
    filter === "all" ? options : options.filter((o) => o.status === filter);

  const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-pink-600 text-white rounded-full px-4 py-2 text-sm font-medium hover:bg-pink-700 transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Filter Strip */}
      <div className="bg-white border-b border-gray-100 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-4 py-2 min-w-max">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as typeof filter)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-pink-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
              {f.value !== "all" && (
                <span className="ml-1 opacity-70">
                  ({options.filter((o) => o.status === f.value).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-sm">
              {emptyMessage ?? `No ${title.toLowerCase()} added yet — tap + to add one`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sorted.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                onClick={() => setSelectedOption(option)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <OptionForm
          eventType={eventType}
          category={category}
          onClose={() => setShowForm(false)}
        />
      )}

      {selectedOption && (
        <OptionDetail
          option={selectedOption}
          allInCategory={options}
          onClose={() => setSelectedOption(null)}
        />
      )}
    </div>
  );
}
