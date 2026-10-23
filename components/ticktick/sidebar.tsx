"use client";

import React, { useState, useContext } from "react";
import {
  Inbox,
  Calendar as CalendarIcon,
  CalendarDays,
  ListTodo,
  CheckCircle,
  Trash2,
  Plus,
  Search,
  Folder,
  Tag as TagIcon,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Sunrise,
  Pencil,
  X,
  Filter,
} from "lucide-react";
import { TaskList, Tag } from "@/hooks/use-ticktick";
import { toISODate, getTodayISO } from "@/lib/date-utils";
import { TickTickContext } from "@/context/ticktick-context";

interface SidebarProps {
  activeView?: string;
  activeListId?: string | null;
  activeTag?: string | null;
  onSelectView?: (view: string, listId?: string | null, tag?: string | null) => void;
  onSelectDate?: (dateIso: string) => void;
  lists?: TaskList[];
  inboxCount?: number;
  tags?: Tag[];
  onAddList?: (list: { name: string; color: string; icon?: string }) => Promise<any>;
  onUpdateList?: (list: { id: string; name?: string; color?: string; icon?: string }) => Promise<any>;
  onDeleteList?: (id: string) => Promise<any>;
  onAddTag?: (tag: { name: string; color?: string }) => Promise<any>;
  onDeleteTag?: (id: string) => Promise<any>;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  todayCount?: number;
  tomorrowCount?: number;
  allCount?: number;
  filters?: { id: string; name: string; icon: string; color: string }[];
  activeFilterId?: string | null;
  onSelectFilter?: (filterId: string | null) => void;
  onOpenFilterPanel?: () => void;
}

export function TickTickSidebar(props: SidebarProps = {}) {
  const context = useContext(TickTickContext);

  const activeView = props.activeView ?? context?.activeView ?? "today";
  const activeListId = props.activeListId !== undefined ? props.activeListId : (context?.activeListId ?? null);
  const activeTag = props.activeTag !== undefined ? props.activeTag : (context?.activeTag ?? null);
  const onSelectView = props.onSelectView ?? context?.selectView ?? (() => {});
  const onSelectDate = props.onSelectDate ?? ((_dateIso) => context?.selectModule("calendar"));
  const lists = props.lists ?? context?.lists ?? [];
  const inboxCount = props.inboxCount ?? context?.inboxCount ?? 0;
  const tags = props.tags ?? context?.tags ?? [];
  const onAddList = props.onAddList ?? context?.addList ?? (async () => {});
  const onUpdateList = props.onUpdateList ?? context?.updateList;
  const onDeleteList = props.onDeleteList ?? context?.deleteList;
  const onAddTag = props.onAddTag ?? context?.addTag ?? (async () => {});
  const onDeleteTag = props.onDeleteTag ?? context?.deleteTag;
  const searchQuery = props.searchQuery ?? context?.searchQuery ?? "";
  const onSearchChange = props.onSearchChange ?? context?.setSearchQuery ?? (() => {});
  const todayCount = props.todayCount ?? context?.todayCount ?? 0;
  const tomorrowCount = props.tomorrowCount ?? context?.tomorrowCount ?? 0;
  const allCount = props.allCount ?? context?.allCount ?? 0;
  const filters = props.filters ?? (context?.filters?.map((f: any) => ({
    id: f.id,
    name: f.name,
    icon: f.icon,
    color: f.color,
  })) || []);
  const activeFilterId = props.activeFilterId !== undefined ? props.activeFilterId : (context?.activeFilterId ?? null);
  const onSelectFilter = props.onSelectFilter ?? context?.selectFilter ?? (() => {});
  const onOpenFilterPanel = props.onOpenFilterPanel ?? (() => context?.setIsFilterPanelOpen(true));
  const today = getTodayISO();
  const [listsCollapsed, setListsCollapsed] = useState(false);
  const [tagsCollapsed, setTagsCollapsed] = useState(false);
  const [miniCalCollapsed, setMiniCalCollapsed] = useState(false);
  const [miniCalDate, setMiniCalDate] = useState(() => new Date());

  // New list dialog
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListColor, setNewListColor] = useState("#3b82f6");

  // Edit list dialog
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [editListName, setEditListName] = useState("");
  const [editListColor, setEditListColor] = useState("#3b82f6");

  // New tag dialog
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#818cf8");

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    await onAddList({ name: newListName.trim(), color: newListColor });
    setNewListName("");
    setShowAddList(false);
  }

  async function handleSaveEditList(e: React.FormEvent) {
    e.preventDefault();
    if (!editingList || !editListName.trim()) return;
    if (onUpdateList) {
      await onUpdateList({
        id: editingList.id,
        name: editListName.trim(),
        color: editListColor,
      });
    }
    setEditingList(null);
  }

  async function handleDeleteListClick(e: React.MouseEvent, listId: string, listName: string) {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete list "${listName}"? Tasks will be moved to Inbox.`)) {
      if (onDeleteList) {
        await onDeleteList(listId);
      }
    }
  }

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    await onAddTag({ name: newTagName.trim(), color: newTagColor });
    setNewTagName("");
    setShowAddTag(false);
  }

  async function handleDeleteTagClick(e: React.MouseEvent, tagId: string, tagName: string) {
    e.stopPropagation();
    if (confirm(`Remove tag #${tagName}?`)) {
      if (onDeleteTag) {
        await onDeleteTag(tagId);
      }
    }
  }

  const smartLists = [
    { id: "all", label: "All", icon: <ListTodo className="h-4 w-4 text-[var(--tt-muted)]" />, count: allCount },
    { id: "today", label: "Today", icon: <CalendarIcon className="h-4 w-4 text-[var(--tt-accent-text)]" />, count: todayCount },
    { id: "tomorrow", label: "Tomorrow", icon: <Sunrise className="h-4 w-4 text-amber-400" />, count: tomorrowCount },
    { id: "next7", label: "Next 7 Days", icon: <CalendarDays className="h-4 w-4 text-indigo-400" /> },
    { id: "inbox", label: "Inbox", icon: <Inbox className="h-4 w-4 text-blue-400" />, count: inboxCount },
    { id: "completed", label: "Completed", icon: <CheckCircle className="h-4 w-4 text-emerald-400" /> },
    { id: "trash", label: "Trash", icon: <Trash2 className="h-4 w-4 text-rose-400" /> },
  ];

  const colorPalette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];

  // Mini Calendar computations
  const calYear = miniCalDate.getFullYear();
  const calMonth = miniCalDate.getMonth();
  const calFirstDay = new Date(calYear, calMonth, 1);
  const calLastDay = new Date(calYear, calMonth + 1, 0);
  const calTotalDays = calLastDay.getDate();
  const calStartOffset = (calFirstDay.getDay() + 6) % 7;
  const miniCalLabel = miniCalDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <aside className="flex flex-col h-full w-64 border-r border-[var(--tt-border)] bg-[var(--tt-panel-alt)] select-none flex-shrink-0 overflow-y-auto">
      {/* Search Input */}
      <div className="p-3 border-b border-[var(--tt-border)]/80">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--tt-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel)] py-1.5 pl-8 pr-3 tt-label text-[var(--tt-text)] placeholder-[var(--tt-muted)] focus:border-[var(--tt-accent)] focus:outline-none"
          />
        </div>
      </div>

      <div className="p-2 space-y-4 flex-1">
        {/* Smart Lists */}
        <div className="space-y-0.5">
          {smartLists.map((item) => {
            const isSelected = activeView === item.id && !activeListId && !activeTag;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id, null, null)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 tt-label font-medium transition-colors ${ isSelected ? "bg-[var(--tt-accent)]/10 text-[var(--tt-accent-text)] dark:bg-[var(--tt-accent)]/15 font-bold" : "text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)]/60 dark:text-[var(--tt-muted)] dark:hover:bg-[var(--tt-panel-alt)]/60" }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="rounded-full bg-[var(--tt-panel-alt)]/80 px-1.5 py-0.5 tt-meta text-[var(--tt-text)] font-bold">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Smart Filters */}
        {(filters.length > 0 || onOpenFilterPanel) && (
          <div className="space-y-0.5">
            <div className="flex items-center justify-between px-2.5 pb-1">
              <span className="tt-overline font-semibold text-[var(--tt-muted)]">
                Filters
              </span>
              {onOpenFilterPanel && (
                <button
                  type="button"
                  onClick={onOpenFilterPanel}
                  title="Manage smart filters"
                  aria-label="Manage smart filters"
                  className="rounded p-0.5 text-[var(--tt-muted)] transition-colors hover:bg-[var(--tt-panel-alt)]/60 hover:text-[var(--tt-text)] dark:hover:bg-[var(--tt-panel-alt)] dark:hover:text-[var(--tt-text)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {filters.length === 0 && (
              <button
                type="button"
                onClick={onOpenFilterPanel}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 tt-label font-medium text-[var(--tt-muted)] transition-colors hover:bg-[var(--tt-panel-alt)]/60"
              >
                <Filter className="h-4 w-4" />
                <span>Create a filter</span>
              </button>
            )}

            {filters.map((filter) => {
              const isSelected = activeFilterId === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => onSelectFilter?.(isSelected ? null : filter.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 tt-label font-medium transition-colors ${ isSelected ? "bg-[var(--tt-accent)]/10 text-[var(--tt-accent-text)] font-bold" : "text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)]/60 dark:text-[var(--tt-muted)] dark:hover:bg-[var(--tt-panel-alt)]/60" }`}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: filter.color }}
                  />
                  <span className="truncate">{filter.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Custom Lists Section */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-[var(--tt-muted)]">
            <button
              type="button"
              onClick={() => setListsCollapsed(!listsCollapsed)}
              className="flex items-center gap-1 hover:text-[var(--tt-text)]"
            >
              {listsCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span className="tt-overline font-semibold">Lists</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddList(true)}
              title="Add List"
              className="rounded p-0.5 hover:bg-[var(--tt-panel-alt)] hover:text-[var(--tt-text)]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {!listsCollapsed && (
            <div className="space-y-0.5 mt-1">
              {lists.map((list) => {
                const isSelected = activeListId === list.id;
                const count = list._count?.tasks || 0;
                return (
                  <div
                    key={list.id}
                    onClick={() => onSelectView("list", list.id, null)}
                    className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 tt-label font-medium transition-colors cursor-pointer ${ isSelected ? "bg-[var(--tt-accent)]/10 text-[var(--tt-accent-text)] dark:bg-[var(--tt-accent)]/15 font-bold" : "text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)]/60 dark:text-[var(--tt-muted)] dark:hover:bg-[var(--tt-panel-alt)]/60" }`}
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: list.color }}
                      />
                      <span className="truncate">{list.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Count badge (hidden on group hover if actions exist) */}
                      {count > 0 && (
                        <span className="group-hover:hidden rounded-full bg-[var(--tt-panel-alt)]/80 px-1.5 py-0.5 tt-meta text-[var(--tt-text)] font-bold">
                          {count}
                        </span>
                      )}

                      {/* Action buttons on hover */}
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingList(list);
                            setEditListName(list.name);
                            setEditListColor(list.color);
                          }}
                          title="Edit List"
                          className="rounded p-0.5 text-[var(--tt-muted)] hover:text-white hover:bg-[var(--tt-panel-alt)]/50"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteListClick(e, list.id, list.name)}
                          title="Delete List"
                          className="rounded p-0.5 text-[var(--tt-muted)] hover:text-rose-400 hover:bg-[var(--tt-panel-alt)]/50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-[var(--tt-muted)]">
            <button
              type="button"
              onClick={() => setTagsCollapsed(!tagsCollapsed)}
              className="flex items-center gap-1 hover:text-[var(--tt-text)]"
            >
              {tagsCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span className="tt-overline font-semibold">Tags</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddTag(true)}
              title="Add Tag"
              className="rounded p-0.5 hover:bg-[var(--tt-panel-alt)] hover:text-[var(--tt-text)]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {!tagsCollapsed && (
            <div className="space-y-0.5 mt-1">
              {tags.map((tag) => {
                const isSelected = activeTag === tag.name;
                const count = tag._count?.tasks || 0;
                return (
                  <div
                    key={tag.id}
                    onClick={() => onSelectView("tag", null, tag.name)}
                    className={`group flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 tt-label font-medium transition-colors cursor-pointer ${ isSelected ? "bg-indigo-500/15 text-indigo-400 font-bold" : "text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)]/60 dark:text-[var(--tt-muted)] dark:hover:bg-[var(--tt-panel-alt)]/60" }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <TagIcon className="h-3 w-3 text-indigo-400 flex-shrink-0" />
                      <span className="truncate">#{tag.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {count > 0 && (
                        <span className="group-hover:hidden tt-meta text-[var(--tt-muted)]">{count}</span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDeleteTagClick(e, tag.id, tag.name)}
                        title="Delete Tag"
                        className="hidden group-hover:block rounded p-0.5 text-[var(--tt-muted)] hover:text-rose-400 hover:bg-[var(--tt-panel-alt)]/50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TickTick Signature Mini Calendar Widget */}
        <div className="border-t border-[var(--tt-border)]/80 pt-3">
          <div className="flex items-center justify-between px-2 py-1 text-[var(--tt-muted)]">
            <button
              type="button"
              onClick={() => setMiniCalCollapsed(!miniCalCollapsed)}
              className="flex items-center gap-1 hover:text-[var(--tt-text)]"
            >
              {miniCalCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              <span className="tt-overline font-semibold">Mini Calendar</span>
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMiniCalDate(new Date(calYear, calMonth - 1, 1))}
                className="rounded p-0.5 text-[var(--tt-muted)] hover:text-white hover:bg-[var(--tt-panel-alt)]"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="tt-meta font-semibold text-[var(--tt-muted)]">{miniCalLabel}</span>
              <button
                type="button"
                onClick={() => setMiniCalDate(new Date(calYear, calMonth + 1, 1))}
                className="rounded p-0.5 text-[var(--tt-muted)] hover:text-white hover:bg-[var(--tt-panel-alt)]"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {!miniCalCollapsed && (
            <div className="p-1 mt-1">
              <div className="grid grid-cols-7 gap-0.5 text-center tt-meta font-bold text-[var(--tt-muted)] uppercase pb-1">
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
                <span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center tt-meta">
                {Array.from({ length: calStartOffset }).map((_, i) => (
                  <span key={`off-${i}`} className="h-6 w-6" />
                ))}
                {Array.from({ length: calTotalDays }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateObj = new Date(calYear, calMonth, dayNum);
                  const iso = toISODate(dateObj);
                  const isToday = iso === today;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => onSelectDate?.(iso)}
                      className={`flex h-6 w-6 items-center justify-center rounded-md font-semibold transition-all ${ isToday ? "bg-[var(--tt-accent-strong)] text-white font-bold shadow-xs" : "text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)] hover:text-[var(--tt-text)] dark:text-[var(--tt-muted)] dark:hover:text-white" }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New List Modal */}
      {showAddList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xs rounded-xl border border-[var(--tt-border)] bg-[var(--tt-rail)] p-4 text-[var(--tt-text)] shadow-xl">
            <h4 className="tt-label font-semibold mb-3 uppercase tracking-wider">New List</h4>
            <form onSubmit={handleCreateList} className="space-y-3">
              <input
                type="text"
                required
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name (e.g. Work, Shopping)"
                className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-3 py-2 tt-label text-white focus:outline-none focus:border-[var(--tt-accent)]"
              />
              <div className="flex items-center gap-2">
                <span className="tt-label text-[var(--tt-muted)]">Color:</span>
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewListColor(c)}
                    className={`h-5 w-5 rounded-full ${newListColor === c ? "ring-2 ring-[var(--tt-panel)] ring-offset-1 ring-offset-[var(--tt-panel)]" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddList(false)}
                  className="rounded px-2.5 py-1 tt-label text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-[var(--tt-accent-strong)] px-3 py-1 tt-label font-medium text-white hover:bg-[var(--tt-accent-strong)]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit List Modal */}
      {editingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xs rounded-xl border border-[var(--tt-border)] bg-[var(--tt-rail)] p-4 text-[var(--tt-text)] shadow-xl">
            <h4 className="tt-label font-semibold mb-3 uppercase tracking-wider">Edit List</h4>
            <form onSubmit={handleSaveEditList} className="space-y-3">
              <input
                type="text"
                required
                autoFocus
                value={editListName}
                onChange={(e) => setEditListName(e.target.value)}
                placeholder="List name"
                className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-3 py-2 tt-label text-white focus:outline-none focus:border-[var(--tt-accent)]"
              />
              <div className="flex items-center gap-2">
                <span className="tt-label text-[var(--tt-muted)]">Color:</span>
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditListColor(c)}
                    className={`h-5 w-5 rounded-full ${editListColor === c ? "ring-2 ring-[var(--tt-panel)] ring-offset-1 ring-offset-[var(--tt-panel)]" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingList(null)}
                  className="rounded px-2.5 py-1 tt-label text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-[var(--tt-accent-strong)] px-3 py-1 tt-label font-medium text-white hover:bg-[var(--tt-accent-strong)]"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Tag Modal */}
      {showAddTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xs rounded-xl border border-[var(--tt-border)] bg-[var(--tt-rail)] p-4 text-[var(--tt-text)] shadow-xl">
            <h4 className="tt-label font-semibold mb-3 uppercase tracking-wider">New Tag</h4>
            <form onSubmit={handleCreateTag} className="space-y-3">
              <input
                type="text"
                required
                autoFocus
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name (e.g. urgent, idea)"
                className="w-full rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-3 py-2 tt-label text-white focus:outline-none focus:border-[var(--tt-accent)]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTag(false)}
                  className="rounded px-2.5 py-1 tt-label text-[var(--tt-muted)] hover:bg-[var(--tt-panel-alt)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-[var(--tt-accent-strong)] px-3 py-1 tt-label font-medium text-white hover:bg-[var(--tt-accent-strong)]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
