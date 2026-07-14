"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check allowlist by phone number if available, otherwise by email
      const phone = user.phoneNumber;
      const email = user.email ?? "";

      // Try phone first, then email as fallback identifier
      let allowed = false;

      if (phone) {
        const normalizedPhone = phone.replace(/\s+/g, "");
        const allowRef = doc(db, COLLECTIONS.allowlist, normalizedPhone);
        const allowSnap = await getDoc(allowRef);
        allowed = allowSnap.exists();
      }

      if (!allowed) {
        // Also check by email (so you can allowlist by email)
        const allowRef = doc(db, COLLECTIONS.allowlist, email);
        const allowSnap = await getDoc(allowRef);
        allowed = allowSnap.exists();
      }

      if (!allowed) {
        await auth.signOut();
        setError("Your Google account isn't on the access list. Contact the app admin.");
        setLoading(false);
        return;
      }

      router.replace("/app");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/popup-closed-by-user") {
        // User dismissed — no error needed
      } else if (code === "auth/popup-blocked") {
        setError("Popup was blocked. Please allow popups for this site.");
      } else {
        setError("Sign in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💍</div>
          <h1 className="text-2xl font-bold text-gray-900">Wedding Planner</h1>
          <p className="text-sm text-gray-500 mt-1">Family access only</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {/* Google logo SVG */}
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5c-7.7 0-14.4 4.4-17.7 9.7z"/>
              <path fill="#4CAF50" d="M24 45c5 0 9.5-1.9 12.9-5l-6-4.9C29.3 36.6 26.8 37.5 24 37.5c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.4 40.5 16.2 45 24 45z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.4l6 4.9C40.9 35.5 44 30.7 44 25c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 text-center">
              {error}
            </p>
          )}

          <p className="text-xs text-gray-400 text-center">
            Only family members with access can sign in
          </p>
        </div>
      </div>
    </div>
  );
}
