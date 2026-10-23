"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import {
  THEMES,
  LIST_BACKGROUNDS,
  getTheme,
  getListBackground,
  type ThemePalette,
} from "@/lib/themes";

export interface ThemePickerProps {
  isOpen: boolean;
  onClose: () => void;
  themeId: string;
  onSelectTheme: (themeId: string) => void;
}

function ThemePreview({ palette }: { palette: ThemePalette }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-14 w-full flex-col gap-1.5 rounded-lg p-2"
      style={{ backgroundColor: palette.bg }}
    >
      <div
        className="h-2 w-2/3 rounded-full"
        style={{ backgroundColor: palette.accent }}
      />
      <div
        className="h-1.5 w-full rounded-full"
        style={{ backgroundColor: palette.text, opacity: 0.85 }}
      />
      <div
        className="h-1.5 w-4/5 rounded-full"
        style={{ backgroundColor: palette.muted, opacity: 0.9 }}
      />
      <div
        className="mt-auto h-3 w-full rounded-md"
        style={{ backgroundColor: palette.panel }}
      />
    </div>
  );
}

export function ThemePicker({
  isOpen,
  onClose,
  themeId,
  onSelectTheme,
}: ThemePickerProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[88vh] gap-0 overflow-hidden border border-[var(--tt-border)] bg-[var(--tt-panel)] p-0 text-[var(--tt-text)] ring-0 sm:max-w-3xl">
        <ThemePickerBody
          isOpen={isOpen}
          themeId={themeId}
          onSelectTheme={onSelectTheme}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function ThemePickerBody({
  isOpen,
  themeId,
  onSelectTheme,
  onClose,
}: {
  isOpen: boolean;
  themeId: string;
  onSelectTheme: (themeId: string) => void;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(themeId);

  // Reset the selection whenever the picker is (re)opened, and follow the
  // active theme when it changes externally. Adjusting state during render is
  // the React-recommended alternative to an effect for prop-driven resets.
  const [syncedThemeId, setSyncedThemeId] = useState<string>(themeId);
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen || syncedThemeId !== themeId) {
    setWasOpen(isOpen);
    setSyncedThemeId(themeId);
    setSelectedId(themeId);
  }

  const activeTheme = getTheme(selectedId);

  function handleSelect(id: string) {
    setSelectedId(id);
    onSelectTheme(id);
  }

  return (
    <div className="flex max-h-[88vh] flex-col">
      <DialogHeader className="border-b border-[var(--tt-border)] py-4 pr-12 pl-5">
        <DialogTitle className="font-extrabold tracking-tight text-[var(--tt-text)]">
          Themes
        </DialogTitle>
        <DialogDescription className="tt-label text-[var(--tt-muted)]">
          Choose from {THEMES.length} themes to personalize your workspace.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {/* Theme grid */}
        <section>
          <h3 className="mb-2 tt-label font-semibold text-[var(--tt-text)]">
            Workspace theme
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {THEMES.map((theme) => {
              const isSelected = theme.id === selectedId;
              return (
                <button
                  key={theme.id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`Use ${theme.name} theme`}
                  onClick={() => handleSelect(theme.id)}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border p-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tt-accent)]/50",
                    isSelected
                      ? "border-[var(--tt-border)]"
                      : "border-[var(--tt-border)] hover:border-[var(--tt-border)] dark:border-[var(--tt-border)] dark:hover:border-[var(--tt-border)]"
                  )}
                  style={
                    isSelected
                      ? { boxShadow: `0 0 0 2px ${theme.palette.accent}` }
                      : undefined
                  }
                >
                  <div className="relative">
                    <ThemePreview palette={theme.palette} />
                    {isSelected && (
                      <span
                        className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: theme.palette.accent }}
                      >
                        <Check className="size-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate tt-meta font-bold text-[var(--tt-text)]">
                      {theme.name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-1.5 py-0.5 tt-meta font-bold tracking-wider uppercase",
                        theme.mode === "dark"
                          ? "border-[var(--tt-border)] bg-[var(--tt-panel-alt)] text-[var(--tt-text)] dark:border-[var(--tt-border)] dark:bg-[var(--tt-panel-alt)] dark:text-[var(--tt-muted)]"
                          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                      )}
                    >
                      {theme.mode}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* List backgrounds (read-only preview gallery) */}
        <section>
          <h3 className="mb-1 tt-label font-semibold text-[var(--tt-text)]">
            List backgrounds
          </h3>
          <p className="mb-2 tt-meta text-[var(--tt-muted)]">
            Preview only — per-list backgrounds are customised in Settings.
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {LIST_BACKGROUNDS.map((entry) => {
              const background = getListBackground(entry.id);
              return (
                <div
                  key={entry.id}
                  className="flex flex-col items-center gap-1"
                  title={`${background.name} (preview)`}
                >
                  <div
                    aria-hidden="true"
                    className="h-10 w-full rounded-lg border border-[var(--tt-border)]"
                    style={{ background: background.css }}
                  />
                  <span className="w-full truncate text-center tt-meta text-[var(--tt-muted)]">
                    {background.name}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-[var(--tt-border)] px-5 py-3">
        <span className="mr-auto tt-meta text-[var(--tt-muted)]">
          {activeTheme.name} · {activeTheme.mode} mode
        </span>
        <Button
          type="button"
          variant="outline"
          className="rounded-lg"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="rounded-lg font-semibold"
          onClick={onClose}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
