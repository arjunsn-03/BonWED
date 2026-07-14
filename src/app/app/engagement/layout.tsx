"use client";

import EventSubNav from "@/components/EventSubNav";

export default function EngagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-0">
        <h1 className="text-lg font-bold text-pink-700 mb-2">💍 Engagement</h1>
      </div>
      <EventSubNav eventType="engagement" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
