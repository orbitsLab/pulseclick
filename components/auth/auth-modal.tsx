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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[10px] border border-[var(--app-border)] bg-[var(--app-panel)] p-6 shadow-2xl text-[var(--app-text)] sm:p-7 animate-in fade-in zoom-in-95 duration-150">
        {/* Notion Monogram Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-9 shrink-0 rounded-[6px] bg-[var(--app-text)] flex items-center justify-center text-[var(--app-canvas)] font-bold text-sm shadow-sm select-none">
            P
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--app-text)] tracking-tight">
              {isLogin ? "Welcome back to PulseFlow" : "Start with PulseFlow"}
            </h2>
            <p className="text-xs text-[var(--app-muted)] mt-0.5">
              {isLogin
                ? "Sign in to pick up your tasks, schedule, habits and focus sessions."
                : "Capture tasks, keep habits on track, and review your week."}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-[4px] border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {!isLogin && (
            <div>
              <label className="block text-[11px] font-medium text-[var(--app-muted)] uppercase tracking-wider mb-1">
                Your Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--app-muted)]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-canvas)] pl-9 pr-3 py-1.5 text-xs text-[var(--app-text)] placeholder-[var(--app-muted)] focus:border-[var(--app-accent)] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-[var(--app-muted)] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--app-muted)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-canvas)] pl-9 pr-3 py-1.5 text-xs text-[var(--app-text)] placeholder-[var(--app-muted)] focus:border-[var(--app-accent)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[var(--app-muted)] uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--app-muted)]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-[4px] border border-[var(--app-border)] bg-[var(--app-canvas)] pl-9 pr-3 py-1.5 text-xs text-[var(--app-text)] placeholder-[var(--app-muted)] focus:border-[var(--app-accent)] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] py-2 px-4 text-xs font-medium text-white transition-colors disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isLogin ? (
              <>
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" /> Create Free Account
              </>
            )}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between border-t border-[var(--app-border)] pt-3.5 text-xs text-[var(--app-muted)]">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-[var(--app-accent)] hover:underline font-medium cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>

          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={loading}
            className="inline-flex items-center gap-1 text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors disabled:opacity-50 cursor-pointer"
            title="Open the demo workspace"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Open demo
          </button>
        </div>
      </div>
    </div>
  );
}
