import { useEffect, useRef, useState } from 'react';
import { getMovementSpriteSheet, type MovementAction } from './movement-sprite-config';
import { getMovementFrameIndex, getVictoryFrameIndex } from './movement-sprite-actions';
import { getMovementSpriteRenderStyle } from './movement-sprite-normalization';
import { getRunnerSpriteCadenceMultiplier } from './race-speed-model';

const MOTION_SPEEDUP = 1.08;
const speedUpDurationMs = (durationMs: number) => Math.max(1, Math.round(durationMs / MOTION_SPEEDUP));

export type MovementSpritePersona = {
  id: string;
  name: string;
};

export function MovementSprite({
  persona,
  action,
  prefersReducedMotion,
  animationKey,
  speedMultiplier = 1,
}: {
  persona: MovementSpritePersona;
  action: MovementAction;
  prefersReducedMotion: boolean;
  animationKey?: string;
  speedMultiplier?: number;
}) {
  const [displayAction, setDisplayAction] = useState<MovementAction>(action);
  const [frameIndex, setFrameIndex] = useState(0);
  const [completedOneShotKey, setCompletedOneShotKey] = useState<string | null>(null);
  const [isHoldingFall, setIsHoldingFall] = useState(false);
  const activeFallKey = useRef<string | null>(null);
  const oneShotKey = animationKey ?? action;
  const effectiveAction = action === 'victory'
    ? 'victory'
    : action === 'fall'
    ? completedOneShotKey === oneShotKey && !isHoldingFall ? 'run' : 'fall'
    : isHoldingFall
      ? 'fall'
      : action === 'jump' && completedOneShotKey === oneShotKey
        ? 'run'
        : displayAction;
  const requestedSpriteSheet = getMovementSpriteSheet(persona.id, effectiveAction);
  const spriteSheet = requestedSpriteSheet ?? getMovementSpriteSheet(persona.id, 'run');
  const renderedAction = requestedSpriteSheet ? effectiveAction : 'run';
  const isOneShot = requestedSpriteSheet !== undefined
    && effectiveAction === 'fall'
    && (action === 'fall' || isHoldingFall);
  const previousSpriteSource = useRef<string | null>(null);
  const previousFrameCount = useRef(1);
  const speedMultiplierRef = useRef(speedMultiplier);
  speedMultiplierRef.current = speedMultiplier;

  useEffect(() => {
    if (action === 'victory') {
      activeFallKey.current = null;
      setCompletedOneShotKey(null);
      setIsHoldingFall(false);
      setDisplayAction('victory');
      setFrameIndex(0);
      return;
    }
    if (action === 'fall') {
      if (activeFallKey.current !== oneShotKey) {
        activeFallKey.current = oneShotKey;
        setCompletedOneShotKey(null);
        setIsHoldingFall(true);
        setDisplayAction('fall');
        setFrameIndex(0);
      }
      return;
    }
    if (isHoldingFall) return;
    activeFallKey.current = null;
    setCompletedOneShotKey(null);
    setDisplayAction(action);
    if (action === 'jump') setFrameIndex(0);
  }, [action, animationKey]);

  useEffect(() => {
    const priorSource = previousSpriteSource.current;
    const priorFrameCount = previousFrameCount.current;
    previousSpriteSource.current = spriteSheet?.src ?? null;
    previousFrameCount.current = spriteSheet?.frameCount ?? 1;
    setFrameIndex((current) => {
      if (!spriteSheet) return 0;
      if (effectiveAction === 'victory') return 0;
      if (effectiveAction === 'jump' && priorSource !== spriteSheet.src) return 0;
      if (!priorSource || priorSource === spriteSheet.src) return current % spriteSheet.frameCount;
      return Math.floor((current / priorFrameCount) * spriteSheet.frameCount) % spriteSheet.frameCount;
    });
  }, [effectiveAction, spriteSheet]);

  useEffect(() => {
    if (!spriteSheet || prefersReducedMotion || spriteSheet.frameCount < 2) return;
    const cadenceMultiplier = isOneShot
      ? 1
      : getRunnerSpriteCadenceMultiplier(speedMultiplierRef.current);
    const frameDurationMs = isOneShot
      ? speedUpDurationMs(spriteSheet.frameDurationMs) / 2
      : speedUpDurationMs(spriteSheet.frameDurationMs / cadenceMultiplier);
    const timer = window.setInterval(() => {
      setFrameIndex((current) => isOneShot
        ? getMovementFrameIndex(current + 1, spriteSheet.frameCount, false)
        : getMovementFrameIndex(current + 1, spriteSheet.frameCount, true));
    }, frameDurationMs);
    return () => window.clearInterval(timer);
  }, [action, effectiveAction, prefersReducedMotion, spriteSheet, speedMultiplier]);

  useEffect(() => {
    if (!spriteSheet || !isOneShot || !prefersReducedMotion) return;
    setFrameIndex(spriteSheet.frameCount - 1);
  }, [isOneShot, prefersReducedMotion, spriteSheet]);

  useEffect(() => {
    if (!spriteSheet || !isOneShot || frameIndex < spriteSheet.frameCount - 1) return;
    setCompletedOneShotKey(activeFallKey.current ?? oneShotKey);
    setIsHoldingFall(false);
    setDisplayAction(action);
    activeFallKey.current = null;
  }, [action, frameIndex, isOneShot, oneShotKey, spriteSheet]);

  if (!spriteSheet) return null;

  // Action changes reuse this component, so the previous action may have a
  // frame index beyond the new sheet's occupied range for one render. Normalize
  // it before painting to prevent a transient blank cell on any racer.
  const isFreshVictory = action === 'victory'
    && requestedSpriteSheet !== undefined
    && displayAction !== 'victory';
  const visibleFrameIndex = isFreshVictory
    ? 0
    : action === 'victory'
      ? getVictoryFrameIndex(frameIndex, spriteSheet.frameCount, prefersReducedMotion)
      : getMovementFrameIndex(frameIndex, spriteSheet.frameCount, true);
  const column = visibleFrameIndex % spriteSheet.columns;
  const row = Math.floor(visibleFrameIndex / spriteSheet.columns);
  const backgroundPosition = `${spriteSheet.columns > 1 ? (column / (spriteSheet.columns - 1)) * 100 : 0}% ${spriteSheet.rows > 1 ? (row / (spriteSheet.rows - 1)) * 100 : 0}%`;
  const renderStyle = getMovementSpriteRenderStyle(spriteSheet.normalization);

  return (
    <span
      className="race-movement-sprite"
      role="img"
      aria-label={`${persona.name} ${renderedAction} movement`}
      data-movement-action={renderedAction}
      data-movement-frame={visibleFrameIndex}
      data-movement-grid={`${spriteSheet.columns}x${spriteSheet.rows}`}
      style={{ transform: renderStyle.spriteTransform }}
    >
      <span
        className="race-movement-frame"
        aria-hidden="true"
        style={{
          transform: renderStyle.frameTransform,
          transformOrigin: renderStyle.frameTransformOrigin,
          backgroundImage: `url(${spriteSheet.src})`,
          backgroundSize: `${spriteSheet.columns * 100}% ${spriteSheet.rows * 100}%`,
          backgroundPosition,
        }}
      />
    </span>
  );
}