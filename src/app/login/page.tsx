"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

type Step = "phone" | "otp" | "not-allowed";

export default function LoginPage() {
  const router = useRouter();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Set up reCAPTCHA verifier on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Clean up any previous instance
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch {}
      window.recaptchaVerifier = undefined;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      { size: "invisible" }
    );
  }, []);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let normalizedPhone = phone.trim();
    if (!normalizedPhone.startsWith("+")) {
      normalizedPhone = "+" + normalizedPhone;
    }

    try {
      // If verifier is missing or broken, recreate it
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          { size: "invisible" }
        );
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        normalizedPhone,
        window.recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;
      setStep("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      setError(msg);
      // Reset verifier on failure
      try { window.recaptchaVerifier?.clear(); } catch {}
      window.recaptchaVerifier = undefined;
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await window.confirmationResult!.confirm(otp.trim());
      if (result.user) {
        router.replace("/app");
      }
    } catch {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setStep("phone");
    setOtp("");
    setError("");
    try { window.recaptchaVerifier?.clear(); } catch {}
    window.recaptchaVerifier = undefined;
    // Reinitialise
    setTimeout(() => {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }, 100);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center p-4">
      {/* Invisible reCAPTCHA anchor — must exist in DOM */}
      <div id="recaptcha-container" ref={recaptchaRef} />

      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💍</div>
          <h1 className="text-2xl font-bold text-gray-900">Wedding Planner</h1>
          <p className="text-sm text-gray-500 mt-1">Family access only</p>
        </div>

        {step === "not-allowed" && (
          <div className="text-center">
            <div className="text-4xl mb-3">🚫</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Not Authorized
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Your phone number isn&apos;t on the family access list. Please ask
              the app admin to add you.
            </p>
            <button
              onClick={() => {
                setStep("phone");
                setPhone("");
                setOtp("");
                setError("");
              }}
              className="text-sm text-pink-600 underline"
            >
              Try a different number
            </button>
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                Include country code (e.g. +91 for India)
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 break-words">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="w-full bg-pink-600 text-white rounded-lg py-2 font-medium text-sm disabled:opacity-50 hover:bg-pink-700 transition-colors"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Enter the 6-digit code sent to
              <br />
              <span className="font-medium text-gray-900">{phone}</span>
            </p>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-pink-400"
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-pink-600 text-white rounded-lg py-2 font-medium text-sm disabled:opacity-50 hover:bg-pink-700 transition-colors"
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
