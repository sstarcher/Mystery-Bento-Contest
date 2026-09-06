export type CurioDebugState = {
  isDebugMode: boolean;
  initialShowcaseEnabled: boolean;
};

export function getCurioDebugState(search: string): CurioDebugState {
  const params = new URLSearchParams(search);
  const isDebugMode = params.has('debug');

  return {
    isDebugMode,
    initialShowcaseEnabled: isDebugMode && params.get('debug') === 'curio-shelf',
  };
}

export function selectRestaurantShelfCollectibles<T>(
  earnedCollectibles: readonly T[],
  showcaseCollectibles: readonly T[],
  {
    isDebugMode,
    showcaseEnabled,
    maxItems,
  }: {
    isDebugMode: boolean;
    showcaseEnabled: boolean;
    maxItems: number;
  },
): readonly T[] {
  if (!isDebugMode || !showcaseEnabled) return earnedCollectibles;
  return showcaseCollectibles.slice(0, Math.max(0, maxItems));
}