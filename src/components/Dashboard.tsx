"use client";

import Link from "next/link";

import { where } from "firebase/firestore";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useFirestoreDoc } from "@/hooks/useFirestoreDoc";
import { COLLECTIONS, SETTINGS_DOC_ID } from "@/lib/collections";
import { useAuth } from "@/context/AuthContext";
import type {
  WeddingOption,
  Task,
  AppSettings,
} from "@/lib/types";

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Not set";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const OPTION_CATEGORIES = [
  { key: "venue", label: "Venue", icon: "🏛️" },
  { key: "clothing", label: "Clothing", icon: "👗" },
  { key: "makeup", label: "Makeup", icon: "💄" },
  { key: "invitations", label: "Invitations", icon: "✉️" },
  { key: "accommodation", label: "Accommodation", icon: "🏨" },
  { key: "vendor", label: "Vendors", icon: "📦" },
] as const;

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: settings } = useFirestoreDoc<AppSettings>(
    COLLECTIONS.settings,
    SETTINGS_DOC_ID
  );

  // All options (for "decided so far" summary)
  const { data: allOptions } = useFirestoreCollection<WeddingOption>(
    COLLECTIONS.options
  );

  // Pending tasks (not done, due soon)
  const { data: pendingTasks } = useFirestoreCollection<Task>(
    COLLECTIONS.tasks,
    [where("done", "==", false)]
  );

  // Recent photos — collect all options with photos
  const recentPhotos: string[] = [];
  const sortedByTime = [...allOptions].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const opt of sortedByTime) {
    for (const url of opt.photos) {
      recentPhotos.push(url);
      if (recentPhotos.length >= 6) break;
    }
    if (recentPhotos.length >= 6) break;
  }

  const engDays = daysUntil(settings?.engagementDate);
  const marDays = daysUntil(settings?.marriageDate);

  const dueSoonTasks = [...pendingTasks]
    .filter((t) => t.dueDate)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 5);

  // Budget total
  const bookedOptions = allOptions.filter((o) => o.status === "booked");
  const totalBudget = bookedOptions.reduce((sum, o) => sum + (o.cost ?? 0), 0);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-8">
      {/* Greeting */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-gray-900">
          Hello{profile?.displayName ? `, ${profile.displayName}` : ""} 👋
        </h1>
        <p className="text-sm text-gray-500">Your wedding planner</p>
      </div>

      {/* Countdown Cards */}
      <div className="grid grid-cols-2 gap-3">
        <CountdownCard
          label="Engagement"
          date={formatDate(settings?.engagementDate)}
          days={engDays}
          color="bg-pink-50 border-pink-200"
          icon="💍"
        />
        <CountdownCard
          label="Marriage"
          date={formatDate(settings?.marriageDate)}
          days={marDays}
          color="bg-rose-50 border-rose-200"
          icon="💒"
        />
      </div>

      {/* Decided So Far */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Decided So Far
        </h2>
        <div className="space-y-2">
          {(["engagement", "marriage"] as const).map((evt) => (
            <div key={evt} className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {evt.charAt(0).toUpperCase() + evt.slice(1)}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {OPTION_CATEGORIES.map(({ key, label, icon }) => {
                  const finalOpt = allOptions.find(
                    (o) =>
                      o.eventType === evt &&
                      o.category === key &&
                      o.isFinal
                  );
                  const hasAny = allOptions.some(
                    (o) => o.eventType === evt && o.category === key
                  );
                  return (
                    <Link
                      key={key}
                      href={`/app/${evt}/${key === "vendor" ? "vendors" : key}`}
                      className="bg-gray-50 rounded-lg p-2 text-center"
                    >
                      <div className="text-lg">{icon}</div>
                      <div className="text-[10px] font-medium text-gray-700 truncate">
                        {label}
                      </div>
                      <div className="text-[10px] mt-0.5">
                        {finalOpt ? (
                          <span className="text-green-600">✅</span>
                        ) : hasAny ? (
                          <span className="text-yellow-500">⏳</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Tasks */}
      {dueSoonTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">
              Pending Tasks
            </h2>
            <Link
              href="/app/engagement/tasks"
              className="text-xs text-pink-600"
            >
              View all →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {dueSoonTasks.map((task) => (
              <div key={task.id} className="px-3 py-2.5 flex items-start gap-2">
                <span
                  className={`mt-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    task.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : task.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {task.priority}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{task.title}</p>
                  {task.dueDate && (
                    <p className="text-xs text-gray-400">
                      Due{" "}
                      {new Date(task.dueDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  )}
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">
                  {task.eventType.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Summary */}
      {totalBudget > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">
            Budget Committed
          </h2>
          <p className="text-2xl font-bold text-pink-700">
            ₹{totalBudget.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            From {bookedOptions.length} booked items
          </p>
        </div>
      )}

      {/* Recent Photos */}
      {recentPhotos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">
              Recent Photos
            </h2>
            <Link href="/app/gallery" className="text-xs text-pink-600">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {recentPhotos.slice(0, 6).map((url, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Recent photo ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CountdownCard({
  label,
  date,
  days,
  color,
  icon,
}: {
  label: string;
  date: string;
  days: number | null;
  color: string;
  icon: string;
}) {
  return (
    <div className={`rounded-xl border p-3 ${color}`}>
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{date}</p>
      {days !== null ? (
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {days > 0 ? days : days === 0 ? "Today!" : Math.abs(days)}
          {days !== 0 && (
            <span className="text-xs font-normal text-gray-500 ml-1">
              {days > 0 ? "days to go" : "days ago"}
            </span>
          )}
        </p>
      ) : (
        <p className="text-xs text-gray-400 mt-1">Date not set</p>
      )}
    </div>
  );
}
