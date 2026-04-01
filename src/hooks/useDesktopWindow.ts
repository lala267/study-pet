import { useEffect, useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { LogicalSize, PhysicalPosition } from "@tauri-apps/api/dpi";
import {
  availableMonitors,
  getCurrentWindow,
  primaryMonitor,
  type Monitor
} from "@tauri-apps/api/window";

const WINDOW_MARGIN = 20;
const POSITION_KEY = "desktop-study-pet-window-position";

const COLLAPSED_SIZE = {
  width: 300,
  height: 272
};

const EXPANDED_SIZE = {
  width: 320,
  height: 338
};

interface SavedPosition {
  x: number;
  y: number;
}

interface WindowSize {
  width: number;
  height: number;
}

function getTargetSize(expanded: boolean) {
  return expanded ? EXPANDED_SIZE : COLLAPSED_SIZE;
}

function loadSavedPosition(): SavedPosition | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(POSITION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SavedPosition>;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") {
      return null;
    }

    return {
      x: parsed.x,
      y: parsed.y
    };
  } catch {
    return null;
  }
}

function savePosition(position: SavedPosition): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(POSITION_KEY, JSON.stringify(position));
}

function isPointInMonitor(position: SavedPosition, monitor: Monitor): boolean {
  return (
    position.x >= monitor.position.x &&
    position.y >= monitor.position.y &&
    position.x <= monitor.position.x + monitor.size.width &&
    position.y <= monitor.position.y + monitor.size.height
  );
}

async function resolveMonitor(position?: SavedPosition): Promise<Monitor | null> {
  const monitors = await availableMonitors();
  if (position) {
    const matched = monitors.find((monitor) => isPointInMonitor(position, monitor));
    if (matched) {
      return matched;
    }
  }

  return (await primaryMonitor()) ?? monitors[0] ?? null;
}

function clampToMonitor(
  position: SavedPosition,
  size: WindowSize,
  monitor: Monitor
): SavedPosition {
  const visibleArea = monitor.workArea;
  const minX = Math.max(visibleArea.position.x, visibleArea.position.x + WINDOW_MARGIN);
  const minY = Math.max(visibleArea.position.y, visibleArea.position.y + WINDOW_MARGIN);
  const maxX = Math.max(
    minX,
    visibleArea.position.x + visibleArea.size.width - size.width - WINDOW_MARGIN
  );
  const maxY = Math.max(
    minY,
    visibleArea.position.y + visibleArea.size.height - size.height - WINDOW_MARGIN
  );

  return {
    x: Math.min(Math.max(position.x, minX), maxX),
    y: Math.min(Math.max(position.y, minY), maxY)
  };
}

async function getActualWindowSize(fallbackSize: WindowSize): Promise<WindowSize> {
  const appWindow = getCurrentWindow();
  try {
    const size = await appWindow.outerSize();
    return {
      width: size.width,
      height: size.height
    };
  } catch {
    return fallbackSize;
  }
}

async function clampToVisibleArea(
  position: SavedPosition,
  size: WindowSize
): Promise<SavedPosition> {
  const monitor = await resolveMonitor(position);
  if (!monitor) {
    return position;
  }

  return clampToMonitor(position, size, monitor);
}

async function getDefaultCornerPosition(size: WindowSize): Promise<SavedPosition | null> {
  const monitor = await resolveMonitor();
  if (!monitor) {
    return null;
  }

  return clampToMonitor(
    {
      x: monitor.position.x + monitor.size.width - size.width - WINDOW_MARGIN,
      y: monitor.position.y + monitor.size.height - size.height - WINDOW_MARGIN
    },
    size,
    monitor
  );
}

export function useDesktopWindow(expanded: boolean) {
  const initializedRef = useRef(false);
  const previousExpandedRef = useRef(expanded);

  useEffect(() => {
    if (!isTauri()) {
      return undefined;
    }

    const appWindow = getCurrentWindow();
    let unlisten: (() => void) | undefined;

    void (async () => {
      await appWindow.setAlwaysOnTop(true);

      const requestedSize = getTargetSize(expanded);
      await appWindow.setSize(new LogicalSize(requestedSize.width, requestedSize.height));

      const actualSize = await getActualWindowSize(requestedSize);
      const savedPosition = loadSavedPosition();
      const nextPosition =
        (savedPosition && (await clampToVisibleArea(savedPosition, actualSize))) ??
        (await getDefaultCornerPosition(actualSize));

      if (nextPosition) {
        await appWindow.setPosition(
          new PhysicalPosition(nextPosition.x, nextPosition.y)
        );
        savePosition(nextPosition);
      }

      unlisten = await appWindow.onMoved(({ payload }) => {
        savePosition({
          x: payload.x,
          y: payload.y
        });
      });

      initializedRef.current = true;
    })();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  useEffect(() => {
    if (!isTauri() || !initializedRef.current) {
      previousExpandedRef.current = expanded;
      return;
    }

    const appWindow = getCurrentWindow();
    const previousSize = getTargetSize(previousExpandedRef.current);
    const nextSize = getTargetSize(expanded);

    void (async () => {
      await appWindow.setSize(new LogicalSize(nextSize.width, nextSize.height));
      const actualNextSize = await getActualWindowSize(nextSize);

      const savedPosition = loadSavedPosition();
      const adjustedPosition = savedPosition
        ? {
            x: savedPosition.x - (actualNextSize.width - previousSize.width),
            y: savedPosition.y - (actualNextSize.height - previousSize.height)
          }
        : await getDefaultCornerPosition(actualNextSize);

      const nextPosition = adjustedPosition
        ? await clampToVisibleArea(adjustedPosition, actualNextSize)
        : null;

      if (nextPosition) {
        await appWindow.setPosition(
          new PhysicalPosition(nextPosition.x, nextPosition.y)
        );
        savePosition(nextPosition);
      }
    })();

    previousExpandedRef.current = expanded;
  }, [expanded]);
}
