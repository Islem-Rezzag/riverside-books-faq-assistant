const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "can",
  "could",
  "did",
  "do",
  "does",
  "don",
  "dont",
  "for",
  "from",
  "has",
  "have",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "please",
  "should",
  "t",
  "that",
  "the",
  "there",
  "this",
  "to",
  "us",
  "we",
  "what",
  "when",
  "where",
  "with",
  "would",
  "you",
  "your",
]);

const SYNONYM_MAP = new Map<string, string[]>([
  ["open", ["hours", "opening", "visit", "come"]],
  ["opening", ["open", "hours", "times"]],
  ["hours", ["open", "opening", "times"]],
  ["come", ["visit", "open"]],
  ["visit", ["open", "come", "shop"]],
  ["location", ["address", "where", "find"]],
  ["address", ["location", "where", "find"]],
  ["shop", ["store", "bookshop"]],
  ["store", ["shop", "bookshop"]],
  ["wrap", ["wrapping", "present"]],
  ["wrapping", ["wrap", "present"]],
  ["present", ["wrap", "wrapping"]],
  ["voucher", ["gift", "card"]],
  ["vouchers", ["voucher", "gift", "card"]],
  ["refund", ["return", "exchange"]],
  ["return", ["refund", "bring", "back"]],
  ["parking", ["park", "car"]],
  ["park", ["parking", "car"]],
  ["car", ["parking", "park"]],
  ["student", ["discount"]],
  ["discount", ["student"]],
  ["children", ["kids", "child"]],
  ["kids", ["children"]],
  ["cafe", ["coffee", "tea", "cakes"]],
  ["accessible", ["wheelchair", "access"]],
  ["ebook", ["digital", "audiobook"]],
  ["audiobook", ["digital", "ebook"]],
  ["reserve", ["hold"]],
  ["payment", ["pay", "accept", "take", "cash", "card", "contactless"]],
  ["pay", ["payment", "accept", "take", "cash", "card", "contactless"]],
  ["accept", ["payment", "pay", "take"]],
  ["take", ["payment", "pay", "accept"]],
  ["cash", ["payment", "pay", "contactless"]],
  ["contactless", ["payment", "pay", "card"]],
  ["order", ["buy", "purchase"]],
  ["buy", ["order", "purchase"]],
  ["website", ["online"]],
  ["online", ["website"]],
  ["event", ["events", "bookclub", "readings"]],
]);

const EXPANDED_SYNONYM_MAP = buildExpandedSynonymMap();

function buildExpandedSynonymMap(): Map<string, Set<string>> {
  const expanded = new Map<string, Set<string>>();

  for (const [token, synonyms] of SYNONYM_MAP.entries()) {
    addSynonyms(expanded, token, synonyms);
  }

  return expanded;
}

function addSynonyms(
  synonymMap: Map<string, Set<string>>,
  token: string,
  synonyms: string[],
): void {
  const existing = synonymMap.get(token) ?? new Set<string>();

  for (const synonym of synonyms) {
    existing.add(synonym);
  }

  synonymMap.set(token, existing);
}

function singularize(token: string): string | null {
  if (token.length <= 3) {
    return null;
  }

  if (token.endsWith("ies")) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }

  return null;
}

export function normalizeText(text: string): string {
  const cleaned = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019\u201b`]/g, "'")
    .replace(/[\u2010-\u2015]/g, "-")
    .toLowerCase()
    .replace(
      /\b(?:do not|does not|did not|don't|doesn't|didn't|dont|doesnt|didnt)\b/g,
      " not ",
    )
    .replace(/\be[-\s]?books?\b/g, " ebook ")
    .replace(/\baudio[-\s]?books?\b/g, " audiobook ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/['-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  return cleaned
    .split(" ")
    .filter((token) => token.length > 0 && !STOPWORDS.has(token))
    .join(" ");
}

export function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized ? normalized.split(" ") : [];
}

export function expandTokens(tokens: string[]): string[] {
  const expanded = new Set<string>();

  for (const token of tokens) {
    expanded.add(token);

    const singular = singularize(token);
    if (singular) {
      expanded.add(singular);
    }

    const synonyms = EXPANDED_SYNONYM_MAP.get(token);
    if (synonyms) {
      for (const synonym of synonyms) {
        expanded.add(synonym);
      }
    }

    if (singular) {
      const singularSynonyms = EXPANDED_SYNONYM_MAP.get(singular);
      if (singularSynonyms) {
        for (const synonym of singularSynonyms) {
          expanded.add(synonym);
        }
      }
    }
  }

  return [...expanded];
}
