export function selectContestants<T extends { id: string }>(
  contestants: T[],
  excludedId: string | null | undefined,
  rng: () => number,
  count = 3,
) {
  const eligible = contestants.filter((contestant) => contestant.id !== excludedId);
  const selected = [...eligible];
  for (let index = selected.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [selected[index], selected[swapIndex]] = [selected[swapIndex], selected[index]];
  }
  return selected.slice(0, Math.min(count, eligible.length));
}