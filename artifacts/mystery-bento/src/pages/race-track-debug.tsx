import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { contestantDesigns } from '../contestant-design-config';
import { MovementSprite } from '../movement-sprite';
import { getMovementSpriteSheet, type MovementAction } from '../movement-sprite-config';
import {
  RACE_BACKGROUND_CANVAS_HEIGHT_PX,
  RACE_BACKGROUND_FINISH_MARKER_ANGLE_DEG,
  RACE_BACKGROUND_FINISH_MARKER_ROAD_LENGTH_PX,
  RACE_BACKGROUND_FINISH_MARKER_ROAD_TOP_PX,
  RACE_BACKGROUND_FINISH_MARKER_X_PX,
  RACE_BACKGROUND_SEQUENCE,
  RACE_BACKGROUND_TRACK_WIDTH_PX,
} from '../race-backgrounds';

const RACE_BACKGROUND_BASE = `${import.meta.env.BASE_URL}runtime/images/race-backgrounds`;
const RACE_OBSTACLE_BASE = `${import.meta.env.BASE_URL}runtime/images/obstacles`;
const FALL_SEQUENCE_RUN_MS = 1800;
const FALL_SEQUENCE_FALL_MS = 2100;
const VICTORY_SEQUENCE_RUN_MS = 1800;

type SampleTrackObstacleOption = {
  id: string;
  label: string;
  image: string;
};

type SampleTrackObstaclePlacement = {
  position: number;
  offsetX?: number;
  offsetY?: number;
};

type SampleTrackObstacle = SampleTrackObstacleOption & SampleTrackObstaclePlacement;

const SAMPLE_TRACK_OBSTACLE_OPTIONS: SampleTrackObstacleOption[] = [
  { id: 'napkin-gust', label: 'Napkin gust', image: 'napkin-gust.png' },
  { id: 'tea-puddle', label: 'Tea puddle', image: 'tea-puddle.png' },
  { id: 'moon-reflection', label: 'Moon reflection', image: 'moon-reflection.png' },
  { id: 'cushion-pile', label: 'Cushion pile', image: 'cushion-pile.png' },
  { id: 'flour-sacks', label: 'Flour sacks', image: 'flour-sacks.png' },
  { id: 'crumb-trail', label: 'Crumb trail', image: 'crumb-trail.png' },
  { id: 'steam-gadget', label: 'Steam gadget', image: 'steam-gadget.png' },
  { id: 'bento-stack', label: 'Bento stack', image: 'bento-stack.png' },
];

const SAMPLE_TRACK_OBSTACLE_PLACEMENTS: SampleTrackObstaclePlacement[] = [
  { position: 18, offsetX: 200, offsetY: 80 },
  { position: 40 },
  { position: 62, offsetY: -50 },
  { position: 83, offsetX: 200 },
];
const DEFAULT_SAMPLE_OBSTACLE_INDEXES = [0, 1, 2, 7];

const spriteTestContestants = contestantDesigns.filter((contestant) => (
  getMovementSpriteSheet(contestant.id, 'run')
  && getMovementSpriteSheet(contestant.id, 'fall')
  && getMovementSpriteSheet(contestant.id, 'victory')
));

type SpriteTestPersona = (typeof spriteTestContestants)[number];

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setPrefersReducedMotion(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return prefersReducedMotion;
}

function SpriteTestLane({
  sequence,
  contestant,
  prefersReducedMotion,
}: {
  sequence: 'fall' | 'victory';
  contestant: SpriteTestPersona;
  prefersReducedMotion: boolean;
}) {
  const [replayKey, setReplayKey] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = performance.now();
    setElapsedMs(0);
    const timer = window.setInterval(() => setElapsedMs(performance.now() - startedAt), 50);
    return () => window.clearInterval(timer);
  }, [replayKey]);

  const phase = sequence === 'fall'
    ? elapsedMs < FALL_SEQUENCE_RUN_MS
      ? 'run'
      : elapsedMs < FALL_SEQUENCE_RUN_MS + FALL_SEQUENCE_FALL_MS
        ? 'fall'
        : 'run'
    : elapsedMs < VICTORY_SEQUENCE_RUN_MS ? 'run' : 'victory';
  const action: MovementAction = phase;
  const phaseLabel = sequence === 'fall'
    ? phase === 'fall' ? 'Full fall reaction' : phase === 'run' && elapsedMs >= FALL_SEQUENCE_RUN_MS + FALL_SEQUENCE_FALL_MS ? 'Running again' : 'Running'
    : phase === 'victory' ? 'Looping victory' : 'Running';
  const sequenceLabel = sequence === 'fall' ? 'Run → fall → run' : 'Run → victory';

  return (
    <article className={`race-sprite-test-card race-sprite-test-card-${sequence}`} data-sprite-test-sequence={sequence}>
      <div className="race-sprite-test-card-header">
        <div>
          <p className="race-sprite-test-sequence">{sequence === 'fall' ? 'Recovery handoff' : 'Finish handoff'}</p>
          <h3>{sequenceLabel}</h3>
        </div>
        <button
          type="button"
          className="race-sprite-test-replay"
          onClick={() => setReplayKey((current) => current + 1)}
          aria-label={`Replay ${sequenceLabel} for ${contestant.name}`}
        >
          Replay
        </button>
      </div>
      <div className="race-sprite-test-status" role="status" aria-live="polite">
        <span>Current phase</span>
        <strong>{phaseLabel}</strong>
      </div>
      <div className="race-sprite-test-stage">
        <div className="race-sprite-test-ground" aria-hidden="true" />
        <div className="race-sprite-test-runner" aria-label={`${contestant.name}, ${phaseLabel}`}>
          <MovementSprite
            persona={contestant}
            action={action}
            animationKey={`${sequence}-${replayKey}`}
            scaleMultiplier={contestant.id === 'panko' ? 0.64 : undefined}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      </div>
      <p className="race-sprite-test-caption">
        <strong>{contestant.name}</strong>
        <span>{sequence === 'fall' ? 'Run, complete the fall sheet, then return to run.' : 'Run, then hold the looping victory sheet.'}</span>
      </p>
    </article>
  );
}

function SpriteTestStrip() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [fallPersonaId, setFallPersonaId] = useState('pip');
  const [victoryPersonaId, setVictoryPersonaId] = useState('sencha');
  const fallPersona = useMemo(
    () => spriteTestContestants.find((contestant) => contestant.id === fallPersonaId) ?? spriteTestContestants[0],
    [fallPersonaId],
  );
  const victoryPersona = useMemo(
    () => spriteTestContestants.find((contestant) => contestant.id === victoryPersonaId) ?? spriteTestContestants[1] ?? spriteTestContestants[0],
    [victoryPersonaId],
  );

  if (!fallPersona || !victoryPersona) return null;

  return (
    <section className="race-sprite-test-strip" aria-labelledby="race-sprite-test-heading">
      <div className="race-sprite-test-intro">
        <div>
          <p className="race-track-debug-kicker">Movement sheet check</p>
          <h2 id="race-sprite-test-heading">Race sprite test strip</h2>
          <p>Compare persona-specific transparent sheets, action handoffs, and shared baseline normalization without leaving the track context.</p>
        </div>
        <p className="race-sprite-test-motion-note">
          {prefersReducedMotion ? 'Reduced motion: stable readable poses' : 'Animation preview: discrete authored frames'}
        </p>
      </div>
      <div className="race-sprite-test-controls">
        <label>
          <span>Run → fall → run contestant</span>
          <select
            value={fallPersona.id}
            onChange={(event) => setFallPersonaId(event.target.value)}
            aria-label="Contestant for the run, fall, run sequence"
          >
            {spriteTestContestants.map((contestant) => (
              <option value={contestant.id} key={contestant.id}>{contestant.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Run → victory contestant</span>
          <select
            value={victoryPersona.id}
            onChange={(event) => setVictoryPersonaId(event.target.value)}
            aria-label="Contestant for the run, victory sequence"
          >
            {spriteTestContestants.map((contestant) => (
              <option value={contestant.id} key={contestant.id}>{contestant.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="race-sprite-test-cards">
        <SpriteTestLane sequence="fall" contestant={fallPersona} prefersReducedMotion={prefersReducedMotion} />
        <SpriteTestLane sequence="victory" contestant={victoryPersona} prefersReducedMotion={prefersReducedMotion} />
      </div>
    </section>
  );
}

export default function RaceTrackDebugPage() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [sampleObstacleIndexes, setSampleObstacleIndexes] = useState(DEFAULT_SAMPLE_OBSTACLE_INDEXES);
  const sampleTrackObstacles = useMemo(
    () => SAMPLE_TRACK_OBSTACLE_PLACEMENTS.map((placement, positionIndex) => {
      const option = SAMPLE_TRACK_OBSTACLE_OPTIONS[sampleObstacleIndexes[positionIndex] ?? 0] ?? SAMPLE_TRACK_OBSTACLE_OPTIONS[0];
      return {
        ...option,
        ...placement,
        id: `sample-${positionIndex + 1}-${option.id}`,
      };
    }),
    [sampleObstacleIndexes],
  );

  const cycleObstacleAt = (positionIndex: number) => {
    setSampleObstacleIndexes((current) => current.map((obstacleIndex, index) => (
      index === positionIndex
        ? (obstacleIndex + 1) % SAMPLE_TRACK_OBSTACLE_OPTIONS.length
        : obstacleIndex
    )));
  };

  const cycleAllObstacles = () => {
    setSampleObstacleIndexes((current) => current.map((obstacleIndex) => (
      (obstacleIndex + 1) % SAMPLE_TRACK_OBSTACLE_OPTIONS.length
    )));
  };

  const resetSampleObstacles = () => setSampleObstacleIndexes(DEFAULT_SAMPLE_OBSTACLE_INDEXES);

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

      <section className="race-track-debug-obstacle-overview" aria-labelledby="race-obstacle-overview-title">
        <div className="race-track-debug-obstacle-overview-heading">
          <div>
            <p className="race-track-debug-kicker">Course hazard map</p>
            <h2 id="race-obstacle-overview-title">Obstacle position inspector</h2>
          </div>
          <p>Cycle every obstacle through each live race checkpoint.</p>
        </div>
        <div className="race-track-debug-obstacle-ruler">
          <span className="race-track-debug-obstacle-ruler-label is-start">START</span>
          <span className="race-track-debug-obstacle-ruler-line" aria-hidden="true" />
          {sampleTrackObstacles.map((obstacle) => (
            <span
              className="race-track-debug-obstacle-ruler-marker"
              key={obstacle.id}
              style={{ left: `${obstacle.position}%` }}
            >
              <img src={`${RACE_OBSTACLE_BASE}/${obstacle.image}`} alt="" draggable="false" />
              <strong>{obstacle.position}%</strong>
              <span>{obstacle.label}</span>
            </span>
          ))}
          <span className="race-track-debug-obstacle-ruler-label is-finish">FINISH</span>
        </div>
        <div className="race-track-debug-obstacle-controls">
          <div className="race-track-debug-obstacle-controls-heading">
            <span>Inspect each checkpoint</span>
            <div>
              <button type="button" onClick={cycleAllObstacles}>Cycle all</button>
              <button type="button" onClick={resetSampleObstacles}>Reset sample set</button>
            </div>
          </div>
          <div className="race-track-debug-obstacle-control-grid">
            {sampleTrackObstacles.map((obstacle, index) => (
              <div className="race-track-debug-obstacle-control" key={obstacle.position}>
                <div>
                  <span>{obstacle.position}% checkpoint</span>
                  <strong>{obstacle.label}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => cycleObstacleAt(index)}
                  aria-label={`Show next obstacle at ${obstacle.position}%`}
                >
                  Next
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            className="race-finish-marker race-track-debug-finish-marker"
            style={{
              '--race-finish-marker-angle': `${RACE_BACKGROUND_FINISH_MARKER_ANGLE_DEG}deg`,
              '--race-finish-marker-road-length': `${RACE_BACKGROUND_FINISH_MARKER_ROAD_LENGTH_PX}px`,
              '--race-finish-marker-road-top': `${RACE_BACKGROUND_FINISH_MARKER_ROAD_TOP_PX}px`,
              left: `${RACE_BACKGROUND_FINISH_MARKER_X_PX}px`,
            } as CSSProperties}
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
          <div className="race-track-debug-obstacle-layer" aria-label="Sample obstacle placements">
            {sampleTrackObstacles.map((obstacle) => (
              <span
                className="race-obstacle race-track-debug-obstacle"
                data-position={`${obstacle.position}%`}
                key={obstacle.id}
                style={{
                  left: obstacle.offsetX ? `calc(${obstacle.position}% + ${obstacle.offsetX}px)` : `${obstacle.position}%`,
                  bottom: obstacle.offsetY ? `${210 - obstacle.offsetY}px` : undefined,
                }}
              >
                <span className="race-obstacle-art">
                  <img src={`${RACE_OBSTACLE_BASE}/${obstacle.image}`} alt={obstacle.label} draggable="false" />
                </span>
                <span className="race-track-debug-obstacle-label">
                  <strong>{obstacle.position}%</strong>
                  <span>{obstacle.label}</span>
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <p className="race-track-debug-help">
        Click the panorama to focus it. Use <kbd>←</kbd> <kbd>→</kbd>, <kbd>Home</kbd>, or <kbd>End</kbd> to pan with the keyboard.
      </p>
       <p className="race-track-debug-obstacle-note">
         Sample obstacle layout: four hazards spaced at the live race checkpoints — 18%, 40%, 62%, and 83% of the course.
       </p>
      <SpriteTestStrip />
    </main>
  );
}