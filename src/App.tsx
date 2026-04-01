import { useRef, useState } from "react";
import { useDesktopWindow } from "./hooks/useDesktopWindow";
import { PetAvatar } from "./components/PetAvatar";
import { TimerDisplay } from "./components/TimerDisplay";
import { useStudyTimer } from "./hooks/useStudyTimer";
import meatMenu from "./assets/meat-menu-latest.png";

function App() {
  useDesktopWindow(false);
  const widgetRef = useRef<HTMLElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { state, petState, start, pause, resume, reset } = useStudyTimer();

  const primaryAction =
    state.status === "running"
      ? { label: "暂停", handler: pause }
      : state.status === "paused"
        ? { label: "继续", handler: resume }
        : { label: "开始", handler: start };

  const menuButtons = [
    {
      key: "start",
      label: primaryAction.label,
      handler: primaryAction.handler,
      side: "left" as const
    },
    {
      key: "reset",
      label: "重置",
      handler: reset,
      side: "right" as const
    }
  ];

  return (
    <main className="app-shell">
      <section
        ref={widgetRef}
        className="widget-shell"
        aria-label="像素爬宠计时器"
      >
        <section className="pet-stage">
          <PetAvatar
            petState={petState}
            compact
            onClick={() => setMenuOpen((open) => !open)}
          />
        </section>

        <div className={`widget-summary${menuOpen ? " is-open" : ""}`}>
          <TimerDisplay state={state} compact />
        </div>

        <section
          className={`control-bar${menuOpen ? " is-open" : ""}`}
          aria-label="计时控制条"
        >
          {menuButtons.map((button) => (
            <button
              key={button.key}
              className={`meat-button meat-button--${button.side}`}
              type="button"
              data-no-drag="true"
              onClick={button.handler}
            >
              <img
                className={`meat-button__sprite${button.side === "left" ? " is-mirrored" : ""}`}
                src={meatMenu}
                alt=""
                aria-hidden="true"
              />
              <span className="meat-button__label">{button.label}</span>
            </button>
          ))}
        </section>
      </section>
    </main>
  );
}

export default App;
