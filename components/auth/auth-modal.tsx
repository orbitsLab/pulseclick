"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, UserPlus, Lock, Mail, User as UserIcon, Sparkles } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
}

const DEMO_EMAIL = "demo@pulseflow.app";
const DEMO_PASSWORD = "password123";

export function AuthModal({ isOpen }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Success: invalidate auth and refetch dashboard
      await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      await queryClient.invalidateQueries();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Sign straight into the demo workspace. The account is created on first use
  // so the button never points at an account that does not exist.
  async function handleQuickDemo() {
    setError("");
    setLoading(true);
    const credentials = { email: DEMO_EMAIL, password: DEMO_PASSWORD };

    try {
      let res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        // No demo account yet — create it, then sign in.
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...credentials, name: "Demo User" }),
        });
        res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not open the demo workspace");

      await queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      await queryClient.invalidateQueries();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--app-border)] bg-[#0f172a] p-6 shadow-2xl text-[var(--app-text)] sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand header — the mark sits beside the heading, not above it */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-[var(--app-accent)] to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-black/20">
            ✓
          </div>
          <div>
            <h2 className="app-display text-white">
              {isLogin ? "Welcome back to PulseFlow" : "Start with PulseFlow"}
            </h2>
            <p className="app-body text-[var(--app-muted)] mt-1">
              {isLogin
                ? "Sign in to pick up your tasks, schedule, habits and focus sessions."
                : "Capture tasks, keep habits on track, and review your week."}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 app-label text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block app-overline font-semibold text-[var(--app-muted)] mb-1.5">
                Your Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-[var(--app-muted)]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-rail)]/80 px-10 py-2.5 app-body text-white placeholder-[var(--app-muted)] focus:border-[var(--app-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block app-overline font-semibold text-[var(--app-muted)] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[var(--app-muted)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-rail)]/80 px-10 py-2.5 app-body text-white placeholder-[var(--app-muted)] focus:border-[var(--app-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block app-overline font-semibold text-[var(--app-muted)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[var(--app-muted)]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-rail)]/80 px-10 py-2.5 app-body text-white placeholder-[var(--app-muted)] focus:border-[var(--app-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--app-accent)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--app-accent-strong)] py-2.5 px-4 app-body font-semibold text-white shadow-lg shadow-[var(--app-accent)]/20 transition-all hover:bg-[var(--app-accent-strong)] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isLogin ? (
              <>
                <LogIn className="h-4 w-4" /> Sign In
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Create Free Account
              </>
            )}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between border-t border-[var(--app-border)] pt-4 app-label text-[var(--app-muted)]">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-[var(--app-accent-text)] hover:text-white underline font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>

          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={loading}
            className="inline-flex items-center gap-1 text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors disabled:opacity-50"
            title="Open the demo workspace"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Open demo
          </button>
        </div>
      </div>
    </div>
  );
}
