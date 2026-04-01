import type { MouseEvent } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

const INTERACTIVE_SELECTOR = [
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "option",
  "[role='button']",
  "[data-no-drag='true']"
].join(", ");

export async function startWindowDragIfAllowed(
  event: MouseEvent<HTMLElement>
): Promise<void> {
  if (!isTauri() || event.button !== 0) {
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const currentTarget = event.currentTarget;
  if (!(currentTarget instanceof HTMLElement)) {
    return;
  }

  if (target !== currentTarget && target.closest(INTERACTIVE_SELECTOR)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  await startWindowDrag();
}

export async function startWindowDrag(): Promise<void> {
  if (!isTauri()) {
    return;
  }

  await getCurrentWindow().startDragging();
}
