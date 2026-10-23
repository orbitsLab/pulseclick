"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Bookmark,
  BookOpen,
  Briefcase,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Circle,
  Clock,
  Droplets,
  Dumbbell,
  Filter,
  Flag,
  Flame,
  Folder,
  GraduationCap,
  Heart,
  Home,
  Inbox,
  Palmtree,
  Plane,
  ShoppingBag,
  Star,
  Tag,
  Target,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "cn";
import type { FilterQuery } from "@/lib/filters";

export interface FilterListItem {
  id: string;
  name: string;
  color?: string | null;
}

export interface FilterTagItem {
  id: string;
  name: string;
  color?: string | null;
}

export interface FilterDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  query: FilterQuery;
}

export interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterDefinition[];
  lists: FilterListItem[];
  tags: FilterTagItem[];
  onCreateFilter: (input: {
    name: string;
    icon?: string;
    color?: string;
    query: FilterQuery;
  }) => void | Promise<void>;
  onUpdateFilter: (
    id: string,
    updates: Partial<{ name: string; icon: string; color: string; query: FilterQuery }>
  ) => void | Promise<void>;
  onDeleteFilter: (id: string) => void | Promise<void>;
  onApplyFilter: (id: string) => void;
}

/** Icon names offered by the picker. Stored on the filter as a plain string. */
const ICON_CHOICES = [
  "Flag",
  "Star",
  "Tag",
  "CalendarDays",
  "AlertCircle",
  "Bookmark",
  "Filter",
  "Flame",
  "Clock",
  "Heart",
  "Zap",
  "Target",
  "Folder",
  "Inbox",
  "Circle",
] as const;

/** Eight preset swatches for the colour picker. */
const COLOR_CHOICES = [
  "#4772fa",
  "#12b886",
  "#f59f00",
  "#e03131",
  "#e64980",
  "#7950f2",
  "#1c7ed6",
  "#7c8496",
] as const;

const PRIORITY_CHOICES: Array<{ value: number; label: string }> = [
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
];

const PRIORITY_LABELS: Record<number, string> = {
  1: "Low",
  2: "Medium",
  3: "High",
};

const INBOX_ID = "inbox";
const DEFAULT_ICON = "Filter";
const DEFAULT_COLOR = "#4772fa";

interface FilterDraft {
  name: string;
  icon: string;
  color: string;
  priorities: number[];
  tags: string[];
  listIds: string[];
  dueFrom: string;
  dueTo: string;
  status: "open" | "completed" | "any";
  hasDescription: boolean;
  hasSubtasks: boolean;
  pinned: boolean;
  keyword: string;
}

function emptyDraft(): FilterDraft {
  return {
    name: "",
    icon: DEFAULT_ICON,
    color: DEFAULT_COLOR,
    priorities: [],
    tags: [],
    listIds: [],
    dueFrom: "",
    dueTo: "",
    status: "any",
    hasDescription: false,
    hasSubtasks: false,
    pinned: false,
    keyword: "",
  };
}

function draftFromFilter(filter: FilterDefinition): FilterDraft {
  const query = filter.query ?? {};
  return {
    name: filter.name ?? "",
    icon: filter.icon || DEFAULT_ICON,
    color: filter.color || DEFAULT_COLOR,
    priorities: [...(query.priorities ?? [])],
    tags: [...(query.tags ?? [])],
    listIds: [...(query.listIds ?? [])],
    dueFrom: query.dueFrom ?? "",
    dueTo: query.dueTo ?? "",
    status: query.status ?? "any",
    hasDescription: Boolean(query.hasDescription),
    hasSubtasks: Boolean(query.hasSubtasks),
    pinned: Boolean(query.pinned),
    keyword: query.keyword ?? "",
  };
}

function draftToQuery(draft: FilterDraft): FilterQuery {
  const query: FilterQuery = {};
  if (draft.priorities.length) {
    query.priorities = [...draft.priorities].sort((a, b) => a - b);
  }
  if (draft.tags.length) query.tags = [...draft.tags];
  if (draft.listIds.length) query.listIds = [...draft.listIds];
  query.dueFrom = draft.dueFrom || null;
  query.dueTo = draft.dueTo || null;
  if (draft.status !== "any") query.status = draft.status;
  if (draft.hasDescription) query.hasDescription = true;
  if (draft.hasSubtasks) query.hasSubtasks = true;
  if (draft.pinned) query.pinned = true;
  if (draft.keyword.trim()) query.keyword = draft.keyword.trim();
  return query;
}

/** Human readable one-liner describing a filter query. */
function summarizeFilterQuery(
  query: FilterQuery,
  listNameById: Map<string, string> = new Map()
): string {
  const parts: string[] = [];

  const priorities = [...(query.priorities ?? [])].sort((a, b) => a - b);
  if (priorities.length) {
    parts.push(
      `Priority: ${priorities.map((p) => PRIORITY_LABELS[p] ?? `P${p}`).join(", ")}`
    );
  }
  if (query.tags?.length) {
    parts.push(`Tags: ${query.tags.join(", ")}`);
  }
  if (query.listIds?.length) {
    parts.push(
      `Lists: ${query.listIds
        .map((id) => listNameById.get(id) ?? (id === INBOX_ID ? "Inbox" : id))
        .join(", ")}`
    );
  }
  if (query.status && query.status !== "any") {
    parts.push(`Status: ${query.status === "open" ? "Open" : "Completed"}`);
  }
  if (query.dueFrom || query.dueTo) {
    parts.push(`Due: ${query.dueFrom ?? "…"} → ${query.dueTo ?? "…"}`);
  }
  if (query.hasDescription) parts.push("Has description");
  if (query.hasSubtasks) parts.push("Has subtasks");
  if (query.pinned) parts.push("Pinned only");
  if (query.keyword?.trim()) parts.push(`Keyword: "${query.keyword.trim()}"`);

  return parts.length ? parts.join(", ") : "No criteria yet";
}

/**
 * Renders a lucide icon from its stored name.
 *
 * Icons are persisted as plain name strings, so the name has to be resolved back
 * to a component at render time. Importing the whole `lucide-react` namespace
 * would work but defeats tree-shaking and adds the entire icon set (~760 KB raw)
 * to the client bundle, so the resolvable names are mapped explicitly instead.
 * Unknown or renamed icons fall back to `Circle`.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  // Picker choices
  Filter,
  Flag,
  Star,
  Tag,
  CalendarDays,
  AlertCircle,
  Bookmark,
  Flame,
  Clock,
  Heart,
  Zap,
  Target,
  Folder,
  Inbox,
  Circle,
  // Names used by seeded lists, habits and filters
  Briefcase,
  BookOpen,
  Dumbbell,
  Droplets,
  User,
  Home,
  ShoppingBag,
  GraduationCap,
  BriefcaseBusiness,
  Palmtree,
  Plane,
};

function FilterIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Component = (name ? ICON_MAP[name] : undefined) ?? Circle;
  return <Component className={className} aria-hidden="true" />;
}

export function FilterPanel({
  isOpen,
  onClose,
  filters,
  lists,
  tags,
  onCreateFilter,
  onUpdateFilter,
  onDeleteFilter,
  onApplyFilter,
}: FilterPanelProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[88vh] gap-0 overflow-hidden border border-[var(--tt-border)] bg-[var(--tt-panel)] p-0 text-[var(--tt-text)] ring-0 sm:max-w-3xl">
        <FilterPanelBody
          isOpen={isOpen}
          filters={filters}
          lists={lists}
          tags={tags}
          onCreateFilter={onCreateFilter}
          onUpdateFilter={onUpdateFilter}
          onDeleteFilter={onDeleteFilter}
          onApplyFilter={onApplyFilter}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function FilterPanelBody({
  isOpen,
  filters,
  lists,
  tags,
  onCreateFilter,
  onUpdateFilter,
  onDeleteFilter,
  onApplyFilter,
  onClose,
}: Omit<FilterPanelProps, "isOpen"> & { isOpen: boolean }) {
  const [mode, setMode] = useState<"list" | "editor">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FilterDraft>(emptyDraft);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the panel whenever it is (re)opened. Adjusting state during render
  // is the React-recommended alternative to an effect for prop-driven resets.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setMode("list");
      setEditingId(null);
      setDraft(emptyDraft());
      setConfirmDeleteId(null);
      setSaving(false);
      setError(null);
    }
  }

  const listOptions = useMemo(() => {
    const options: FilterListItem[] = [
      { id: INBOX_ID, name: "Inbox", color: null },
      ...lists.filter((list) => list.id !== INBOX_ID),
    ];
    return options;
  }, [lists]);

  const listNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const list of listOptions) map.set(list.id, list.name);
    return map;
  }, [listOptions]);

  const summary = useMemo(
    () => summarizeFilterQuery(draftToQuery(draft), listNameById),
    [draft, listNameById]
  );

  function updateDraft(patch: Partial<FilterDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function toggleInArray<T>(values: T[], value: T): T[] {
    return values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
  }

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setError(null);
    setMode("editor");
  }

  function startEdit(filter: FilterDefinition) {
    setEditingId(filter.id);
    setDraft(draftFromFilter(filter));
    setError(null);
    setMode("editor");
  }

  function cancelEditor() {
    setMode("list");
    setEditingId(null);
    setDraft(emptyDraft());
    setError(null);
  }

  async function handleSave() {
    const name = draft.name.trim();
    if (!name) {
      setError("A filter name is required.");
      return;
    }

    const query = draftToQuery(draft);
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await onUpdateFilter(editingId, {
          name,
          icon: draft.icon,
          color: draft.color,
          query,
        });
      } else {
        await onCreateFilter({
          name,
          icon: draft.icon,
          color: draft.color,
          query,
        });
      }
      setMode("list");
      setEditingId(null);
      setDraft(emptyDraft());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the filter.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    setError(null);
    try {
      await onDeleteFilter(id);
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the filter.");
    } finally {
      setSaving(false);
    }
  }

  function handleApply(id: string) {
    onApplyFilter(id);
    onClose();
  }

  return (
    <div className="flex max-h-[88vh] flex-col">
      {mode === "list" ? (
        <>
          <DialogHeader className="border-b border-[var(--tt-border)] py-4 pr-12 pl-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="font-extrabold tracking-tight text-[var(--tt-text)]">
                  Smart filters
                </DialogTitle>
                <DialogDescription className="tt-label text-[var(--tt-muted)]">
                  Use smart filters to focus on what matters most.
                </DialogDescription>
              </div>
              <Button
                type="button"
                size="sm"
                className="rounded-lg font-semibold"
                onClick={startCreate}
              >
                New filter
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {error && (
              <p
                role="alert"
                className="mb-3 rounded-lg bg-rose-50 px-3 py-2 tt-label font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
              >
                {error}
              </p>
            )}

            {filters.length === 0 ? (
              <p className="rounded-xl bg-[var(--tt-panel-alt)] px-3 py-6 text-center tt-label text-[var(--tt-muted)]">
                No smart filters yet. Create one to save a set of criteria.
              </p>
            ) : (
              <ul className="space-y-2">
                {filters.map((filter) => (
                  <li
                    key={filter.id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--tt-border)] bg-[var(--tt-panel)] px-3 py-2.5"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: filter.color || DEFAULT_COLOR }}
                    />
                    <FilterIcon
                      name={filter.icon}
                      className="h-4 w-4 shrink-0 text-[var(--tt-muted)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate tt-label font-semibold text-[var(--tt-text)]">
                        {filter.name}
                      </p>
                      <p className="truncate tt-meta text-[var(--tt-muted)]">
                        {summarizeFilterQuery(filter.query ?? {}, listNameById)}
                      </p>
                    </div>

                    {confirmDeleteId === filter.id ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="tt-meta font-semibold text-rose-500">
                          Delete?
                        </span>
                        <Button
                          type="button"
                          size="xs"
                          variant="destructive"
                          className="rounded-lg"
                          disabled={saving}
                          onClick={() => handleDelete(filter.id)}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          type="button"
                          size="xs"
                          className="rounded-lg font-semibold"
                          onClick={() => handleApply(filter.id)}
                        >
                          Apply
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => startEdit(filter)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          aria-label={`Delete filter ${filter.name}`}
                          className="rounded-lg text-[var(--tt-muted)] hover:text-rose-500"
                          onClick={() => setConfirmDeleteId(filter.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <>
          <DialogHeader className="border-b border-[var(--tt-border)] py-4 pr-12 pl-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="font-extrabold tracking-tight text-[var(--tt-text)]">
                  {editingId ? "Edit filter" : "New filter"}
                </DialogTitle>
                <DialogDescription className="tt-label text-[var(--tt-muted)]">
                  Pick the criteria that should match. They update as you type.
                </DialogDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-lg"
                onClick={cancelEditor}
              >
                Back
              </Button>
            </div>
          </DialogHeader>

          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-rose-50 px-3 py-2 tt-label font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                >
                  {error}
                </p>
              )}

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="filter-name"
                  className="tt-label font-semibold text-[var(--tt-text)]"
                >
                  Name
                </Label>
                <Input
                  id="filter-name"
                  value={draft.name}
                  onChange={(event) => updateDraft({ name: event.target.value })}
                  placeholder="High priority work"
                  aria-label="Filter name"
                  autoComplete="off"
                  required
                  className="rounded-lg border-[var(--tt-border)] bg-[var(--tt-panel)] text-[var(--tt-text)] focus-visible:border-[var(--tt-accent)] focus-visible:ring-[var(--tt-accent)]/40"
                />
              </div>

              {/* Icon */}
              <div className="flex flex-col gap-1.5">
                <Label className="tt-label font-semibold text-[var(--tt-text)]">
                  Icon
                </Label>
                <div
                  role="group"
                  aria-label="Filter icon"
                  className="flex flex-wrap gap-1.5"
                >
                  {ICON_CHOICES.map((iconName) => {
                    const selected = draft.icon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        aria-label={`Use ${iconName} icon`}
                        aria-pressed={selected}
                        title={iconName}
                        onClick={() => updateDraft({ icon: iconName })}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tt-accent)]/50",
                          selected
                            ? "border-[var(--tt-accent)] bg-[var(--tt-accent)]/10 text-[var(--tt-accent-text)]"
                            : "border-[var(--tt-border)] text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)] dark:border-[var(--tt-border)] dark:text-[var(--tt-muted)] dark:hover:bg-[var(--tt-panel-alt)]"
                        )}
                      >
                        <FilterIcon name={iconName} className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colour */}
              <div className="flex flex-col gap-1.5">
                <Label className="tt-label font-semibold text-[var(--tt-text)]">
                  Colour
                </Label>
                <div
                  role="group"
                  aria-label="Filter colour"
                  className="flex flex-wrap gap-2"
                >
                  {COLOR_CHOICES.map((color) => {
                    const selected =
                      draft.color.toLowerCase() === color.toLowerCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Use colour ${color}`}
                        aria-pressed={selected}
                        title={color}
                        onClick={() => updateDraft({ color })}
                        style={{ backgroundColor: color }}
                        className={cn(
                          "h-7 w-7 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tt-accent)]/60",
                          selected
                            ? "ring-2 ring-[var(--tt-panel)] ring-offset-2 dark:ring-white dark:ring-offset-slate-900"
                            : ""
                        )}
                      >
                        {selected && (
                          <Check className="mx-auto size-3.5 text-white drop-shadow" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1.5">
                <Label className="tt-label font-semibold text-[var(--tt-text)]">
                  Priority
                </Label>
                <div
                  role="group"
                  aria-label="Filter priorities"
                  className="flex flex-wrap gap-1.5"
                >
                  {PRIORITY_CHOICES.map((priority) => {
                    const selected = draft.priorities.includes(priority.value);
                    return (
                      <button
                        key={priority.value}
                        type="button"
                        aria-label={`Filter by ${priority.label} priority`}
                        aria-pressed={selected}
                        onClick={() =>
                          updateDraft({
                            priorities: toggleInArray(
                              draft.priorities,
                              priority.value
                            ),
                          })
                        }
                        className={cn(
                          "rounded-lg border px-2.5 py-1 tt-label font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tt-accent)]/50",
                          selected
                            ? "border-[var(--tt-accent)] bg-[var(--tt-accent)]/10 text-[var(--tt-accent-text)]"
                            : "border-[var(--tt-border)] text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)] dark:border-[var(--tt-border)] dark:text-[var(--tt-muted)] dark:hover:bg-[var(--tt-panel-alt)]"
                        )}
                      >
                        {priority.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1.5">
                <Label className="tt-label font-semibold text-[var(--tt-text)]">
                  Tags
                </Label>
                {tags.length === 0 ? (
                  <p className="tt-meta text-[var(--tt-muted)]">
                    No tags created yet.
                  </p>
                ) : (
                  <div
                    role="group"
                    aria-label="Filter tags"
                    className="flex flex-wrap gap-1.5"
                  >
                    {tags.map((tag) => {
                      const selected = draft.tags.includes(tag.name);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          aria-label={`Filter by tag ${tag.name}`}
                          aria-pressed={selected}
                          onClick={() =>
                            updateDraft({
                              tags: toggleInArray(draft.tags, tag.name),
                            })
                          }
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 tt-label font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tt-accent)]/50",
                            selected
                              ? "border-[var(--tt-accent)] bg-[var(--tt-accent)]/10 text-[var(--tt-accent-text)]"
                              : "border-[var(--tt-border)] text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)] dark:border-[var(--tt-border)] dark:text-[var(--tt-muted)] dark:hover:bg-[var(--tt-panel-alt)]"
                          )}
                        >
                          #{tag.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Lists */}
              <div className="flex flex-col gap-1.5">
                <Label className="tt-label font-semibold text-[var(--tt-text)]">
                  Lists
                </Label>
                <div
                  role="group"
                  aria-label="Filter lists"
                  className="flex flex-wrap gap-1.5"
                >
                  {listOptions.map((list) => {
                    const selected = draft.listIds.includes(list.id);
                    return (
                      <button
                        key={list.id}
                        type="button"
                        aria-label={`Filter by list ${list.name}`}
                        aria-pressed={selected}
                        onClick={() =>
                          updateDraft({
                            listIds: toggleInArray(draft.listIds, list.id),
                          })
                        }
                        className={cn(
                          "rounded-lg border px-2.5 py-1 tt-label font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tt-accent)]/50",
                          selected
                            ? "border-[var(--tt-accent)] bg-[var(--tt-accent)]/10 text-[var(--tt-accent-text)]"
                            : "border-[var(--tt-border)] text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)] dark:border-[var(--tt-border)] dark:text-[var(--tt-muted)] dark:hover:bg-[var(--tt-panel-alt)]"
                        )}
                      >
                        {list.id === INBOX_ID ? "Inbox" : list.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status + due range */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="filter-status"
                    className="tt-label font-semibold text-[var(--tt-text)]"
                  >
                    Status
                  </Label>
                  <select
                    id="filter-status"
                    aria-label="Filter status"
                    value={draft.status}
                    onChange={(event) =>
                      updateDraft({
                        status: event.target.value as FilterDraft["status"],
                      })
                    }
                    className="h-8 w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel)] px-2 tt-label text-[var(--tt-text)] outline-none focus-visible:border-[var(--tt-accent)] focus-visible:ring-2 focus-visible:ring-[var(--tt-accent)]/40"
                  >
                    <option value="any">Any</option>
                    <option value="open">Open</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="filter-due-from"
                    className="tt-label font-semibold text-[var(--tt-text)]"
                  >
                    Due from
                  </Label>
                  <input
                    id="filter-due-from"
                    type="date"
                    aria-label="Due date from"
                    value={draft.dueFrom}
                    onChange={(event) =>
                      updateDraft({ dueFrom: event.target.value })
                    }
                    className="h-8 w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel)] px-2 tt-label text-[var(--tt-text)] outline-none focus-visible:border-[var(--tt-accent)] focus-visible:ring-2 focus-visible:ring-[var(--tt-accent)]/40"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="filter-due-to"
                    className="tt-label font-semibold text-[var(--tt-text)]"
                  >
                    Due to
                  </Label>
                  <input
                    id="filter-due-to"
                    type="date"
                    aria-label="Due date to"
                    value={draft.dueTo}
                    onChange={(event) => updateDraft({ dueTo: event.target.value })}
                    className="h-8 w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel)] px-2 tt-label text-[var(--tt-text)] outline-none focus-visible:border-[var(--tt-accent)] focus-visible:ring-2 focus-visible:ring-[var(--tt-accent)]/40"
                  />
                </div>
              </div>

              {/* Boolean toggles */}
              <div className="grid gap-2 sm:grid-cols-3">
                <label
                  htmlFor="filter-hasDescription"
                  className="flex cursor-pointer items-start gap-2 rounded-xl border border-[var(--tt-border)] px-3 py-2.5 transition-colors hover:bg-[var(--tt-panel-alt)] dark:hover:bg-[var(--tt-panel-alt)]/60"
                >
                  <Checkbox
                    id="filter-hasDescription"
                    checked={draft.hasDescription}
                    onCheckedChange={(checked: boolean) =>
                      updateDraft({ hasDescription: checked })
                    }
                    className="mt-0.5 border-[var(--tt-border)] data-checked:border-[var(--tt-accent)] data-checked:bg-[var(--tt-accent-strong)] data-checked:text-white"
                  />
                  <span className="flex flex-col">
                    <span className="tt-label font-semibold text-[var(--tt-text)]">
                      Has description
                    </span>
                    <span className="tt-meta text-[var(--tt-muted)]">
                      Only tasks with a description
                    </span>
                  </span>
                </label>

                <label
                  htmlFor="filter-hasSubtasks"
                  className="flex cursor-pointer items-start gap-2 rounded-xl border border-[var(--tt-border)] px-3 py-2.5 transition-colors hover:bg-[var(--tt-panel-alt)] dark:hover:bg-[var(--tt-panel-alt)]/60"
                >
                  <Checkbox
                    id="filter-hasSubtasks"
                    checked={draft.hasSubtasks}
                    onCheckedChange={(checked: boolean) =>
                      updateDraft({ hasSubtasks: checked })
                    }
                    className="mt-0.5 border-[var(--tt-border)] data-checked:border-[var(--tt-accent)] data-checked:bg-[var(--tt-accent-strong)] data-checked:text-white"
                  />
                  <span className="flex flex-col">
                    <span className="tt-label font-semibold text-[var(--tt-text)]">
                      Has subtasks
                    </span>
                    <span className="tt-meta text-[var(--tt-muted)]">
                      Only tasks with sub tasks
                    </span>
                  </span>
                </label>

                <label
                  htmlFor="filter-pinned"
                  className="flex cursor-pointer items-start gap-2 rounded-xl border border-[var(--tt-border)] px-3 py-2.5 transition-colors hover:bg-[var(--tt-panel-alt)] dark:hover:bg-[var(--tt-panel-alt)]/60"
                >
                  <Checkbox
                    id="filter-pinned"
                    checked={draft.pinned}
                    onCheckedChange={(checked: boolean) =>
                      updateDraft({ pinned: checked })
                    }
                    className="mt-0.5 border-[var(--tt-border)] data-checked:border-[var(--tt-accent)] data-checked:bg-[var(--tt-accent-strong)] data-checked:text-white"
                  />
                  <span className="flex flex-col">
                    <span className="tt-label font-semibold text-[var(--tt-text)]">
                      Pinned only
                    </span>
                    <span className="tt-meta text-[var(--tt-muted)]">
                      Only pinned tasks
                    </span>
                  </span>
                </label>
              </div>

              {/* Keyword */}
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="filter-keyword"
                  className="tt-label font-semibold text-[var(--tt-text)]"
                >
                  Keyword
                </Label>
                <Input
                  id="filter-keyword"
                  value={draft.keyword}
                  onChange={(event) => updateDraft({ keyword: event.target.value })}
                  placeholder="Search title or description"
                  aria-label="Filter keyword"
                  autoComplete="off"
                  className="rounded-lg border-[var(--tt-border)] bg-[var(--tt-panel)] text-[var(--tt-text)] focus-visible:border-[var(--tt-accent)] focus-visible:ring-[var(--tt-accent)]/40"
                />
              </div>

              {/* Live summary */}
              <div className="rounded-xl border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-3 py-2.5">
                <p className="tt-meta font-bold tracking-wider text-[var(--tt-muted)] uppercase">
                  Summary
                </p>
                <p
                  aria-live="polite"
                  className="mt-0.5 tt-label font-medium text-[var(--tt-text)]"
                >
                  {summary}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--tt-border)] px-5 py-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-lg"
                onClick={cancelEditor}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-lg font-semibold"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Create filter"}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
