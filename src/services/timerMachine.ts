import type {
  DailyProgress,
  PetState,
  PomodoroPhase,
  SessionStatus,
  TimerMode,
  TimerSettings,
  TimerState
} from "../types/timer";
import { minutesToSeconds } from "../utils/time";

export type TimerAction =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESET" }
  | { type: "END_ROUND" }
  | { type: "TICK" }
  | { type: "SYNC_DAY"; dateKey: string }
  | { type: "SET_DAILY_TOTAL"; totalFocusSeconds: number }
  | { type: "SET_MODE"; mode: TimerMode }
  | { type: "SET_SETTINGS"; settings: Partial<TimerSettings> }
  | { type: "END_CELEBRATION" };

const petStateMap: Record<SessionStatus, Record<PomodoroPhase, PetState>> = {
  idle: {
    focus: "idle",
    break: "idle"
  },
  running: {
    focus: "focus",
    break: "break"
  },
  paused: {
    focus: "paused",
    break: "paused"
  },
  celebrating: {
    focus: "celebrate",
    break: "celebrate"
  }
};

function getStopwatchRemaining(): null {
  return null;
}

function getPomodoroDuration(settings: TimerSettings, phase: PomodoroPhase): number {
  return minutesToSeconds(
    phase === "focus" ? settings.focusMinutes : settings.breakMinutes
  );
}

function createBaseState(
  settings: TimerSettings,
  dailyProgress: DailyProgress
): TimerState {
  return {
    status: "idle",
    mode: settings.mode,
    phase: "focus",
    elapsedSeconds: 0,
    remainingSeconds:
      settings.mode === "pomodoro" ? getPomodoroDuration(settings, "focus") : null,
    completedRounds: 0,
    settings,
    dailyProgress
  };
}

function resetSession(state: TimerState, nextMode = state.mode): TimerState {
  const nextPhase: PomodoroPhase = "focus";
  return {
    ...state,
    status: "idle",
    mode: nextMode,
    phase: nextPhase,
    elapsedSeconds: 0,
    remainingSeconds:
      nextMode === "pomodoro"
        ? getPomodoroDuration(state.settings, nextPhase)
        : getStopwatchRemaining()
  };
}

function finishFocusChunk(state: TimerState, seconds: number): TimerState {
  if (seconds <= 0) {
    return state;
  }

  return {
    ...state,
    dailyProgress: {
      ...state.dailyProgress,
      totalFocusSeconds: state.dailyProgress.totalFocusSeconds + seconds
    }
  };
}

function completePomodoroPhase(state: TimerState): TimerState {
  if (state.phase === "focus") {
    return {
      ...finishFocusChunk(state, state.elapsedSeconds),
      status: "celebrating",
      phase: "break",
      elapsedSeconds: 0,
      remainingSeconds: getPomodoroDuration(state.settings, "break"),
      completedRounds: state.completedRounds + 1
    };
  }

  return {
    ...state,
    status: "idle",
    phase: "focus",
    elapsedSeconds: 0,
    remainingSeconds: getPomodoroDuration(state.settings, "focus")
  };
}

export function createInitialState(
  settings: TimerSettings,
  dailyProgress: DailyProgress
): TimerState {
  return createBaseState(settings, dailyProgress);
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "START":
      return {
        ...state,
        status: "running",
        elapsedSeconds: 0,
        remainingSeconds:
          state.mode === "pomodoro"
            ? getPomodoroDuration(state.settings, state.phase)
            : getStopwatchRemaining()
      };
    case "PAUSE":
      if (state.status !== "running") {
        return state;
      }
      return {
        ...state,
        status: "paused"
      };
    case "RESUME":
      if (state.status !== "paused") {
        return state;
      }
      return {
        ...state,
        status: "running"
      };
    case "RESET":
      return resetSession(state);
    case "END_ROUND":
      if (state.mode === "stopwatch") {
        return resetSession(state);
      }

      if (state.phase === "focus") {
        return {
          ...finishFocusChunk(state, state.elapsedSeconds),
          status: "celebrating",
          phase: "break",
          elapsedSeconds: 0,
          remainingSeconds: getPomodoroDuration(state.settings, "break"),
          completedRounds: state.completedRounds + 1
        };
      }

      return resetSession(state, "pomodoro");
    case "TICK": {
      if (state.status !== "running") {
        return state;
      }

      if (state.mode === "stopwatch") {
        return {
          ...finishFocusChunk(state, 1),
          elapsedSeconds: state.elapsedSeconds + 1
        };
      }

      const nextElapsed = state.elapsedSeconds + 1;
      const nextRemaining = Math.max((state.remainingSeconds ?? 0) - 1, 0);
      const tickingState = {
        ...state,
        elapsedSeconds: nextElapsed,
        remainingSeconds: nextRemaining
      };

      if (nextRemaining === 0) {
        return completePomodoroPhase(tickingState);
      }

      return tickingState;
    }
    case "SYNC_DAY":
      if (state.dailyProgress.dateKey === action.dateKey) {
        return state;
      }

      return {
        ...state,
        dailyProgress: {
          dateKey: action.dateKey,
          totalFocusSeconds: 0
        }
      };
    case "SET_DAILY_TOTAL":
      return {
        ...state,
        dailyProgress: {
          ...state.dailyProgress,
          totalFocusSeconds: Math.max(0, Math.floor(action.totalFocusSeconds))
        }
      };
    case "SET_MODE": {
      const nextMode = action.mode;
      return resetSession(
        {
          ...state,
          mode: nextMode,
          settings: {
            ...state.settings,
            mode: nextMode
          }
        },
        nextMode
      );
    }
    case "SET_SETTINGS": {
      const nextSettings = {
        ...state.settings,
        ...action.settings
      };

      const nextState = {
        ...state,
        settings: nextSettings
      };

      if (state.mode === "pomodoro" && state.status === "idle") {
        return {
          ...nextState,
          remainingSeconds: getPomodoroDuration(nextSettings, state.phase)
        };
      }

      return nextState;
    }
    case "END_CELEBRATION":
      if (state.status !== "celebrating") {
        return state;
      }

      if (state.mode === "pomodoro" && state.phase === "break") {
        return {
          ...state,
          status: "running"
        };
      }

      return {
        ...state,
        status: "idle"
      };
    default:
      return state;
  }
}

export function getPetState(state: TimerState): PetState {
  return petStateMap[state.status][state.phase];
}
