"use client";

import React, { useState } from "react";
import {
  CalendarPlus,
  Globe2,
  RefreshCw,
  Trash2,
  Link2,
  Clock,
  Palette,
  Folder,
  Check,
} from "lucide-react";
import { CalendarSubscription, TaskList } from "@/hooks/use-ticktick";
import { LIST_BACKGROUNDS, THEMES, getTheme } from "@/lib/themes";

export interface SettingsViewProps {
  subscriptions: CalendarSubscription[];
  lists: TaskList[];
  timezone: string;
  themeId: string;
  onAddSubscription: (input: {
    name: string;
    url: string;
    color?: string;
    listId?: string | null;
  }) => void | Promise<void>;
  onDeleteSubscription: (id: string) => void | Promise<void>;
  onSyncSubscription: (id: string) => void | Promise<void>;
  onUpdateSettings: (updates: { themeId?: string; timezone?: string }) => void | Promise<void>;
  onUpdateList: (list: {
    id: string;
    name?: string;
    color?: string;
    icon?: string;
    background?: string;
  }) => void | Promise<void>;
  onOpenThemePicker?: () => void;
  isSyncing?: boolean;
}

const TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
];

export function SettingsView({
  subscriptions,
  lists,
  timezone,
  themeId,
  onAddSubscription,
  onDeleteSubscription,
  onSyncSubscription,
  onUpdateSettings,
  onUpdateList,
  onOpenThemePicker,
  isSyncing,
}: SettingsViewProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [listId, setListId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const theme = getTheme(themeId);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setError("A name and an ICS URL are required");
      return;
    }
    if (!/^https?:\/\//i.test(url.trim())) {
      setError("The URL must start with http:// or https://");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onAddSubscription({
        name: name.trim(),
        url: url.trim(),
        listId: listId || null,
      });
      setName("");
      setUrl("");
      setListId("");
    } catch (err: any) {
      setError(err?.message || "Could not subscribe to that calendar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto pb-8">
      {/* Subscribed calendars */}
      <section className="rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 tt-heading font-semibold text-[var(--tt-text)]">
            <Link2 className="h-4 w-4 text-[var(--tt-accent-text)]" />
            Subscribed calendars
          </h3>
          <span className="tt-meta text-[var(--tt-muted)]">
            Import any public ICS feed as scheduled tasks
          </span>
        </div>

        {subscriptions.length === 0 ? (
          <p className="rounded-xl bg-[var(--tt-panel-alt)] px-3 py-4 text-center tt-label text-[var(--tt-muted)]">
            No calendars subscribed yet. Paste an .ics URL below to pull in its events.
          </p>
        ) : (
          <ul className="mb-3 space-y-1.5">
            {subscriptions.map((subscription) => (
              <li
                key={subscription.id}
                className="flex items-center gap-2 rounded-xl border border-[var(--tt-border)] bg-[var(--tt-panel-alt)]/60 px-3 py-2"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: subscription.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate tt-label font-semibold text-[var(--tt-text)]">
                    {subscription.name}
                  </span>
                  <span className="block truncate tt-meta text-[var(--tt-muted)]">
                    {subscription.url}
                    {subscription.lastSyncedAt
                      ? ` · synced ${new Date(subscription.lastSyncedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : " · never synced"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onSyncSubscription(subscription.id)}
                  disabled={isSyncing}
                  title="Sync now"
                  aria-label={`Sync ${subscription.name}`}
                  className="rounded-md p-1.5 text-[var(--tt-muted)] transition-colors hover:bg-[var(--tt-panel-alt)] hover:text-[var(--tt-accent-text)] disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSubscription(subscription.id)}
                  title="Remove subscription"
                  aria-label={`Remove ${subscription.name}`}
                  className="rounded-md p-1.5 text-[var(--tt-muted)] transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubscribe} className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_1.6fr_auto]">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Calendar name"
              aria-label="Calendar name"
              className="rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel)] px-2.5 py-1.5 tt-label text-[var(--tt-text)] outline-none placeholder:text-[var(--tt-muted)] focus:border-[var(--tt-accent)]"
            />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/calendar.ics"
              aria-label="ICS feed URL"
              className="rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel)] px-2.5 py-1.5 tt-label text-[var(--tt-text)] outline-none placeholder:text-[var(--tt-muted)] focus:border-[var(--tt-accent)]"
            />
            <select
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              aria-label="Destination list"
              className="rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel)] px-2.5 py-1.5 tt-label text-[var(--tt-text)] outline-none focus:border-[var(--tt-accent)]"
            >
              <option value="">Inbox</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="tt-meta font-semibold text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--tt-accent-strong)] px-3 py-1.5 tt-label font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            {saving ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
      </section>

      {/* Time zone */}
      <section className="rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-4 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 tt-heading font-semibold text-[var(--tt-text)]">
          <Globe2 className="h-4 w-4 text-[var(--tt-accent-text)]" />
          Time zone
        </h3>
        <p className="mb-2 tt-meta text-[var(--tt-muted)]">
          Schedules and reminders are planned in this zone so travelling does not shift your day.
        </p>
        <select
          value={timezone}
          onChange={(e) => onUpdateSettings({ timezone: e.target.value })}
          aria-label="Time zone"
          className="w-full max-w-xs rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel)] px-2.5 py-2 tt-label text-[var(--tt-text)] outline-none focus:border-[var(--tt-accent)]"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        <p className="mt-2 flex items-center gap-1.5 tt-meta text-[var(--tt-muted)]">
          <Clock className="h-3 w-3" />
          Local time right now:{" "}
          {new Date().toLocaleString("en-US", {
            timeZone: timezone,
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </section>

      {/* Theme */}
      <section className="rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 tt-heading font-semibold text-[var(--tt-text)]">
            <Palette className="h-4 w-4 text-[var(--tt-accent-text)]" />
            Theme
          </h3>
          {onOpenThemePicker && (
            <button
              type="button"
              onClick={onOpenThemePicker}
              className="rounded-lg border border-[var(--tt-border)] px-2.5 py-1 tt-meta font-bold text-[var(--tt-text)] transition-colors hover:bg-[var(--tt-panel-alt)]"
            >
              Browse {THEMES.length} themes
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className="h-10 w-10 rounded-xl border border-[var(--tt-border)]"
            style={{ background: theme.palette.accent }}
          />
          <div>
            <p className="tt-label font-semibold text-[var(--tt-text)]">{theme.name}</p>
            <p className="tt-meta capitalize text-[var(--tt-muted)]">{theme.mode} mode</p>
          </div>
        </div>
      </section>

      {/* List backgrounds */}
      <section className="rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-panel)] p-4 shadow-sm">
        <h3 className="mb-1 flex items-center gap-2 tt-heading font-semibold text-[var(--tt-text)]">
          <Folder className="h-4 w-4 text-[var(--tt-accent-text)]" />
          List backgrounds
        </h3>
        <p className="mb-3 tt-meta text-[var(--tt-muted)]">
          Give each list its own backdrop.
        </p>
        {lists.length === 0 ? (
          <p className="tt-label text-[var(--tt-muted)]">Create a list to customise it.</p>
        ) : (
          <div className="space-y-3">
            {lists.map((list) => (
              <div key={list.id} className="flex items-center gap-3">
                <span className="w-28 truncate tt-label font-medium text-[var(--tt-text)]">
                  {list.name}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {LIST_BACKGROUNDS.map((bg) => {
                    const active = (list as any).background === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        title={bg.name}
                        aria-label={`${bg.name} background for ${list.name}`}
                        onClick={() => onUpdateList({ id: list.id, background: bg.id })}
                        style={{ background: bg.css }}
                        className={`h-7 w-9 rounded-md border transition-all ${ active ? "border-[var(--tt-accent)] ring-2 ring-[var(--tt-accent)]/40" : "border-[var(--tt-border)] hover:border-[var(--tt-border)] dark:border-[var(--tt-border)]" }`}
                      >
                        {active && (
                          <span className="flex h-full items-center justify-center">
                            <Check className="h-3 w-3 text-[var(--tt-accent-text)]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
