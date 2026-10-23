"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Calendar,
  Sunrise,
  CalendarDays,
  Inbox,
  CheckCircle,
  Trash2,
  Folder,
  Tag as TagIcon,
  Timer,
  LayoutGrid,
  CheckSquare,
  X,
  ArrowRight,
  Flame,
} from "lucide-react";
import { Task, TaskList, Tag } from "@/hooks/use-ticktick";
import { TickTickModule } from "./module-rail";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  lists: TaskList[];
  tags: Tag[];
  onSelectModule: (module: TickTickModule) => void;
  onSelectView: (view: string, listId?: string | null, tag?: string | null) => void;
  onSelectTask: (taskId: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  tasks,
  lists,
  tags,
  onSelectModule,
  onSelectView,
  onSelectTask,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keydown for Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Navigation Items
  const moduleItems = [
    { id: "mod-tasks", label: "Tasks", icon: <CheckSquare className="h-4 w-4 text-[var(--tt-accent-text)]" />, action: () => onSelectModule("tasks") },
    { id: "mod-cal", label: "Calendar Schedule", icon: <Calendar className="h-4 w-4 text-indigo-400" />, action: () => onSelectModule("calendar") },
    { id: "mod-habits", label: "Habit Tracker", icon: <Flame className="h-4 w-4 text-emerald-400" />, action: () => onSelectModule("habits") },
    { id: "mod-matrix", label: "Eisenhower Matrix", icon: <LayoutGrid className="h-4 w-4 text-amber-400" />, action: () => onSelectModule("matrix") },
    { id: "mod-pomo", label: "Pomodoro Focus Timer", icon: <Timer className="h-4 w-4 text-rose-400" />, action: () => onSelectModule("pomodoro") },
  ].filter((item) => !q || item.label.toLowerCase().includes(q));

  const smartListItems = [
    { id: "sl-today", label: "Today", icon: <Calendar className="h-4 w-4 text-[var(--tt-accent-text)]" />, action: () => { onSelectModule("tasks"); onSelectView("today"); } },
    { id: "sl-tomorrow", label: "Tomorrow", icon: <Sunrise className="h-4 w-4 text-amber-400" />, action: () => { onSelectModule("tasks"); onSelectView("tomorrow"); } },
    { id: "sl-next7", label: "Next 7 Days", icon: <CalendarDays className="h-4 w-4 text-indigo-400" />, action: () => { onSelectModule("tasks"); onSelectView("next7"); } },
    { id: "sl-inbox", label: "Inbox", icon: <Inbox className="h-4 w-4 text-blue-400" />, action: () => { onSelectModule("tasks"); onSelectView("inbox"); } },
    { id: "sl-completed", label: "Completed", icon: <CheckCircle className="h-4 w-4 text-emerald-400" />, action: () => { onSelectModule("tasks"); onSelectView("completed"); } },
    { id: "sl-trash", label: "Trash", icon: <Trash2 className="h-4 w-4 text-rose-400" />, action: () => { onSelectModule("tasks"); onSelectView("trash"); } },
  ].filter((item) => !q || item.label.toLowerCase().includes(q));

  const listItems = lists
    .filter((l) => !q || l.name.toLowerCase().includes(q))
    .map((l) => ({
      id: `list-${l.id}`,
      label: `List: ${l.name}`,
      icon: <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />,
      action: () => {
        onSelectModule("tasks");
        onSelectView("list", l.id, null);
      },
    }));

  const tagItems = tags
    .filter((t) => !q || t.name.toLowerCase().includes(q))
    .map((t) => ({
      id: `tag-${t.id}`,
      label: `Tag: #${t.name}`,
      icon: <TagIcon className="h-3.5 w-3.5 text-indigo-400" />,
      action: () => {
        onSelectModule("tasks");
        onSelectView("tag", null, t.name);
      },
    }));

  const taskItems = tasks
    .filter((t) => !t.completed && (!q || t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))))
    .slice(0, 8)
    .map((t) => ({
      id: `task-${t.id}`,
      label: t.title,
      icon: <CheckCircle className="h-3.5 w-3.5 text-[var(--tt-muted)]" />,
      action: () => {
        onSelectModule("tasks");
        onSelectTask(t.id);
      },
    }));

  const allItems = [...moduleItems, ...smartListItems, ...listItems, ...tagItems, ...taskItems];

  function handleSelect(action: () => void) {
    action();
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        handleSelect(allItems[selectedIndex].action);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-20 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--tt-border)] bg-[var(--tt-rail)] text-[var(--tt-text)] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Search header */}
        <div className="flex items-center gap-3 border-b border-[var(--tt-border)] px-4 py-3">
          <Search className="h-5 w-5 text-[var(--tt-muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, search tasks, lists, or tags..."
            className="flex-1 bg-transparent tt-body text-white placeholder-[var(--tt-muted)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--tt-muted)] hover:text-white hover:bg-[var(--tt-panel-alt)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="py-8 text-center tt-label text-[var(--tt-muted)]">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.action)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 tt-label font-medium transition-colors ${ isSelected ? "bg-[var(--tt-accent)]/20 text-[var(--tt-accent-text)] font-bold" : "text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)]/60" }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isSelected && <ArrowRight className="h-3.5 w-3.5 text-[var(--tt-accent-text)]" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts tip */}
        <div className="flex items-center justify-between border-t border-[var(--tt-border)] px-4 py-2 tt-meta text-[var(--tt-muted)] bg-[var(--tt-bg)]/40">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded bg-[var(--tt-panel-alt)] px-1 py-0.5 font-mono">↑</kbd>{" "}
              <kbd className="rounded bg-[var(--tt-panel-alt)] px-1 py-0.5 font-mono">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="rounded bg-[var(--tt-panel-alt)] px-1.5 py-0.5 font-mono">Enter</kbd> to select
            </span>
          </div>
          <span>
            <kbd className="rounded bg-[var(--tt-panel-alt)] px-1.5 py-0.5 font-mono">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
