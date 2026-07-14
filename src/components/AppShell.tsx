"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: "🏠" },
  { href: "/app/engagement", label: "Engagement", icon: "💍" },
  { href: "/app/marriage", label: "Marriage", icon: "💒" },
  { href: "/app/gallery", label: "Gallery", icon: "🖼️" },
  { href: "/app/settings", label: "Settings", icon: "⚙️" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 shrink-0">
        <div className="px-5 py-6 border-b border-gray-100">
          <div className="text-2xl font-bold text-pink-700">💍 Wedding</div>
          <div className="text-xs text-gray-400 mt-0.5">Family Planner</div>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-pink-50 text-pink-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* ── Mobile Bottom Tab Bar ────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex safe-bottom z-50">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
              isActive(item.href) ? "text-pink-700" : "text-gray-400"
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px]">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
