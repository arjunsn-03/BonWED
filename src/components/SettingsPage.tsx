"use client";

import { useState } from "react";
import {
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, SETTINGS_DOC_ID } from "@/lib/collections";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useFirestoreDoc } from "@/hooks/useFirestoreDoc";
import { useAuth } from "@/context/AuthContext";
import type { AllowedMember, AppSettings } from "@/lib/types";

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const [tab, setTab] = useState<"general" | "members">("general");

  // App settings
  const { data: settings } = useFirestoreDoc<AppSettings>(
    COLLECTIONS.settings,
    SETTINGS_DOC_ID
  );

  // Allowed members
  const { data: members, loading: membersLoading } =
    useFirestoreCollection<AllowedMember>(COLLECTIONS.allowlist);

  // General settings state
  const [engDate, setEngDate] = useState(settings?.engagementDate ?? "");
  const [marDate, setMarDate] = useState(settings?.marriageDate ?? "");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Update state when settings load
  const [initialized, setInitialized] = useState(false);
  if (settings && !initialized) {
    setEngDate(settings.engagementDate ?? "");
    setMarDate(settings.marriageDate ?? "");
    setInitialized(true);
  }

  // Member form
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [savingMember, setSavingMember] = useState(false);
  const [confirmDeleteMemberId, setConfirmDeleteMemberId] = useState<
    string | null
  >(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  async function saveSettings() {
    if (!user) return;
    setSavingSettings(true);
    try {
      const data: AppSettings = {
        engagementDate: engDate || null,
        marriageDate: marDate || null,
        primaryColor: settings?.primaryColor ?? "#be185d",
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, COLLECTIONS.settings, SETTINGS_DOC_ID), data);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } finally {
      setSavingSettings(false);
    }
  }

  async function addMember() {
    if (!user || !memberName.trim() || !memberPhone.trim()) return;
    setSavingMember(true);
    const normalized = memberPhone.trim().replace(/\s+/g, "");
    const docId = normalized.startsWith("+") ? normalized : "+" + normalized;
    const data: AllowedMember = {
      id: docId,
      name: memberName.trim(),
      phone: docId,
      addedAt: Date.now(),
      addedBy: user.uid,
    };
    try {
      await setDoc(doc(db, COLLECTIONS.allowlist, docId), data);
      setMemberName("");
      setMemberPhone("");
      setShowMemberForm(false);
    } finally {
      setSavingMember(false);
    }
  }

  async function deleteMember(memberId: string) {
    setDeletingMemberId(memberId);
    try {
      await deleteDoc(doc(db, COLLECTIONS.allowlist, memberId));
      setConfirmDeleteMemberId(null);
    } finally {
      setDeletingMemberId(null);
    }
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400">{profile?.phone ?? ""}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 flex gap-1 px-4 py-2">
        {(["general", "members"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t
                ? "bg-pink-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {tab === "general" && (
        <div className="p-4 space-y-6 max-w-lg">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Wedding Dates
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Engagement Date
                </label>
                <input
                  type="date"
                  value={engDate}
                  onChange={(e) => setEngDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marriage Date
                </label>
                <input
                  type="date"
                  value={marDate}
                  onChange={(e) => setMarDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="w-full bg-pink-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-pink-700 transition-colors"
              >
                {savingSettings
                  ? "Saving…"
                  : settingsSaved
                  ? "Saved ✓"
                  : "Save Dates"}
              </button>
            </div>
          </div>

          {/* Profile */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Your Profile
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Name</span>
                <span className="text-sm font-medium text-gray-900">
                  {profile?.displayName ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Phone</span>
                <span className="text-sm font-medium text-gray-900">
                  {profile?.phone ?? "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={signOut}
            className="w-full border border-red-300 text-red-600 rounded-xl py-2.5 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Members Management */}
      {tab === "members" && (
        <div className="p-4 max-w-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Allowed Members
            </h2>
            <button
              onClick={() => setShowMemberForm(true)}
              className="bg-pink-600 text-white rounded-full px-3 py-1.5 text-xs font-medium hover:bg-pink-700"
            >
              + Add Member
            </button>
          </div>

          <p className="text-xs text-gray-400 mb-3">
            Only these phone numbers can log in to the app.
          </p>

          {membersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No members added yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="px-3 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.name}
                    </p>
                    <p className="text-xs text-gray-400">{member.phone}</p>
                  </div>
                  <button
                    onClick={() => setConfirmDeleteMemberId(member.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-sm md:rounded-2xl rounded-t-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Add Member</h2>
              <button
                onClick={() => setShowMemberForm(false)}
                className="text-gray-400 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. Mom"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (with country code)
                </label>
                <input
                  type="tel"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
              <button
                onClick={addMember}
                disabled={
                  savingMember || !memberName.trim() || !memberPhone.trim()
                }
                className="w-full bg-pink-600 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50 hover:bg-pink-700"
              >
                {savingMember ? "Adding…" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Confirm */}
      {confirmDeleteMemberId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="text-sm font-medium text-gray-900 text-center mb-4">
              Remove this member? They will no longer be able to log in.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteMemberId(null)}
                className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMember(confirmDeleteMemberId)}
                disabled={!!deletingMemberId}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {deletingMemberId ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
