import "dotenv/config";

export interface AppConfig {
  openAIApiKey?: string;
  semanticMatchThreshold: number;
  semanticMatchMargin: number;
  lexicalMatchThreshold: number;
  lexicalMatchMargin: number;
  showDebug: boolean;
}

const DEFAULT_SEMANTIC_MATCH_THRESHOLD = 0.4;
const DEFAULT_SEMANTIC_MATCH_MARGIN = 0.03;
const DEFAULT_LEXICAL_MATCH_THRESHOLD = 0.32;
const DEFAULT_LEXICAL_MATCH_MARGIN = 0.02;

function readNumber(name: string, fallback: number): number {
  const value = process.env[name]?.trim();

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return fallback;
  }

  return value === "true" || value === "1" || value === "yes";
}

export function loadConfig(): AppConfig {
  const openAIApiKey = process.env.OPENAI_API_KEY?.trim();

  return {
    ...(openAIApiKey ? { openAIApiKey } : {}),
    semanticMatchThreshold: readNumber(
      "SEMANTIC_MATCH_THRESHOLD",
      DEFAULT_SEMANTIC_MATCH_THRESHOLD,
    ),
    semanticMatchMargin: readNumber(
      "SEMANTIC_MATCH_MARGIN",
      DEFAULT_SEMANTIC_MATCH_MARGIN,
    ),
    lexicalMatchThreshold: readNumber(
      "LEXICAL_MATCH_THRESHOLD",
      DEFAULT_LEXICAL_MATCH_THRESHOLD,
    ),
    lexicalMatchMargin: readNumber(
      "LEXICAL_MATCH_MARGIN",
      DEFAULT_LEXICAL_MATCH_MARGIN,
    ),
    showDebug: readBoolean("SHOW_DEBUG", false),
  };
}
