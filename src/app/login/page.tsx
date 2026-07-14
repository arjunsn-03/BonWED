"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/collections";

// Convert a phone number to a fake email for Firebase Email/Password auth
function phoneToEmail(phone: string): string {
  const normalized = phone.trim().replace(/\s+/g, "").replace(/^\+/, "");
  return `${normalized}@bonwed.app`;
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let normalizedPhone = phone.trim().replace(/\s+/g, "");
    if (!normalizedPhone.startsWith("+")) {
      normalizedPhone = "+" + normalizedPhone;
    }

    // Check allowlist first
    const allowRef = doc(db, COLLECTIONS.allowlist, normalizedPhone);
    const allowSnap = await getDoc(allowRef);
    if (!allowSnap.exists()) {
      setError("Your number isn't on the access list. Contact the app admin.");
      setLoading(false);
      return;
    }

    const email = phoneToEmail(normalizedPhone);

    try {
      // Try signing in first
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/app");
    } catch (signInErr: unknown) {
      const code = (signInErr as { code?: string }).code;

      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        // First time — create the account
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          router.replace("/app");
        } catch (createErr: unknown) {
          const createCode = (createErr as { code?: string }).code;
          if (createCode === "auth/weak-password") {
            setError("Password must be at least 6 characters.");
          } else {
            setError("Failed to create account. Try again.");
          }
        }
      } else if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Incorrect password. Try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Try again later.");
      } else {
        setError("Login failed. Check your details and try again.");
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
              autoComplete="username"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Include country code (e.g. +91 for India)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              First time? Any password you enter will be set as yours.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !phone.trim() || !password.trim()}
            className="w-full bg-pink-600 text-white rounded-lg py-2.5 font-medium text-sm disabled:opacity-50 hover:bg-pink-700 transition-colors"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
