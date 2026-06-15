import { readFile } from "node:fs/promises";
import path from "node:path";

import type { FAQ } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateFaq(value: unknown, index: number): FAQ {
  if (!isRecord(value)) {
    throw new Error(`Invalid FAQ at index ${index}: expected an object.`);
  }

  if (typeof value.id !== "number" || !Number.isInteger(value.id)) {
    throw new Error(`Invalid FAQ at index ${index}: id must be an integer.`);
  }

  if (typeof value.question !== "string" || value.question.trim() === "") {
    throw new Error(
      `Invalid FAQ at index ${index}: question must be a non-empty string.`,
    );
  }

  if (typeof value.answer !== "string" || value.answer.trim() === "") {
    throw new Error(
      `Invalid FAQ at index ${index}: answer must be a non-empty string.`,
    );
  }

  return {
    id: value.id,
    question: value.question,
    answer: value.answer,
  };
}

export async function loadFaqs(
  filePath = path.join(process.cwd(), "faqs.json"),
): Promise<FAQ[]> {
  const rawJson = await readFile(filePath, "utf8");
  const parsed: unknown = JSON.parse(rawJson);

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Invalid FAQ data: expected faqs.json to contain an array.",
    );
  }

  return parsed.map((faq, index) => validateFaq(faq, index));
}
