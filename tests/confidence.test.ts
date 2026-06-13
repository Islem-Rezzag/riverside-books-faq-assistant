import { describe, expect, it } from "vitest";

import { evaluateConfidence } from "../src/matchers/confidence.js";

describe("evaluateConfidence", () => {
  it("accepts a clear match above threshold and margin", () => {
    expect(evaluateConfidence(0.7, 0.4, 0.32, 0.02)).toEqual({
      accepted: true,
      reason: "accepted",
    });
  });

  it("rejects when the best score is below threshold", () => {
    expect(evaluateConfidence(0.2, 0.1, 0.32, 0.02)).toEqual({
      accepted: false,
      reason: "best score below threshold",
    });
  });

  it("rejects ambiguous close top matches", () => {
    expect(evaluateConfidence(0.5, 0.49, 0.32, 0.02)).toEqual({
      accepted: false,
      reason: "top matches too close",
    });
  });
});
