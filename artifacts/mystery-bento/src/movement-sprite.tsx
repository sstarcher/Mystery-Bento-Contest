import { useEffect, useRef, useState } from 'react';
import { getMovementSpriteSheet, type MovementAction } from './movement-sprite-config';
import { getMovementFrameIndex, getVictoryFrameIndex } from './movement-sprite-actions';
import { getMovementSpriteRenderStyle } from './movement-sprite-normalization';
import { getMovementFrameDurationMs } from './movement-sprite-cadence';

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
  scaleMultiplier = 1,
}: {
  persona: MovementSpritePersona;
  action: MovementAction;
  prefersReducedMotion: boolean;
  animationKey?: string;
  speedMultiplier?: number;
  scaleMultiplier?: number;
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
  const isJumpOneShot = action === 'jump' && completedOneShotKey !== oneShotKey;
  const isOneShot = requestedSpriteSheet !== undefined
    && (
      (effectiveAction === 'fall' && (action === 'fall' || isHoldingFall))
      || (effectiveAction === 'jump' && isJumpOneShot)
    );
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
    if (action === 'jump') {
      activeFallKey.current = null;
      setCompletedOneShotKey(null);
      setIsHoldingFall(false);
      setDisplayAction('jump');
      setFrameIndex(0);
      return;
    }
    if (isHoldingFall) return;
    activeFallKey.current = null;
    setCompletedOneShotKey(null);
    setDisplayAction(action);
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
    let timer: number | null = null;
    let cancelled = false;
    const scheduleNextFrame = () => {
      if (cancelled) return;
      const frameDurationMs = getMovementFrameDurationMs(
        spriteSheet.frameDurationMs,
        speedMultiplierRef.current,
        isOneShot,
      );
      timer = window.setTimeout(() => {
        if (cancelled) return;
        setFrameIndex((current) => isOneShot
          ? getMovementFrameIndex(current + 1, spriteSheet.frameCount, false)
          : getMovementFrameIndex(current + 1, spriteSheet.frameCount, true));
        scheduleNextFrame();
      }, frameDurationMs);
    };
    scheduleNextFrame();
    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [action, effectiveAction, prefersReducedMotion, spriteSheet, isOneShot]);

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
      : getMovementFrameIndex(frameIndex, spriteSheet.frameCount, !isOneShot);
  const column = visibleFrameIndex % spriteSheet.columns;
  const row = Math.floor(visibleFrameIndex / spriteSheet.columns);
  const backgroundPosition = `${spriteSheet.columns > 1 ? (column / (spriteSheet.columns - 1)) * 100 : 0}% ${spriteSheet.rows > 1 ? (row / (spriteSheet.rows - 1)) * 100 : 0}%`;
  const renderStyle = getMovementSpriteRenderStyle(spriteSheet.normalization, scaleMultiplier);

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