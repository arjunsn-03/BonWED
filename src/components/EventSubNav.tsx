"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { EventType } from "@/lib/types";

export const EVENT_SUB_TABS = [
  { key: "venue", label: "Venue" },
  { key: "schedule", label: "Schedule" },
  { key: "tasks", label: "Tasks" },
  { key: "clothing", label: "Clothing" },
  { key: "makeup", label: "Makeup" },
  { key: "invitations", label: "Invitations" },
  { key: "invitees", label: "Invitees" },
  { key: "accommodation", label: "Accommodation" },
  { key: "budget", label: "Budget" },
  { key: "vendors", label: "Vendors" },
] as const;

interface EventSubNavProps {
  eventType: EventType;
}

export default function EventSubNav({ eventType }: EventSubNavProps) {
  const pathname = usePathname();
  const base = `/app/${eventType}`;

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {EVENT_SUB_TABS.map((tab) => {
            const href = `${base}/${tab.key}`;
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={tab.key}
                href={href}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-pink-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
