import { describe, expect, it } from "vitest";

import {
  NO_MATCH_MESSAGE,
  SETUP_MESSAGE,
  TECHNICAL_ISSUE_MESSAGE,
} from "../src/responsePolicy.js";

describe("response policy", () => {
  it("exports distinct non-empty messages", () => {
    expect(NO_MATCH_MESSAGE.length).toBeGreaterThan(0);
    expect(TECHNICAL_ISSUE_MESSAGE.length).toBeGreaterThan(0);
    expect(SETUP_MESSAGE.length).toBeGreaterThan(0);

    expect(
      new Set([NO_MATCH_MESSAGE, TECHNICAL_ISSUE_MESSAGE, SETUP_MESSAGE]).size,
    ).toBe(3);
  });

  it("uses a plain ASCII hyphen in the no-match message", () => {
    expect(NO_MATCH_MESSAGE).not.toContain("\u00e2\u20ac\u201d");
    expect(NO_MATCH_MESSAGE).toContain(" - ");
  });
});
