const WEAK_GENERIC_TOKENS = new Set([
  "ask",
  "book",
  "books",
  "buy",
  "order",
  "return",
  "sell",
  "shop",
  "store",
]);

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;

  for (let index = 0; index < a.length; index += 1) {
    const aValue = a[index] ?? 0;
    const bValue = b[index] ?? 0;

    dotProduct += aValue * bValue;
    aMagnitude += aValue * aValue;
    bMagnitude += bValue * bValue;
  }

  if (aMagnitude === 0 || bMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
}

export function tokenOverlapScore(
  queryTokens: string[],
  documentTokens: string[],
): number {
  const querySet = new Set(queryTokens);
  const documentSet = new Set(documentTokens);

  if (querySet.size === 0 || documentSet.size === 0) {
    return 0;
  }

  const overlapTokens = [...querySet].filter((token) => documentSet.has(token));

  if (overlapTokens.length === 0) {
    return 0;
  }

  if (
    overlapTokens.length < 2 &&
    overlapTokens.every((token) => WEAK_GENERIC_TOKENS.has(token))
  ) {
    return 0.08;
  }

  const normalizedOverlap =
    overlapTokens.length / Math.sqrt(querySet.size * documentSet.size);
  const queryCoverage = overlapTokens.length / querySet.size;
  const phraseBonus = hasPhraseMatch(queryTokens, documentTokens) ? 0.05 : 0;
  const score = normalizedOverlap * 0.75 + queryCoverage * 0.25 + phraseBonus;

  return Math.min(score, 1);
}

function hasPhraseMatch(queryTokens: string[], documentTokens: string[]): boolean {
  if (queryTokens.length < 2) {
    return false;
  }

  const queryPhrase = queryTokens.join(" ");
  const documentPhrase = documentTokens.join(" ");

  return documentPhrase.includes(queryPhrase);
}
