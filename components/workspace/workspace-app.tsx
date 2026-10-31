"use client";

import React, { useEffect } from "react";
import { ModuleRail } from "./module-rail";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { WorkspaceSidebar } from "./sidebar";
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
import { SyncIndicator } from "./sync-indicator";
import { WorkspaceProvider, useWorkspaceContext } from "@/context/workspace-context";
import { applyTheme, DEFAULT_THEME_ID, getListBackground, LIST_BACKGROUNDS } from "@/lib/themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notify } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  ListTodo,
  Columns3,
  Search,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Check,
  Folder,
} from "lucide-react";

interface WorkspaceAppProps {
  user: { email: string; name?: string | null } | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onThemeChange?: (themeId: string) => void;
}

function WorkspaceContainer({
  user,
  isDark,
  onToggleTheme,
  onLogout,
  onThemeChange,
}: WorkspaceAppProps) {
  const {
    activeModule,
    setActiveModule,
    activeView,
    activeListId,
    activeGroupId,
    activeTag,
    activeFilterId,
    setActiveFilterId,
    searchQuery,
    setSearchQuery,
    statsRange,
    setStatsRange,
    taskLayout,
    setTaskLayout,
    selectedTaskId,
    setSelectedTaskId,
    selectedTask,
    currentListName,
    currentList,
    currentGroup,
    calView,
    setCalView,
    calDate,
    setCalDate,
    selectView,
    selectFilter,
    selectModule,

    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isQuickAddOpen,
    setIsQuickAddOpen,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    isThemePickerOpen,
    setIsThemePickerOpen,
    isSidebarOpen,
    toggleSidebar,

    tasks,
    isLoadingTasks,
    isInitialLoadingTasks,
    lists,
    isInitialLoadingLists,
    inboxCount,
    todayCount,
    tomorrowCount,
    allCount,
    tags,
    isInitialLoadingTags,
    pomodoroStats,
    filters,
    isInitialLoadingFilters,
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
    addList,
    updateList,
    deleteList,
    addTag,
    deleteTag,
    logPomodoro,
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
  } = useWorkspaceContext();

  // Publish workspace theme as CSS variables
  useEffect(() => {
    applyTheme(settings?.themeId ?? DEFAULT_THEME_ID);
  }, [settings?.themeId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--app-panel-alt)] text-[var(--app-text)] relative">
      {/* 1. Far Left Module Icon Rail */}
      <ModuleRail
        activeModule={activeModule}
        onSelectModule={selectModule}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        user={user}
        onLogout={onLogout}
        onOpenThemePicker={() => setIsThemePickerOpen(true)}
      />

      {/* 2. Main Workspace (3-pane layout) */}
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Navigation Sidebar (Shown on Tasks only; hidden in Calendar view) */}
        {activeModule === "tasks" && (
          <WorkspaceSidebar
            activeView={activeView}
            activeListId={activeListId}
            activeTag={activeTag}
            onSelectView={selectView}
            onSelectDate={(_dateIso) => {
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
            onSelectFilter={selectFilter}
            onOpenFilterPanel={() => setIsFilterPanelOpen(true)}
            isCollapsed={!isSidebarOpen}
            onToggleCollapse={toggleSidebar}
            isInitialLoadingLists={isInitialLoadingLists}
            isInitialLoadingTags={isInitialLoadingTags}
            isInitialLoadingFilters={isInitialLoadingFilters}
          />
        )}

        {/* Middle Main Workspace */}
        {(() => {
          const activeListBackground = currentList?.background ? getListBackground(currentList.background) : null;
          const isCustom = Boolean(
            activeModule === "tasks" && currentList && activeListBackground && activeListBackground.id !== "none"
          );

          return (
            <main className="relative flex-1 flex flex-col h-full overflow-hidden bg-[var(--app-panel)] p-3.5 sm:p-6 pb-20 md:pb-6 min-w-0">
              {/* Ambient atmospheric canvas glow when a list background is active */}
              {isCustom && currentList && activeListBackground && (
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-25 dark:opacity-15 blur-3xl z-0"
                  style={{ background: activeListBackground.css }}
                />
              )}

              {/* View Header: Custom List Hero Banner vs Standard Header */}
              {isCustom && currentList && activeListBackground ? (
                <div
                  className="relative overflow-hidden rounded-2xl border border-[var(--app-border)]/80 p-3.5 sm:p-4 mb-3.5 shadow-sm shrink-0 transition-all z-10"
                  style={{ background: activeListBackground.css }}
                >
                  {/* Adaptive glass overlay ensuring high-contrast legible text across themes */}
                  <div className="absolute inset-0 bg-white/50 dark:bg-black/60 backdrop-blur-[2px] pointer-events-none" />

                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={toggleSidebar}
                        title={isSidebarOpen ? "Collapse sidebar (Ctrl+B)" : "Expand sidebar (Ctrl+B)"}
                        aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        className={cn(
                          "p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 flex items-center justify-center bg-[var(--app-panel)]/80 backdrop-blur",
                          isSidebarOpen
                            ? "border-[var(--app-border)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                            : "border-[var(--app-accent)]/50 text-[var(--app-accent-text)] bg-[var(--app-accent)]/15"
                        )}
                      >
                        {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                      </button>

                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl shadow-xs"
                          style={{
                            backgroundColor: currentList.color || "var(--app-accent)",
                            color: "#ffffff",
                          }}
                        >
                          <Folder className="h-4 w-4" />
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h1 className="text-lg sm:text-2xl font-bold text-[var(--app-text)] font-sans tracking-tight truncate">
                              {currentList.name}
                            </h1>
                            <span className="rounded-full bg-[var(--app-panel)]/80 backdrop-blur border border-[var(--app-border)] px-2 py-0.5 app-meta font-bold text-[var(--app-muted)] shrink-0">
                              {tasks.filter((t) => !t.completed).length} open
                            </span>
                          </div>
                          <p className="app-meta text-[var(--app-muted)] flex items-center gap-1.5 mt-0.5">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: currentList.color || "var(--app-accent)" }}
                            />
                            <span>{activeListBackground.name} backdrop</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Header Controls inside banner */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <SyncIndicator />

                      {/* Backdrop Quick Picker Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            title={`Current backdrop: ${activeListBackground.name}. Click to change.`}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)]/85 backdrop-blur px-2.5 py-1 app-label text-[var(--app-text)] hover:bg-[var(--app-panel)] transition-all cursor-pointer shadow-xs"
                          >
                            <Palette className="h-3.5 w-3.5 text-[var(--app-accent-text)]" />
                            <span className="hidden sm:inline font-medium">{activeListBackground.name}</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-64 p-3 bg-[var(--app-panel)] border-[var(--app-border)] text-[var(--app-text)] shadow-xl rounded-xl z-50"
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--app-border)]">
                            <span className="app-label font-semibold text-[var(--app-text)]">List Backdrop</span>
                            <span className="app-meta text-[var(--app-muted)]">20 presets</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto p-0.5 custom-scrollbar">
                            {LIST_BACKGROUNDS.map((bg) => {
                              const active = (currentList.background || "none") === bg.id;
                              return (
                                <button
                                  key={bg.id}
                                  type="button"
                                  title={bg.name}
                                  onClick={async () => {
                                    try {
                                      await updateList({ id: currentList.id, background: bg.id });
                                      notify.success("Backdrop updated", `${bg.name} set for ${currentList.name}`);
                                    } catch (err: any) {
                                      notify.error("Failed to update backdrop", err?.message || "Please try again.");
                                    }
                                  }}
                                  style={{ background: bg.css }}
                                  className={cn(
                                    "h-8 rounded-lg border transition-all cursor-pointer relative",
                                    active
                                      ? "border-[var(--app-accent)] ring-2 ring-[var(--app-accent)]/50 scale-105"
                                      : "border-[var(--app-border)] hover:scale-105 hover:border-[var(--app-accent)]/50"
                                  )}
                                >
                                  {active && (
                                    <span className="flex h-full items-center justify-center bg-black/25 rounded-md">
                                      <Check className="h-3.5 w-3.5 text-white stroke-[3] drop-shadow-xs" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <button
                        type="button"
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)]/85 backdrop-blur px-2.5 py-1 app-label text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-panel)] transition-colors cursor-pointer shadow-xs"
                        title="Open Command Palette (Cmd+K)"
                      >
                        <Search className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Search</span>
                        <kbd className="hidden sm:inline-block rounded bg-[var(--app-panel-alt)] px-1 app-meta font-mono">
                          ⌘K
                        </kbd>
                      </button>

                      <div className="flex items-center rounded-lg border border-[var(--app-border)] bg-[var(--app-panel)]/85 backdrop-blur p-0.5 shadow-xs">
                        <button
                          type="button"
                          onClick={() => setTaskLayout("list")}
                          title="List View"
                          className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                            taskLayout === "list"
                              ? "bg-[var(--app-panel)] text-[var(--app-accent-text)] shadow-xs"
                              : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                          }`}
                        >
                          <ListTodo className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskLayout("kanban")}
                          title="Kanban Board View"
                          className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                            taskLayout === "kanban"
                              ? "bg-[var(--app-panel)] text-[var(--app-accent-text)] shadow-xs"
                              : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                          }`}
                        >
                          <Columns3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--app-border)]/80 gap-2 shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {activeModule === "tasks" && (
                      <button
                        type="button"
                        onClick={toggleSidebar}
                        title={isSidebarOpen ? "Collapse sidebar (Ctrl+B)" : "Expand sidebar (Ctrl+B)"}
                        aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        className={cn(
                          "p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 flex items-center justify-center",
                          isSidebarOpen
                            ? "border-[var(--app-border)] bg-[var(--app-panel-alt)] text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-panel-alt)]/80"
                            : "border-[var(--app-accent)]/40 bg-[var(--app-accent)]/10 text-[var(--app-accent-text)] hover:bg-[var(--app-accent)]/20 shadow-xs"
                        )}
                      >
                        {isSidebarOpen ? (
                          <PanelLeftClose className="h-4 w-4" />
                        ) : (
                          <PanelLeftOpen className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    {currentGroup && !currentList && (
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: currentGroup.color || "#4772fa" }}
                      />
                    )}

                    <h1 className="text-lg sm:text-2xl md:app-display font-semibold text-[var(--app-text)] capitalize truncate">
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
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="rounded-full bg-[var(--app-panel-alt)] px-2 py-0.5 app-meta font-bold text-[var(--app-muted)]">
                          {tasks.filter((t) => !t.completed).length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Header: Sync Indicator, Backdrop Quick Picker, Cmd+K & Layout switcher */}
                  <div className="flex items-center gap-2">
                    <SyncIndicator />

                    {activeModule === "tasks" && currentList && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            title="Customize list backdrop"
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-alt)] px-2.5 py-1 app-label text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-panel-alt)]/80 transition-colors cursor-pointer"
                          >
                            <Palette className="h-3.5 w-3.5 text-[var(--app-accent-text)]" />
                            <span className="hidden sm:inline">Backdrop</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-64 p-3 bg-[var(--app-panel)] border-[var(--app-border)] text-[var(--app-text)] shadow-xl rounded-xl z-50"
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--app-border)]">
                            <span className="app-label font-semibold text-[var(--app-text)]">List Backdrop</span>
                            <span className="app-meta text-[var(--app-muted)]">20 presets</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto p-0.5 custom-scrollbar">
                            {LIST_BACKGROUNDS.map((bg) => {
                              const active = (currentList.background || "none") === bg.id;
                              return (
                                <button
                                  key={bg.id}
                                  type="button"
                                  title={bg.name}
                                  onClick={async () => {
                                    try {
                                      await updateList({ id: currentList.id, background: bg.id });
                                      notify.success("Backdrop updated", `${bg.name} set for ${currentList.name}`);
                                    } catch (err: any) {
                                      notify.error("Failed to update backdrop", err?.message || "Please try again.");
                                    }
                                  }}
                                  style={{ background: bg.css }}
                                  className={cn(
                                    "h-8 rounded-lg border transition-all cursor-pointer relative",
                                    active
                                      ? "border-[var(--app-accent)] ring-2 ring-[var(--app-accent)]/50 scale-105"
                                      : "border-[var(--app-border)] hover:scale-105 hover:border-[var(--app-accent)]/50"
                                  )}
                                >
                                  {active && (
                                    <span className="flex h-full items-center justify-center bg-black/25 rounded-md">
                                      <Check className="h-3.5 w-3.5 text-white stroke-[3] drop-shadow-xs" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsCommandPaletteOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-alt)] px-2.5 py-1 app-label text-[var(--app-muted)] hover:text-[var(--app-text)] hover:bg-[var(--app-panel-alt)] dark:hover:text-[var(--app-text)] transition-colors cursor-pointer"
                      title="Open Command Palette (Cmd+K)"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Search / Commands</span>
                      <kbd className="hidden sm:inline-block rounded bg-[var(--app-panel-alt)] px-1 app-meta font-mono">
                        ⌘K
                      </kbd>
                    </button>

                    {activeModule === "tasks" && (
                      <div className="flex items-center rounded-lg border border-[var(--app-border)] bg-[var(--app-panel-alt)] p-0.5">
                        <button
                          type="button"
                          onClick={() => setTaskLayout("list")}
                          title="List View"
                          className={`rounded-md p-1.5 transition-colors ${
                            taskLayout === "list"
                              ? "bg-[var(--app-panel)] text-[var(--app-accent-text)] shadow-xs dark:bg-[var(--app-panel-alt)] dark:text-[var(--app-accent-text)]"
                              : "text-[var(--app-muted)] hover:text-[var(--app-text)] dark:text-[var(--app-muted)]"
                          }`}
                        >
                          <ListTodo className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskLayout("kanban")}
                          title="Kanban Board View"
                          className={`rounded-md p-1.5 transition-colors ${
                            taskLayout === "kanban"
                              ? "bg-[var(--app-panel)] text-[var(--app-accent-text)] shadow-xs dark:bg-[var(--app-panel-alt)] dark:text-[var(--app-accent-text)]"
                              : "text-[var(--app-muted)] hover:text-[var(--app-text)] dark:text-[var(--app-muted)]"
                          }`}
                        >
                          <Columns3 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

          {/* Content Rendering based on Module */}
          {activeModule === "tasks" && (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <TaskInputBar />

              {taskLayout === "list" ? (
                <TaskListView />
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
              calView={calView}
              onCalViewChange={setCalView}
              currentDate={calDate}
              onDateChange={setCalDate}
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
              isLoading={isInitialLoadingTasks}
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
              themeId={settings?.themeId ?? "flow-blue"}
              onAddSubscription={addSubscription}
              onDeleteSubscription={deleteSubscription}
              onSyncSubscription={syncSubscription}
              onUpdateSettings={updateSettings}
              onUpdateList={updateList as any}
              onOpenThemePicker={() => setIsThemePickerOpen(true)}
            />
          )}

          {activeModule === "habits" && <HabitView />}

          {activeModule === "matrix" && (
            <EisenhowerMatrixView
              tasks={tasks}
              isLoading={isInitialLoadingTasks}
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
      );
    })()}

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

      {/* Mobile Bottom Navigation Bar (Visible on mobile screens) */}
      <MobileBottomNav
        activeModule={activeModule}
        onSelectModule={selectModule}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onOpenThemePicker={() => setIsThemePickerOpen(true)}
        user={user}
        onLogout={onLogout}
      />

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
        onSelectModule={selectModule}
        onSelectView={selectView}
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
        onApplyFilter={selectFilter}
      />

      {/* Theme Picker */}
      <ThemePicker
        isOpen={isThemePickerOpen}
        onClose={() => setIsThemePickerOpen(false)}
        themeId={settings?.themeId ?? "flow-blue"}
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

export function WorkspaceApp(props: WorkspaceAppProps) {
  return (
    <WorkspaceProvider>
      <WorkspaceContainer {...props} />
    </WorkspaceProvider>
  );
}
