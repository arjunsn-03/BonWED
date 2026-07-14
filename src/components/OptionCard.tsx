"use client";


import type { WeddingOption, OptionStatus } from "@/lib/types";

const STATUS_STYLES: Record<OptionStatus, string> = {
  considering: "bg-yellow-100 text-yellow-800",
  shortlisted: "bg-blue-100 text-blue-800",
  booked: "bg-green-100 text-green-800",
  rejected: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<OptionStatus, string> = {
  considering: "Considering",
  shortlisted: "Shortlisted",
  booked: "Booked ✅",
  rejected: "Rejected",
};

interface OptionCardProps {
  option: WeddingOption;
  onClick: () => void;
}

export default function OptionCard({ option, onClick }: OptionCardProps) {
  const thumb = option.photos[0];

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden text-left w-full hover:shadow-md transition-shadow active:scale-[0.98]"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-[4/3] bg-gray-100">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={option.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300 text-3xl">
            📷
          </div>
        )}
        {option.isFinal && (
          <div className="absolute top-2 right-2 bg-pink-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            Final ✓
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="font-semibold text-sm text-gray-900 truncate">
          {option.title}
        </p>

        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              STATUS_STYLES[option.status]
            }`}
          >
            {STATUS_LABELS[option.status]}
          </span>

          {option.cost !== null && (
            <span className="text-xs text-gray-500 font-medium">
              ₹{option.cost.toLocaleString()}
            </span>
          )}
        </div>

        {option.rating !== null && (
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-xs ${
                  i < (option.rating ?? 0) ? "text-yellow-400" : "text-gray-200"
                }`}
              >
                ★
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
