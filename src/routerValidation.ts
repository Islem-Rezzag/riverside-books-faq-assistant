import type { FAQ, RouterDecision, ValidatedRoute } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValidShape(value: unknown): value is RouterDecision {
  if (!isRecord(value)) {
    return false;
  }

  const { answerable, matchedFaqId, confidence, reason } = value;

  return (
    typeof answerable === "boolean" &&
    (matchedFaqId === null ||
      (typeof matchedFaqId === "number" && Number.isInteger(matchedFaqId))) &&
    typeof confidence === "number" &&
    Number.isFinite(confidence) &&
    confidence >= 0 &&
    confidence <= 1 &&
    typeof reason === "string"
  );
}

export function validateRouterDecision(
  decision: unknown,
  faqs: FAQ[],
  threshold: number,
): ValidatedRoute {
  if (!hasValidShape(decision)) {
    return {
      status: "technical_error",
      faq: null,
      matchedFaqId: null,
      confidence: null,
      reason: "invalid router decision shape",
    };
  }

  if (!decision.answerable) {
    return {
      status: "no_match",
      faq: null,
      matchedFaqId: decision.matchedFaqId,
      confidence: decision.confidence,
      reason: decision.reason,
    };
  }

  if (decision.matchedFaqId === null) {
    return {
      status: "no_match",
      faq: null,
      matchedFaqId: null,
      confidence: decision.confidence,
      reason: decision.reason,
    };
  }

  const matchedFaq = faqs.find((faq) => faq.id === decision.matchedFaqId);

  if (!matchedFaq) {
    return {
      status: "technical_error",
      faq: null,
      matchedFaqId: decision.matchedFaqId,
      confidence: decision.confidence,
      reason: "router returned an invalid FAQ ID",
    };
  }

  if (decision.confidence < threshold) {
    return {
      status: "no_match",
      faq: null,
      matchedFaqId: decision.matchedFaqId,
      confidence: decision.confidence,
      reason: decision.reason,
    };
  }

  return {
    status: "success",
    faq: matchedFaq,
    matchedFaqId: matchedFaq.id,
    confidence: decision.confidence,
    reason: decision.reason,
  };
}
