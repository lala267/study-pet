export type TimerMode = "stopwatch" | "pomodoro";

export type SessionStatus = "idle" | "running" | "paused" | "celebrating";

export type PomodoroPhase = "focus" | "break";

export type PetState = "idle" | "focus" | "break" | "paused" | "celebrate";

export interface TimerSettings {
  mode: TimerMode;
  focusMinutes: number;
  breakMinutes: number;
}

export interface DailyProgress {
  dateKey: string;
  totalFocusSeconds: number;
}

export interface PersistedTimerState {
  settings: TimerSettings;
  dailyProgress: DailyProgress;
}

export interface TimerState {
  status: SessionStatus;
  mode: TimerMode;
  phase: PomodoroPhase;
  elapsedSeconds: number;
  remainingSeconds: number | null;
  completedRounds: number;
  settings: TimerSettings;
  dailyProgress: DailyProgress;
}
