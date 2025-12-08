export interface NormalizedWeights {
  dist: number;
  lug: number;
  gar: number;
}

export function normalizeWeights(
  dist: number,
  lug: number,
  gar: number
): NormalizedWeights {
  const total = dist + lug + gar;
  if (total === 0) return { dist: 0.33, lug: 0.33, gar: 0.33 };
  return {
    dist: dist / total,
    lug: lug / total,
    gar: gar / total,
  };
}

