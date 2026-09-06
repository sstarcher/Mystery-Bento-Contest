export type RaceObstaclePlacement = {
  position: number;
  offsetX?: number;
  offsetY?: number;
};

export const RACE_OBSTACLE_DEFAULT_BOTTOM_PX = 210;

export const RACE_OBSTACLE_PLACEMENTS: readonly RaceObstaclePlacement[] = [
  { position: 18, offsetX: 200, offsetY: 80 },
  { position: 40 },
  { position: 62, offsetY: -50 },
  { position: 83, offsetX: 200 },
];

function getPlacement(index: number) {
  return RACE_OBSTACLE_PLACEMENTS[index]
    ?? RACE_OBSTACLE_PLACEMENTS[RACE_OBSTACLE_PLACEMENTS.length - 1];
}

export function getRaceObstacleLeftCss(index: number) {
  const placement = getPlacement(index);
  if (!placement.offsetX) return `${placement.position}%`;
  return `calc(${placement.position}% + ${placement.offsetX}px)`;
}

export function getRaceObstacleBottomPx(index: number) {
  const offsetY = getPlacement(index).offsetY;
  return typeof offsetY === 'number'
    ? RACE_OBSTACLE_DEFAULT_BOTTOM_PX - offsetY
    : undefined;
}