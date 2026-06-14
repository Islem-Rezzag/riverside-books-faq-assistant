import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { validateEvalCases } from "../src/eval.js";

describe("eval fixture", () => {
  it("validates without API calls", async () => {
    const rawJson = await readFile(
      path.join(process.cwd(), "evals", "faq-eval.json"),
      "utf8",
    );
    const cases = validateEvalCases(JSON.parse(rawJson));

    expect(cases).toHaveLength(55);
    expect(cases.filter((item) => item.category === "paraphrase")).toHaveLength(40);
    expect(cases.filter((item) => item.category === "out_of_scope")).toHaveLength(10);
    expect(cases.filter((item) => item.category === "prompt_injection")).toHaveLength(5);
  });
});
