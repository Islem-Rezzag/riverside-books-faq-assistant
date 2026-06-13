import type { AppConfig } from "../config.js";
import type { FAQ, MatchCandidate, Matcher, MatchResult } from "../types.js";
import { expandTokens, tokenize } from "../utils/text.js";
import { evaluateConfidence } from "./confidence.js";
import { tokenOverlapScore } from "./scoring.js";

const FAQ_ALIASES_BY_ID: Record<number, string> = {
  1: "opening hours open close closing times visit come in sunday saturday weekdays",
  2: "location address where find shop store mill lane riverside",
  3: "gift wrapping wrap present purchase till",
  4: "order book not in stock unavailable title arrive working days special order",
  5: "second hand books used old sell buy quote store",
  6: "events author readings monthly book club noticeboard dates",
  7: "parking park car nearby mill lane two minute walk",
  8: "loyalty scheme stamp purchase free book rewards ten stamps",
  9: "gift vouchers voucher gift card amount store online",
  10: "payment methods cash debit credit card contactless pay",
  11: "website online buy browse order delivery click collect",
  12: "click collect order online shop ready same day",
  13: "return refund unread receipt 30 days bring back exchange",
  14: "children kids child section corner picture books fiction reading nook",
  15: "recommend recommendation suggest book staff advice",
  16: "cafe coffee tea cakes browse",
  17: "wheelchair accessible accessibility access step free toilet disabled",
  18: "ebooks e-books audiobooks audiobook digital cd website",
  19: "reserve hold book till three days call pop in",
  20: "student discount 10 percent student id full price books",
};

interface LexicalDocument {
  faq: FAQ;
  tokens: string[];
}

interface LexicalMatcherOptions {
  threshold: number;
  margin: number;
}

export function buildFaqSearchText(faq: FAQ): string {
  return [faq.question, faq.answer, FAQ_ALIASES_BY_ID[faq.id] ?? ""]
    .join(" ")
    .trim();
}

export function createLexicalMatcher(
  faqs: FAQ[],
  options: LexicalMatcherOptions,
): Matcher {
  const documents: LexicalDocument[] = faqs.map((faq) => ({
    faq,
    tokens: expandTokens(tokenize(buildFaqSearchText(faq))),
  }));

  return {
    name: "lexical",
    async match(question: string): Promise<MatchResult> {
      const queryTokens = expandTokens(tokenize(question));

      if (queryTokens.length === 0) {
        return {
          faq: null,
          score: 0,
          secondBestScore: 0,
          matcher: "lexical",
          reason: "best score below threshold",
        };
      }

      const candidates = documents
        .map<MatchCandidate>((document) => ({
          faq: document.faq,
          score: tokenOverlapScore(queryTokens, document.tokens),
        }))
        .sort((a, b) => b.score - a.score);

      const bestCandidate = candidates[0];

      if (!bestCandidate) {
        return {
          faq: null,
          score: 0,
          secondBestScore: 0,
          matcher: "lexical",
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
        matcher: "lexical",
        reason: confidence.reason,
      };
    },
  };
}

export function createConfiguredLexicalMatcher(
  faqs: FAQ[],
  config: AppConfig,
): Matcher {
  return createLexicalMatcher(faqs, {
    threshold: config.lexicalMatchThreshold,
    margin: config.lexicalMatchMargin,
  });
}
