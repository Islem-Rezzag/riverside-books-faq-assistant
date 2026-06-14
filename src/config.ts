import "dotenv/config";

export interface AppConfig {
  openAIApiKey?: string;
  openAIModel: string;
  llmConfidenceThreshold: number;
  llmMaxRetries: number;
  showDebug: boolean;
}

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_LLM_CONFIDENCE_THRESHOLD = 0.7;
const DEFAULT_LLM_MAX_RETRIES = 1;

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

function readInteger(name: string, fallback: number): number {
  const value = process.env[name]?.trim();

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

export function loadConfig(): AppConfig {
  const openAIApiKey = process.env.OPENAI_API_KEY?.trim();
  const openAIModel = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;

  return {
    ...(openAIApiKey ? { openAIApiKey } : {}),
    openAIModel,
    llmConfidenceThreshold: readNumber(
      "LLM_CONFIDENCE_THRESHOLD",
      DEFAULT_LLM_CONFIDENCE_THRESHOLD,
    ),
    llmMaxRetries: readInteger("LLM_MAX_RETRIES", DEFAULT_LLM_MAX_RETRIES),
    showDebug: readBoolean("SHOW_DEBUG", false),
  };
}
