export const DEFAULT_FOCUS_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;

export function getTodayKey(date = new Date()): string {
  return date.toLocaleDateString("sv-SE");
}

export function minutesToSeconds(minutes: number): number {
  return Math.max(1, Math.floor(minutes)) * 60;
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((value) => value.toString().padStart(2, "0"))
      .join(":");
  }

  return [minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

export function formatDurationLabel(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}小时 ${minutes}分钟`;
  }

  if (hours > 0) {
    return `${hours}小时`;
  }

  if (minutes > 0) {
    return `${minutes}分钟`;
  }

  return `${safe}秒`;
}
