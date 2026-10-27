"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  Flame,
  Timer,
  Volume2,
  VolumeX,
  CloudRain,
  Radio,
  Clock,
} from "lucide-react";
import { Task, PomodoroStats } from "@/hooks/use-workspace";
import {
  playPomodoroBellSound,
  playClickSound,
  startAmbientSound,
  stopAmbientSound,
} from "@/lib/sound-utils";

interface PomodoroViewProps {
  tasks: Task[];
  stats: PomodoroStats;
  onLogPomodoro: (params: { taskId?: string; durationMinutes: number }) => Promise<any>;
}

type PomoMode = "focus" | "shortBreak" | "longBreak";
type AmbientType = "off" | "rain" | "whitenoise" | "clock";

const MODE_DURATIONS: Record<PomoMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export function PomodoroView({ tasks, stats, onLogPomodoro }: PomodoroViewProps) {
  const [mode, setMode] = useState<PomoMode>("focus");
  const [timeLeft, setTimeLeft] = useState<number>(MODE_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [ambientSound, setAmbientSound] = useState<AmbientType>("off");

  const activeTasks = tasks.filter((t) => !t.completed);

  // Timer interval effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Completed!
      setIsRunning(false);
      stopAmbientSound();
      playPomodoroBellSound();

      if (mode === "focus") {
        onLogPomodoro({
          taskId: selectedTaskId || undefined,
          durationMinutes: 25,
        });
        // Switch to short break
        setMode("shortBreak");
        setTimeLeft(MODE_DURATIONS.shortBreak);
      } else {
        // Break ended -> switch back to focus
        setMode("focus");
        setTimeLeft(MODE_DURATIONS.focus);
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, mode, selectedTaskId, onLogPomodoro]);

  // Ambient sound synthesizer effect
  useEffect(() => {
    if (isRunning && ambientSound !== "off") {
      const stopFn = startAmbientSound(ambientSound);
      return () => {
        stopFn();
      };
    } else {
      stopAmbientSound();
    }
  }, [isRunning, ambientSound]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  function switchMode(newMode: PomoMode) {
    setIsRunning(false);
    stopAmbientSound();
    setMode(newMode);
    setTimeLeft(MODE_DURATIONS[newMode]);
  }

  function toggleRunning() {
    playClickSound();
    setIsRunning(!isRunning);
  }

  function handleReset() {
    setIsRunning(false);
    stopAmbientSound();
    setTimeLeft(MODE_DURATIONS[mode]);
  }

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Circular progress calculations
  const totalSeconds = MODE_DURATIONS[mode];
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const strokeDashoffset = 565 - (565 * progressPercent) / 100;

  return (
    <div className="flex-1 flex flex-col items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4 sm:p-6 shadow-sm transition-colors max-w-2xl mx-auto w-full overflow-y-auto">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 rounded-xl bg-[var(--app-panel-alt)] p-1 w-full max-w-sm sm:max-w-none justify-center">
        <button
          type="button"
          onClick={() => switchMode("focus")}
          className={`rounded-lg px-2.5 sm:px-4 py-1.5 app-label font-semibold transition-all flex-1 sm:flex-initial text-center ${ mode === "focus" ? "bg-[var(--app-accent-strong)] text-white shadow-md shadow-[var(--app-accent)]/25" : "text-[var(--app-muted)] hover:text-[var(--app-text)] dark:text-[var(--app-muted)] dark:hover:text-white" }`}
        >
          <span className="hidden sm:inline">Pomodoro (25m)</span>
          <span className="sm:hidden">Focus 25m</span>
        </button>
        <button
          type="button"
          onClick={() => switchMode("shortBreak")}
          className={`rounded-lg px-2.5 sm:px-4 py-1.5 app-label font-semibold transition-all flex-1 sm:flex-initial text-center ${ mode === "shortBreak" ? "bg-[var(--app-accent-strong)] text-white shadow-md shadow-[var(--app-accent)]/25" : "text-[var(--app-muted)] hover:text-[var(--app-text)] dark:text-[var(--app-muted)] dark:hover:text-white" }`}
        >
          <span className="hidden sm:inline">Short Break (5m)</span>
          <span className="sm:hidden">Short 5m</span>
        </button>
        <button
          type="button"
          onClick={() => switchMode("longBreak")}
          className={`rounded-lg px-2.5 sm:px-4 py-1.5 app-label font-semibold transition-all flex-1 sm:flex-initial text-center ${ mode === "longBreak" ? "bg-[var(--app-accent-strong)] text-white shadow-md shadow-[var(--app-accent)]/25" : "text-[var(--app-muted)] hover:text-[var(--app-text)] dark:text-[var(--app-muted)] dark:hover:text-white" }`}
        >
          <span className="hidden sm:inline">Long Break (15m)</span>
          <span className="sm:hidden">Long 15m</span>
        </button>
      </div>

      {/* Task Linking Selector */}
      <div className="mt-4 w-full max-w-sm">
        <select
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-alt)] px-3 py-2 app-label text-[var(--app-text)] focus:outline-none focus:border-[var(--app-accent)] text-center"
        >
          <option value="">🎯 Link timer to a task (Optional)...</option>
          {activeTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} {t.pomodoroCount > 0 ? `(🍅 ${t.pomodoroCount})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Circular Progress Display */}
      <div className="relative my-6 flex items-center justify-center">
        <svg className="h-64 w-64 -rotate-90 transform" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            className="stroke-[var(--app-border)]"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            className="stroke-[var(--app-accent)] transition-all duration-500 ease-linear"
            strokeWidth="8"
            strokeDasharray="565"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-5xl leading-none font-semibold tracking-tight text-[var(--app-text)] font-mono tabular-nums">
            {timeFormatted}
          </span>
          <span className="app-overline font-semibold text-[var(--app-accent-text)] mt-2">
            {mode === "focus" ? "Stay Focused" : "Rest & Recharge"}
          </span>
        </div>
      </div>

      {/* Ambient Sound Switcher */}
      <div className="mb-4 flex flex-col items-center gap-1.5">
        <span className="app-overline font-semibold text-[var(--app-muted)]">
          Ambient Sound (Web Audio)
        </span>
        <div className="flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel-alt)] p-1">
          <button
            type="button"
            onClick={() => setAmbientSound("off")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 app-label font-medium transition-all ${ ambientSound === "off" ? "bg-[var(--app-panel)] text-[var(--app-text)] shadow-xs dark:bg-[var(--app-panel-alt)] dark:text-[var(--app-text)]" : "text-[var(--app-muted)] hover:text-[var(--app-text)] dark:text-[var(--app-muted)]" }`}
          >
            <VolumeX className="h-3.5 w-3.5" />
            <span>Off</span>
          </button>
          <button
            type="button"
            onClick={() => setAmbientSound("rain")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 app-label font-medium transition-all ${ ambientSound === "rain" ? "bg-[var(--app-accent-strong)] text-white shadow-xs" : "text-[var(--app-muted)] hover:text-[var(--app-text)] dark:text-[var(--app-muted)]" }`}
          >
            <CloudRain className="h-3.5 w-3.5" />
            <span>Rain</span>
          </button>
          <button
            type="button"
            onClick={() => setAmbientSound("whitenoise")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 app-label font-medium transition-all ${ ambientSound === "whitenoise" ? "bg-[var(--app-accent-strong)] text-white shadow-xs" : "text-[var(--app-muted)] hover:text-[var(--app-text)] dark:text-[var(--app-muted)]" }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>White Noise</span>
          </button>
          <button
            type="button"
            onClick={() => setAmbientSound("clock")}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 app-label font-medium transition-all ${ ambientSound === "clock" ? "bg-[var(--app-accent-strong)] text-white shadow-xs" : "text-[var(--app-muted)] hover:text-[var(--app-text)] dark:text-[var(--app-muted)]" }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Clock</span>
          </button>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleReset}
          title="Reset timer"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--app-border)] text-[var(--app-muted)] hover:bg-[var(--app-panel-alt)] transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={toggleRunning}
          className="flex h-14 w-28 items-center justify-center gap-2 rounded-2xl bg-[var(--app-accent-strong)] app-heading font-semibold text-white shadow-xl shadow-[var(--app-accent)]/25 hover:bg-[var(--app-accent-strong)] active:scale-95 transition-all"
        >
          {isRunning ? (
            <>
              <Pause className="h-5 w-5" /> Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5 fill-current" /> Start
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setTimeLeft(0);
          }}
          title="Skip to end"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--app-border)] text-[var(--app-muted)] hover:bg-[var(--app-panel-alt)] transition-colors"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>

      {/* Focus Stats Strip */}
      <div className="mt-8 grid grid-cols-2 gap-4 w-full border-t border-[var(--app-border)] pt-4">
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[var(--app-panel-alt)]">
          <span className="app-overline font-semibold text-[var(--app-muted)]">Today's Focus</span>
          <span className="app-title font-semibold text-[var(--app-accent-text)] mt-1">
            {stats.todayTotalMinutes} mins
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[var(--app-panel-alt)]">
          <span className="app-overline font-semibold text-[var(--app-muted)]">Pomodoros Completed</span>
          <span className="app-title font-semibold text-rose-500 mt-1">
            🍅 {stats.todayPomoCount}
          </span>
        </div>
      </div>
    </div>
  );
}
