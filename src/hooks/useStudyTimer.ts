import { useEffect, useMemo, useReducer, useRef } from "react";
import { loadPersistedState, savePersistedState } from "../services/storage";
import {
  getTodayTotalSeconds,
  saveStudySession
} from "../services/studySessionDb";
import {
  createInitialState,
  getPetState,
  timerReducer
} from "../services/timerMachine";
import { getTodayKey } from "../utils/time";

const persisted = loadPersistedState();

export function useStudyTimer() {
  const sessionStartRef = useRef<string | null>(null);
  const [state, dispatch] = useReducer(
    timerReducer,
    createInitialState(persisted.settings, persisted.dailyProgress)
  );

  const syncTodayTotal = async () => {
    const totalFocusSeconds = await getTodayTotalSeconds(getTodayKey());
    dispatch({ type: "SET_DAILY_TOTAL", totalFocusSeconds });
  };

  const finalizeSession = async (status: "reset" | "completed") => {
    if (!sessionStartRef.current || state.elapsedSeconds <= 0) {
      sessionStartRef.current = null;
      return;
    }

    await saveStudySession({
      startTime: sessionStartRef.current,
      endTime: new Date().toISOString(),
      durationSeconds: state.elapsedSeconds,
      status,
      mode: "stopwatch",
      dateKey: getTodayKey()
    });

    sessionStartRef.current = null;
    await syncTodayTotal();
  };

  useEffect(() => {
    if (state.mode !== "stopwatch") {
      dispatch({ type: "SET_MODE", mode: "stopwatch" });
    }
  }, [state.mode]);

  useEffect(() => {
    void syncTodayTotal();
  }, []);

  useEffect(() => {
    const tickId = window.setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => window.clearInterval(tickId);
  }, []);

  useEffect(() => {
    const syncToday = () => {
      dispatch({ type: "SYNC_DAY", dateKey: getTodayKey() });
      void syncTodayTotal();
    };

    syncToday();
    const syncId = window.setInterval(syncToday, 60_000);

    return () => window.clearInterval(syncId);
  }, []);

  useEffect(() => {
    if (state.status !== "celebrating") {
      return undefined;
    }

    const celebrationId = window.setTimeout(() => {
      dispatch({ type: "END_CELEBRATION" });
    }, 1800);

    return () => window.clearTimeout(celebrationId);
  }, [state.status]);

  useEffect(() => {
    savePersistedState({
      settings: state.settings,
      dailyProgress: state.dailyProgress
    });
  }, [state.dailyProgress, state.settings]);

  const petState = useMemo(() => getPetState(state), [state]);

  return {
    state,
    petState,
    start: () => {
      if (state.status === "idle") {
        sessionStartRef.current = new Date().toISOString();
      }

      dispatch({ type: "START" });
    },
    pause: () => dispatch({ type: "PAUSE" }),
    resume: () => dispatch({ type: "RESUME" }),
    reset: () => {
      void finalizeSession("reset");
      dispatch({ type: "RESET" });
    }
  };
}
