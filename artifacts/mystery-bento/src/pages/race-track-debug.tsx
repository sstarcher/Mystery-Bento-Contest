import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import {
  RACE_BACKGROUND_CANVAS_HEIGHT_PX,
  RACE_BACKGROUND_FINISH_MARKER_X_PX,
  RACE_BACKGROUND_SEQUENCE,
  RACE_BACKGROUND_TRACK_WIDTH_PX,
} from '../race-backgrounds';

const RACE_BACKGROUND_BASE = `${import.meta.env.BASE_URL}runtime/images/race-backgrounds`;

export default function RaceTrackDebugPage() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const scrollTo = (left: number, behavior: ScrollBehavior = 'smooth') => {
    viewportRef.current?.scrollTo({ left, behavior });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: viewportRef.current.scrollLeft,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || !viewportRef.current) return;
    viewportRef.current.scrollLeft = dragRef.current.startScrollLeft
      - (event.clientX - dragRef.current.startX);
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current.active && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current.active = false;
    setIsDragging(false);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollTo((viewportRef.current?.scrollLeft ?? 0) - 320);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollTo((viewportRef.current?.scrollLeft ?? 0) + 320);
    } else if (event.key === 'Home') {
      event.preventDefault();
      scrollTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      scrollTo(viewportRef.current?.scrollWidth ?? 0);
    }
  };

  return (
    <main className="race-track-debug-page">
      <header className="race-track-debug-header">
        <div>
          <p className="race-track-debug-kicker">Mystery Bento · visual inspector</p>
          <h1>Race track panorama</h1>
          <p className="race-track-debug-description">
            Drag the track or use the horizontal scrollbar to inspect every scene at its natural proportions.
          </p>
        </div>
        <div className="race-track-debug-actions">
          <button type="button" onClick={() => scrollTo(0)}>Start</button>
          <button type="button" onClick={() => scrollTo(RACE_BACKGROUND_TRACK_WIDTH_PX / 2)}>Center</button>
          <button type="button" onClick={() => scrollTo(RACE_BACKGROUND_TRACK_WIDTH_PX)}>Finish</button>
          <a href={import.meta.env.BASE_URL}>Back to restaurant</a>
        </div>
      </header>

      <section
        ref={viewportRef}
        className={`race-track-debug-viewport${isDragging ? ' is-dragging' : ''}`}
        tabIndex={0}
        aria-label="Scrollable race track panorama"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onKeyDown={onKeyDown}
      >
        <div
          className="race-track-debug-world"
          style={{ width: `${RACE_BACKGROUND_TRACK_WIDTH_PX}px`, height: `${RACE_BACKGROUND_CANVAS_HEIGHT_PX}px` }}
        >
          <div
            className="race-track-debug-finish-marker"
            style={{ left: `${RACE_BACKGROUND_FINISH_MARKER_X_PX}px` }}
            aria-label="Simulation finish line"
          >
            <span>SIM FINISH</span>
          </div>
          {RACE_BACKGROUND_SEQUENCE.map((scene, index) => {
            const sceneWidth = Math.round(scene.aspectRatio * RACE_BACKGROUND_CANVAS_HEIGHT_PX);
            return (
              <article
                className="race-track-debug-scene"
                key={scene.id}
                style={{ width: `${sceneWidth}px`, height: `${RACE_BACKGROUND_CANVAS_HEIGHT_PX}px` }}
              >
                <img
                  src={`${RACE_BACKGROUND_BASE}/${scene.file}`}
                  alt={scene.label}
                  draggable="false"
                />
                <div className="race-track-debug-scene-label">
                  <span>Scene {index + 1}</span>
                  <strong>{scene.label}</strong>
                  <small>{sceneWidth} × {RACE_BACKGROUND_CANVAS_HEIGHT_PX}px</small>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <p className="race-track-debug-help">
        Click the panorama to focus it. Use <kbd>←</kbd> <kbd>→</kbd>, <kbd>Home</kbd>, or <kbd>End</kbd> to pan with the keyboard.
      </p>
    </main>
  );
}