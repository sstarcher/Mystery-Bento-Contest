export type CurioShelfPlacement = {
  cell: number;
};

export type CurioShelfPlacementMap = Record<string, CurioShelfPlacement>;

export const CURIO_SHELF_GRID = {
  columns: 6,
  rows: 2,
  cellCount: 12,
} as const;

// The stage deliberately keeps two empty cells for breathing room around the
// ten curios currently allowed on the restaurant shelf.
export const CURIO_SHELF_SLOTS: readonly number[] = Array.from(
  { length: CURIO_SHELF_GRID.cellCount },
  (_, cell) => cell,
);

function isFiniteShelfPlacement(value: unknown): value is CurioShelfPlacement {
  if (!value || typeof value !== 'object') return false;
  const placement = value as Partial<CurioShelfPlacement>;
  return typeof placement.cell === 'number'
    && Number.isInteger(placement.cell)
    && placement.cell >= 0
    && placement.cell < CURIO_SHELF_GRID.cellCount;
}

function shuffledSlots(random: () => number): number[] {
  const slots = [...CURIO_SHELF_SLOTS];
  for (let index = slots.length - 1; index > 0; index -= 1) {
    const rawIndex = Math.floor(random() * (index + 1));
    const swapIndex = Math.max(0, Math.min(index, Number.isFinite(rawIndex) ? rawIndex : 0));
    [slots[index], slots[swapIndex]] = [slots[swapIndex], slots[index]];
  }
  return slots;
}

export function normalizeCurioPlacements(value: CurioShelfPlacementMap): CurioShelfPlacementMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const normalized: CurioShelfPlacementMap = {};
  for (const [id, placement] of Object.entries(value)) {
    if (id && isFiniteShelfPlacement(placement)) normalized[id] = { cell: placement.cell };
  }
  return normalized;
}

export function curioPlacementsEqual(first: CurioShelfPlacementMap, second: CurioShelfPlacementMap) {
  const firstIds = Object.keys(first);
  const secondIds = Object.keys(second);
  if (firstIds.length !== secondIds.length) return false;
  return firstIds.every((id) => first[id]?.cell === second[id]?.cell);
}

export function reconcileCurioPlacements(
  displayedIds: readonly string[],
  existing: CurioShelfPlacementMap,
  random: () => number = Math.random,
): CurioShelfPlacementMap {
  const next: CurioShelfPlacementMap = {};
  const displayed = new Set(displayedIds);

  for (const id of displayedIds) {
    const placement = existing[id];
    if (
      placement
      && isFiniteShelfPlacement(placement)
      && !Object.values(next).some((assigned) => assigned.cell === placement.cell)
    ) {
      next[id] = { cell: placement.cell };
    }
  }

  const availableSlots = shuffledSlots(random);
  for (const id of displayedIds) {
    if (next[id]) continue;
    const slotIndex = availableSlots.findIndex((slot) => !Object.values(next).some((assigned) => assigned.cell === slot));
    if (slotIndex < 0) break;
    next[id] = { cell: availableSlots.splice(slotIndex, 1)[0] };
  }

  // The caller only receives placements for currently displayed curios. This
  // also makes stale localStorage entries disappear on the next write.
  return Object.fromEntries(Object.entries(next).filter(([id]) => displayed.has(id)));
}