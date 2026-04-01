import { invoke, isTauri } from "@tauri-apps/api/core";

export interface SaveStudySessionInput {
  startTime: string;
  endTime: string;
  durationSeconds: number;
  status: string;
  mode: "stopwatch";
  dateKey: string;
}

export async function saveStudySession(
  payload: SaveStudySessionInput
): Promise<void> {
  if (!isTauri()) {
    return;
  }

  await invoke("save_study_session", { payload });
}

export async function getTodayTotalSeconds(dateKey: string): Promise<number> {
  if (!isTauri()) {
    return 0;
  }

  return invoke<number>("get_today_total_seconds", { dateKey });
}
