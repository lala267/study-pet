import { useRef } from "react";
import type { PetState } from "../types/timer";
import pixelHero from "../assets/pixel-hero-chibi.png";
import { startWindowDrag } from "../utils/desktopDrag";

interface PetAvatarProps {
  petState: PetState;
  compact?: boolean;
  onClick?: () => void;
}

const petMeta: Record<PetState, { label: string }> = {
  idle: {
    label: "idle"
  },
  focus: {
    label: "focus"
  },
  break: {
    label: "break"
  },
  paused: {
    label: "pause"
  },
  celebrate: {
    label: "yay"
  }
};

export function PetAvatar({
  petState,
  compact = false,
  onClick
}: PetAvatarProps) {
  const meta = petMeta[petState];
  const dragTimerRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  const clearDragTimer = () => {
    if (dragTimerRef.current !== null) {
      window.clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }
  };

  const handleHeadMouseDown = () => {
    draggingRef.current = false;
    clearDragTimer();

    dragTimerRef.current = window.setTimeout(() => {
      draggingRef.current = true;
      void startWindowDrag();
    }, 170);
  };

  const handleHeadMouseUp = () => {
    clearDragTimer();
  };

  const handleHeadClick = () => {
    if (draggingRef.current) {
      draggingRef.current = false;
      return;
    }

    onClick?.();
  };

  return (
    <section
      className={`pet-card${compact ? " is-compact" : ""} is-${petState}`}
      aria-label="桌宠状态"
    >
      <div className="pet-visual">
        <img className="pixel-pet" src={pixelHero} alt="" aria-hidden="true" />
        <button
          className="pet-head-drag"
          type="button"
          onMouseDown={handleHeadMouseDown}
          onMouseUp={handleHeadMouseUp}
          onMouseLeave={handleHeadMouseUp}
          onClick={handleHeadClick}
          data-no-drag="true"
          aria-label={`${meta.label} 桌宠`}
        />
        <button
          className="pet-body-button"
          type="button"
          onClick={onClick}
          data-no-drag="true"
          aria-label={`${meta.label} 桌宠`}
        />
      </div>
    </section>
  );
}
