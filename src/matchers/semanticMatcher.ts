import OpenAI from "openai";

import type { FAQ, MatchCandidate, Matcher, MatchResult } from "../types.js";
import { tokenize } from "../utils/text.js";
import { evaluateConfidence } from "./confidence.js";
import { buildFaqSearchText } from "./lexicalMatcher.js";
import { cosineSimilarity } from "./scoring.js";

const EMBEDDING_MODEL = "text-embedding-3-small";

interface SemanticDocument {
  faq: FAQ;
  embedding: number[];
}

interface SemanticMatcherOptions {
  apiKey: string;
  threshold: number;
  margin: number;
  fallbackMatcher: Matcher;
}

export async function createSemanticMatcher(
  faqs: FAQ[],
  options: SemanticMatcherOptions,
): Promise<Matcher> {
  const client = new OpenAI({ apiKey: options.apiKey });

  async function embed(text: string): Promise<number[]> {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    const firstEmbedding = response.data[0]?.embedding;

    if (!firstEmbedding) {
      throw new Error("OpenAI embedding response did not include an embedding.");
    }

    return firstEmbedding;
  }

  const documents: SemanticDocument[] = await Promise.all(
    faqs.map(async (faq) => ({
      faq,
      embedding: await embed(buildFaqSearchText(faq)),
    })),
  );

  return {
    name: "semantic",
    async match(question: string): Promise<MatchResult> {
      if (tokenize(question).length === 0) {
        return {
          faq: null,
          score: 0,
          secondBestScore: 0,
          matcher: "semantic",
          reason: "best score below threshold",
        };
      }

      try {
        const queryEmbedding = await embed(question);
        const candidates = documents
          .map<MatchCandidate>((document) => ({
            faq: document.faq,
            score: cosineSimilarity(queryEmbedding, document.embedding),
          }))
          .sort((a, b) => b.score - a.score);

        const bestCandidate = candidates[0];

        if (!bestCandidate) {
          return {
            faq: null,
            score: 0,
            secondBestScore: 0,
            matcher: "semantic",
            reason: "no FAQs available",
          };
        }

        const secondBestScore = candidates[1]?.score ?? 0;
        const confidence = evaluateConfidence(
          bestCandidate.score,
          secondBestScore,
          options.threshold,
          options.margin,
        );

        return {
          faq: confidence.accepted ? bestCandidate.faq : null,
          score: bestCandidate.score,
          secondBestScore,
          matcher: "semantic",
          reason: confidence.reason,
        };
      } catch {
        console.warn("OpenAI embeddings unavailable; using lexical matcher.");
        return options.fallbackMatcher.match(question);
      }
    },
  };
}
