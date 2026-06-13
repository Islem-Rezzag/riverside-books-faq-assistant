import type { AppConfig } from "../config.js";
import type { FAQ, Matcher } from "../types.js";
import { createConfiguredLexicalMatcher } from "./lexicalMatcher.js";
import { createSemanticMatcher } from "./semanticMatcher.js";

export async function createMatcher(
  faqs: FAQ[],
  config: AppConfig,
): Promise<Matcher> {
  const lexicalMatcher = createConfiguredLexicalMatcher(faqs, config);

  if (!config.openAIApiKey) {
    return lexicalMatcher;
  }

  try {
    return await createSemanticMatcher(faqs, {
      apiKey: config.openAIApiKey,
      threshold: config.semanticMatchThreshold,
      margin: config.semanticMatchMargin,
      fallbackMatcher: lexicalMatcher,
    });
  } catch {
    console.warn("OpenAI embeddings unavailable; using lexical matcher.");
    return lexicalMatcher;
  }
}
