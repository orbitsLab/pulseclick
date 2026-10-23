"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ModuleRail, TickTickModule } from "./module-rail";
import { TickTickSidebar } from "./sidebar";
import { TaskInputBar } from "./task-input-bar";
import { TaskListView } from "./task-list-view";
import { TaskKanbanView } from "./task-kanban-view";
import { TaskCalendarView } from "./task-calendar-view";
import { TimelineView } from "./timeline-view";
import { EisenhowerMatrixView } from "./eisenhower-matrix-view";
import { PomodoroView } from "./pomodoro-view";
import { HabitView } from "./habit-view";
import { CountdownView } from "./countdown-view";
import { StatisticsView } from "./statistics-view";
import { SettingsView } from "./settings-view";
import { TaskInspector } from "./task-inspector";
import { CommandPalette } from "./command-palette";
import { QuickAddModal } from "./quick-add-modal";
import { FilterPanel } from "./filter-panel";
import { ThemePicker } from "./theme-picker";
import { useTickTick } from "@/hooks/use-ticktick";
import { applyTheme, DEFAULT_THEME_ID } from "@/lib/themes";
import {
  ListTodo,
  Columns3,
  CheckCircle2,
  Command,
  Search,
  Plus,
  GanttChartSquare,
} from "lucide-react";

interface TickTickAppProps {
  user: { email: string; name?: string | null } | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onThemeChange?: (themeId: string) => void;
}

export function TickTickApp({
  user,
  isDark,
  onToggleTheme,
  onLogout,
  onThemeChange,
}: TickTickAppProps) {
  // Navigation State
  const [activeModule, setActiveModule] = useState<TickTickModule>("tasks");
  const [activeView, setActiveView] = useState<string>("today");
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statsRange, setStatsRange] = useState<"week" | "month" | "quarter" | "year">(
    "month"
  );

  // Task View layout switcher (List vs Kanban)
  const [taskLayout, setTaskLayout] = useState<"list" | "kanban">("list");

  // Selected task for Right Pane Inspector
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Floating Quick Add modal state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Filter & theme panels
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  // Global keydown listener for Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // TickTick TanStack Query Hook
  const {
    tasks,
    lists,
    inboxCount,
    todayCount,
    tomorrowCount,
    allCount,
    tags,
    pomodoroStats,
    habits,
    filters,
    countdowns,
    stats,
    isLoadingStats,
    settings,
    reminders,
    members,
    assignees,
    subscriptions,
    toggleComplete,
    addTask,
    updateTask,
    deleteTask,
    batchAction,
    addList,
    updateList,
    deleteList,
    addTag,
    deleteTag,
    logPomodoro,
    addHabit,
    toggleHabitCheck,
    deleteHabit,
    createFilter,
    updateFilter,
    deleteFilter,
    addCountdown,
    updateCountdown,
    deleteCountdown,
    updateSettings,
    addReminder,
    updateReminder,
    deleteReminder,
    inviteMember,
    updateMember,
    removeMember,
    setAssignees,
    addSubscription,
    deleteSubscription,
    syncSubscription,
  } = useTickTick({
    view: activeModule === "timeline" ? "timeline" : activeView,
    listId: activeListId,
    tag: activeTag,
    search: searchQuery,
    filterId: activeFilterId,
    statsRange,
    remindersTaskId: selectedTaskId,
    assigneesTaskId: selectedTaskId,
  });

  // Publish the workspace theme as CSS custom properties.
  useEffect(() => {
    applyTheme(settings?.themeId ?? DEFAULT_THEME_ID);
  }, [settings?.themeId]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  // View Title calculation
  let currentListName = "Today";
  if (activeListId) {
    const l = lists.find((item) => item.id === activeListId);
    currentListName = l ? l.name : "List";
  } else if (activeTag) {
    currentListName = `#${activeTag}`;
  } else {
    switch (activeView) {
      case "all":
        currentListName = "All Tasks";
        break;
      case "today":
        currentListName = "Today";
        break;
      case "tomorrow":
        currentListName = "Tomorrow";
        break;
      case "next7":
        currentListName = "Next 7 Days";
        break;
      case "inbox":
        currentListName = "Inbox";
        break;
      case "completed":
        currentListName = "Completed";
        break;
      case "trash":
        currentListName = "Trash";
        break;
      default:
        currentListName = "Tasks";
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--tt-panel-alt)] text-[var(--tt-text)] relative">
      {/* 1. Far Left Module Icon Rail */}
      <ModuleRail
        activeModule={activeModule}
        onSelectModule={(mod) => {
          setActiveModule(mod);
          setSelectedTaskId(null);
        }}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        user={user}
        onLogout={onLogout}
        onOpenThemePicker={() => setIsThemePickerOpen(true)}
      />

      {/* 2. TickTick Main Workspace (3-pane layout) */}
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Navigation Sidebar (Shown on Tasks and Calendar) */}
        {(activeModule === "tasks" || activeModule === "calendar") && (
          <TickTickSidebar
            activeView={activeView}
            activeListId={activeListId}
            activeTag={activeTag}
            onSelectView={(v, lId, tag) => {
              setActiveView(v);
              setActiveListId(lId || null);
              setActiveTag(tag || null);
              setActiveFilterId(null);
              setSelectedTaskId(null);
            }}
            onSelectDate={(dateIso) => {
              setActiveModule("calendar");
            }}
            lists={lists}
            inboxCount={inboxCount}
            todayCount={todayCount}
            tomorrowCount={tomorrowCount}
            allCount={allCount}
            tags={tags}
            onAddList={addList}
            onUpdateList={updateList}
            onDeleteList={deleteList}
            onAddTag={addTag}
            onDeleteTag={deleteTag}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters.map((f: any) => ({
              id: f.id,
              name: f.name,
              icon: f.icon,
              color: f.color,
            }))}
            activeFilterId={activeFilterId}
            onSelectFilter={(filterId) => {
              setActiveFilterId(filterId);
              setActiveListId(null);
              setActiveTag(null);
              setActiveModule("tasks");
              setSelectedTaskId(null);
            }}
            onOpenFilterPanel={() => setIsFilterPanelOpen(true)}
          />
        )}

        {/* Middle Main Workspace */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--tt-panel)] p-4 sm:p-6">
          {/* View Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--tt-border)]/80">
            <div className="flex items-center gap-3">
              <h1 className="tt-display text-[var(--tt-text)] capitalize">
                {activeModule === "matrix"
                  ? "Eisenhower Matrix"
                  : activeModule === "pomodoro"
                  ? "Pomodoro Focus Timer"
                  : activeModule === "calendar"
                  ? "Calendar Schedule"
                  : activeModule === "timeline"
                  ? "Timeline"
                  : activeModule === "countdown"
                  ? "Countdowns"
                  : activeModule === "statistics"
                  ? "Statistics"
                  : activeModule === "settings"
                  ? "Settings"
                  : activeModule === "habits"
                  ? "Habit Tracker"
                  : activeFilterId
                  ? filters.find((f: any) => f.id === activeFilterId)?.name || currentListName
                  : currentListName}
              </h1>
              {activeModule === "tasks" && (
                <span className="rounded-full bg-[var(--tt-panel-alt)] px-2 py-0.5 tt-label font-semibold text-[var(--tt-muted)]">
                  {tasks.filter((t) => !t.completed).length}
                </span>
              )}
            </div>

            {/* Right Header: Cmd+K Command Palette Trigger & Layout switcher buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] px-2.5 py-1 tt-label text-[var(--tt-muted)] hover:text-[var(--tt-text)] hover:bg-[var(--tt-panel-alt)] dark:hover:text-[var(--tt-text)] transition-colors cursor-pointer"
                title="Open Command Palette (Cmd+K)"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search / Commands</span>
                <kbd className="hidden sm:inline-block rounded bg-[var(--tt-panel-alt)] px-1 tt-meta font-mono">
                  ⌘K
                </kbd>
              </button>

              {activeModule === "tasks" && (
                <div className="flex items-center rounded-lg border border-[var(--tt-border)] bg-[var(--tt-panel-alt)] p-0.5">
                  <button
                    type="button"
                    onClick={() => setTaskLayout("list")}
                    title="List View"
                    className={`rounded-md p-1.5 transition-colors ${ taskLayout === "list" ? "bg-[var(--tt-panel)] text-[var(--tt-accent-text)] shadow-xs dark:bg-[var(--tt-panel-alt)] dark:text-[var(--tt-accent-text)]" : "text-[var(--tt-muted)] hover:text-[var(--tt-text)] dark:text-[var(--tt-muted)]" }`}
                  >
                    <ListTodo className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskLayout("kanban")}
                    title="Kanban Board View"
                    className={`rounded-md p-1.5 transition-colors ${ taskLayout === "kanban" ? "bg-[var(--tt-panel)] text-[var(--tt-accent-text)] shadow-xs dark:bg-[var(--tt-panel-alt)] dark:text-[var(--tt-accent-text)]" : "text-[var(--tt-muted)] hover:text-[var(--tt-text)] dark:text-[var(--tt-muted)]" }`}
                  >
                    <Columns3 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content Rendering based on Module */}
          {activeModule === "tasks" && (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <TaskInputBar
                currentListName={currentListName}
                currentListId={activeListId}
                lists={lists}
                tags={tags}
                onAddTask={addTask}
              />

              {taskLayout === "list" ? (
                <TaskListView
                  tasks={tasks}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={(id) => setSelectedTaskId(id)}
                  onToggleComplete={(id, completed) => toggleComplete({ taskId: id, completed })}
                  onTogglePin={(id, isPinned) => updateTask({ taskId: id, isPinned })}
                  onDeleteTask={(id) => deleteTask({ taskId: id })}
                  onUpdateTask={updateTask}
                  onBatchAction={batchAction}
                  viewName={currentListName}
                />
              ) : (
                <TaskKanbanView
                  tasks={tasks}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={(id) => setSelectedTaskId(id)}
                  onUpdateStatus={(id, kanbanStatus) =>
                    updateTask({
                      taskId: id,
                      kanbanStatus,
                      completed: kanbanStatus === "DONE",
                    })
                  }
                  onQuickAdd={(status) =>
                    addTask({
                      title: "New Task",
                      listId: activeListId,
                      kanbanStatus: status,
                    })
                  }
                />
              )}
            </div>
          )}

          {activeModule === "calendar" && (
            <TaskCalendarView
              tasks={tasks}
              onSelectTask={(id) => setSelectedTaskId(id)}
              onAddTaskForDate={(dueDate) =>
                addTask({
                  title: "Scheduled Task",
                  dueDate,
                  listId: activeListId,
                })
              }
            />
          )}

          {activeModule === "timeline" && (
            <TimelineView
              tasks={tasks.map((t) => ({
                id: t.id,
                title: t.title,
                startDate: t.startDate,
                startTime: t.startTime,
                endDate: t.endDate,
                endTime: t.endTime,
                durationMinutes: t.durationMinutes,
                priority: t.priority,
                completed: t.completed,
                list: t.list ? { id: t.list.id, name: t.list.name, color: t.list.color } : null,
              }))}
              onSelectTask={(id) => setSelectedTaskId(id)}
              onUpdateTask={(updates) => updateTask(updates as any)}
            />
          )}

          {activeModule === "countdown" && (
            <CountdownView
              countdowns={countdowns}
              onAddCountdown={addCountdown}
              onUpdateCountdown={(id, updates) => updateCountdown({ id, ...updates })}
              onDeleteCountdown={deleteCountdown}
            />
          )}

          {activeModule === "statistics" && stats && (
            <StatisticsView
              stats={stats}
              range={statsRange}
              onRangeChange={setStatsRange}
              isLoading={isLoadingStats}
            />
          )}

          {activeModule === "settings" && (
            <SettingsView
              subscriptions={subscriptions}
              lists={lists}
              timezone={settings?.timezone ?? "UTC"}
              themeId={settings?.themeId ?? "ticktick-blue"}
              onAddSubscription={addSubscription}
              onDeleteSubscription={deleteSubscription}
              onSyncSubscription={syncSubscription}
              onUpdateSettings={updateSettings}
              onUpdateList={updateList as any}
              onOpenThemePicker={() => setIsThemePickerOpen(true)}
            />
          )}

          {activeModule === "habits" && (
            <HabitView
              habits={habits}
              onToggleHabitCheck={toggleHabitCheck}
              onAddHabit={addHabit}
              onDeleteHabit={deleteHabit}
            />
          )}

          {activeModule === "matrix" && (
            <EisenhowerMatrixView
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={(id) => setSelectedTaskId(id)}
              onToggleComplete={(id, completed) => toggleComplete({ taskId: id, completed })}
              onAddTask={addTask}
            />
          )}

          {activeModule === "pomodoro" && (
            <PomodoroView
              tasks={tasks}
              stats={pomodoroStats}
              onLogPomodoro={logPomodoro}
            />
          )}
        </main>

        {/* 3. Right Pane Task Detail Inspector */}
        {selectedTask && (
          <TaskInspector
            task={selectedTask}
            lists={lists}
            tags={tags}
            onClose={() => setSelectedTaskId(null)}
            onUpdateTask={updateTask}
            onDeleteTask={(id) => deleteTask({ taskId: id })}
            reminders={reminders}
            members={members}
            assignees={assignees}
            onCreateReminder={addReminder}
            onUpdateReminder={(id, updates) => updateReminder({ id, ...updates })}
            onDeleteReminder={deleteReminder}
            onInviteMember={inviteMember}
            onUpdateMember={(memberId, updates) => updateMember({ memberId, ...updates })}
            onRemoveMember={removeMember}
            onAssign={(taskId, memberIds) => setAssignees({ taskId, memberIds })}
          />
        )}
      </div>

      {/* Floating Global Quick Add Button (TickTick Signature) */}
      <button
        type="button"
        onClick={() => setIsQuickAddOpen(true)}
        title="Quick Add Task (+)"
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--tt-accent-strong)] text-white shadow-xl shadow-[var(--tt-accent)]/35 hover:bg-[var(--tt-accent-strong)] active:scale-90 transition-all hover:rotate-90 duration-200 cursor-pointer"
      >
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </button>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        lists={lists}
        tags={tags}
        onAddTask={addTask}
      />

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        lists={lists}
        tags={tags}
        onSelectModule={(mod) => {
          setActiveModule(mod);
          setSelectedTaskId(null);
        }}
        onSelectView={(v, lId, tag) => {
          setActiveView(v);
          setActiveListId(lId || null);
          setActiveTag(tag || null);
          setActiveFilterId(null);
          setSelectedTaskId(null);
        }}
        onSelectTask={(taskId) => {
          setSelectedTaskId(taskId);
        }}
      />

      {/* Smart Filter Panel */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={filters.map((f: any) => ({
          id: f.id,
          name: f.name,
          icon: f.icon,
          color: f.color,
          query: f.query ?? {},
        }))}
        lists={lists.map((l) => ({ id: l.id, name: l.name, color: l.color }))}
        tags={tags.map((t) => ({ id: t.id, name: t.name, color: t.color }))}
        onCreateFilter={createFilter}
        onUpdateFilter={(id, updates) => updateFilter({ id, ...updates })}
        onDeleteFilter={deleteFilter}
        onApplyFilter={(filterId: string) => {
          setActiveFilterId(filterId);
          setActiveListId(null);
          setActiveTag(null);
          setActiveModule("tasks");
          setIsFilterPanelOpen(false);
          setSelectedTaskId(null);
        }}
      />

      {/* Theme Picker */}
      <ThemePicker
        isOpen={isThemePickerOpen}
        onClose={() => setIsThemePickerOpen(false)}
        themeId={settings?.themeId ?? "ticktick-blue"}
        onSelectTheme={(themeId: string) => {
          applyTheme(themeId);
          if (onThemeChange) {
            onThemeChange(themeId);
          } else {
            updateSettings({ themeId });
          }
        }}
      />
    </div>
  );
}
