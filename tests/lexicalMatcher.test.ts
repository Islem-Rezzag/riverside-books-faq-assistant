import { beforeAll, describe, expect, it } from "vitest";

import { loadFaqs } from "../src/faqs.js";
import { createLexicalMatcher } from "../src/matchers/lexicalMatcher.js";
import type { Matcher } from "../src/types.js";

describe("lexical matcher", () => {
  let matcher: Matcher;

  beforeAll(async () => {
    const faqs = await loadFaqs();
    matcher = createLexicalMatcher(faqs, {
      threshold: 0.32,
      margin: 0.02,
    });
  });

  it.each([
    ["when can I come in?", 1],
    ["where can I find the shop?", 2],
    ["gift wrapping", 3],
    ["can you wrap this as a present?", 3],
    ["gift voucher", 9],
    ["can I buy a gift voucher?", 9],
    ["do you sell gift vouchers?", 9],
    ["can you get a book you don't have in stock?", 4],
    ["do you buy used books?", 5],
    ["do you take card?", 10],
    ["what payment methods do you accept?", 10],
    ["click collect", 12],
    ["do you offer click and collect?", 12],
    ["can I order from your website?", 11],
    ["can I get a refund?", 13],
    ["is there a discount for students?", 20],
  ])("matches %s to FAQ %i", async (question, expectedFaqId) => {
    const result = await matcher.match(question);

    expect(result.faq?.id).toBe(expectedFaqId);
    expect(result.reason).toBe("accepted");
  });

  it("falls back for unrelated questions", async () => {
    const result = await matcher.match("do you repair laptops?");

    expect(result.faq).toBeNull();
  });

  it("falls back for empty questions", async () => {
    const result = await matcher.match("");

    expect(result.faq).toBeNull();
  });
});
