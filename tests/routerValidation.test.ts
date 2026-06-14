import { describe, expect, it } from "vitest";

import { validateRouterDecision } from "../src/routerValidation.js";
import type { FAQ } from "../src/types.js";

const faqs: FAQ[] = [
  {
    id: 1,
    question: "What are your opening hours?",
    answer: "We are open every day.",
  },
  {
    id: 2,
    question: "Where are you located?",
    answer: "We are on Mill Lane.",
  },
];

describe("validateRouterDecision", () => {
  it("accepts a valid confident FAQ ID", () => {
    const result = validateRouterDecision(
      {
        answerable: true,
        matchedFaqId: 1,
        confidence: 0.9,
        reason: "opening hours question",
      },
      faqs,
      0.7,
    );

    expect(result.status).toBe("success");
    expect(result.faq?.id).toBe(1);
  });

  it("returns no_match when answerable=false", () => {
    const result = validateRouterDecision(
      {
        answerable: false,
        matchedFaqId: null,
        confidence: 0,
        reason: "unrelated",
      },
      faqs,
      0.7,
    );

    expect(result.status).toBe("no_match");
  });

  it("returns no_match when matchedFaqId=null", () => {
    const result = validateRouterDecision(
      {
        answerable: true,
        matchedFaqId: null,
        confidence: 0.95,
        reason: "no FAQ selected",
      },
      faqs,
      0.7,
    );

    expect(result.status).toBe("no_match");
  });

  it("returns no_match when confidence is below threshold", () => {
    const result = validateRouterDecision(
      {
        answerable: true,
        matchedFaqId: 1,
        confidence: 0.4,
        reason: "weak match",
      },
      faqs,
      0.7,
    );

    expect(result.status).toBe("no_match");
  });

  it("returns technical_error for invalid FAQ ID", () => {
    const result = validateRouterDecision(
      {
        answerable: true,
        matchedFaqId: 999,
        confidence: 0.95,
        reason: "invalid ID",
      },
      faqs,
      0.7,
    );

    expect(result.status).toBe("technical_error");
  });

  it("returns technical_error for malformed confidence", () => {
    const result = validateRouterDecision(
      {
        answerable: true,
        matchedFaqId: 1,
        confidence: Number.NaN,
        reason: "bad confidence",
      },
      faqs,
      0.7,
    );

    expect(result.status).toBe("technical_error");
  });
});
