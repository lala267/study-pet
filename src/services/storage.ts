import type { PersistedTimerState, TimerSettings } from "../types/timer";
import {
  DEFAULT_BREAK_MINUTES,
  DEFAULT_FOCUS_MINUTES,
  getTodayKey
} from "../utils/time";

const STORAGE_KEY = "desktop-study-pet-timer";

const defaultSettings: TimerSettings = {
  mode: "stopwatch",
  focusMinutes: DEFAULT_FOCUS_MINUTES,
  breakMinutes: DEFAULT_BREAK_MINUTES
};

function sanitizeMinutes(value: unknown, fallback: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(1, Math.floor(value)));
}

export function getDefaultPersistedState(): PersistedTimerState {
  return {
    settings: { ...defaultSettings },
    dailyProgress: {
      dateKey: getTodayKey(),
      totalFocusSeconds: 0
    }
  };
}

export function loadPersistedState(): PersistedTimerState {
  if (typeof window === "undefined") {
    return getDefaultPersistedState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return getDefaultPersistedState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedTimerState>;
    const fallback = getDefaultPersistedState();
    const todayKey = getTodayKey();
    const savedDate = parsed.dailyProgress?.dateKey;

    return {
      settings: {
        mode: "stopwatch",
        focusMinutes: sanitizeMinutes(
          parsed.settings?.focusMinutes,
          fallback.settings.focusMinutes,
          180
        ),
        breakMinutes: sanitizeMinutes(
          parsed.settings?.breakMinutes,
          fallback.settings.breakMinutes,
          60
        )
      },
      dailyProgress: {
        dateKey: todayKey,
        totalFocusSeconds:
          savedDate === todayKey
            ? parsed.dailyProgress?.totalFocusSeconds ?? 0
            : 0
      }
    };
  } catch {
    return getDefaultPersistedState();
  }
}

export function savePersistedState(state: PersistedTimerState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
