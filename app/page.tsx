"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { WorkspaceApp } from "@/components/workspace/workspace-app";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { applyTheme, getTheme, DEFAULT_THEME_ID } from "@/lib/themes";

function WorkspaceMain() {
  const queryClient = useQueryClient();
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);
  const [isDark, setIsDark] = useState<boolean>(false);
  const hasLoadedTheme = useRef(false);

  // Load the persisted workspace theme and publish it as CSS variables.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.themeId) {
            setThemeId(data.themeId);
            setIsDark(getTheme(data.themeId).mode === "dark");
            applyTheme(data.themeId);
          }
        }
      } catch {
        // Keep the default theme when the settings request fails.
      } finally {
        hasLoadedTheme.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  const authQuery = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    },
  });

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await queryClient.invalidateQueries();
  }

  async function handleThemeChange(nextThemeId: string) {
    setThemeId(nextThemeId);
    setIsDark(getTheme(nextThemeId).mode === "dark");
    applyTheme(nextThemeId);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId: nextThemeId }),
      });
      await queryClient.invalidateQueries({ queryKey: ["workspace-settings"] });
    } catch {
      // The theme is already applied locally; persistence can retry later.
    }
  }

  function handleToggleTheme() {
    handleThemeChange(isDark ? DEFAULT_THEME_ID : "midnight");
  }

  return (
    <>
      <AuthModal isOpen={!authQuery.isLoading && !authQuery.data} />
      <WorkspaceApp
        user={authQuery.data}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        onThemeChange={handleThemeChange}
      />
    </>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-[var(--app-accent)] font-semibold text-sm">
          Loading PulseFlow...
        </div>
      }
    >
      <WorkspaceMain />
    </Suspense>
  );
}
