import type { TimerState } from "../types/timer";
import { formatClock } from "../utils/time";

interface TimerDisplayProps {
  state: TimerState;
  compact?: boolean;
}

export function TimerDisplay({ state, compact = false }: TimerDisplayProps) {
  const timeValue =
    state.mode === "stopwatch"
      ? formatClock(state.elapsedSeconds)
      : formatClock(state.remainingSeconds ?? 0);

  if (compact) {
    return (
      <section className="timer-card is-compact">
        <span className="time-badge">{timeValue}</span>
      </section>
    );
  }

  return (
    <section className="timer-card">
      <span className="time-badge">{timeValue}</span>
    </section>
  );
}
