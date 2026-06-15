import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { loadConfig } from "./config.js";
import { loadFaqs } from "./faqs.js";
import { routeQuestionWithLLM } from "./llmRouter.js";
import { SETUP_MESSAGE } from "./responsePolicy.js";

export type EvalCategory = "paraphrase" | "out_of_scope" | "prompt_injection";

export interface EvalCase {
  question: string;
  expectedFaqId: number | null;
  category: EvalCategory;
}

interface FailureRow {
  question: string;
  category: EvalCategory;
  expected: number | null;
  actual: number | null | "technical_error";
  reason: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEvalCategory(value: unknown): value is EvalCategory {
  return (
    value === "paraphrase" ||
    value === "out_of_scope" ||
    value === "prompt_injection"
  );
}

export function validateEvalCases(value: unknown): EvalCase[] {
  if (!Array.isArray(value)) {
    throw new Error("Eval fixture must be an array.");
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Eval case ${index} must be an object.`);
    }

    if (typeof item.question !== "string" || item.question.trim() === "") {
      throw new Error(`Eval case ${index} must have a non-empty question.`);
    }

    if (
      item.expectedFaqId !== null &&
      (typeof item.expectedFaqId !== "number" ||
        !Number.isInteger(item.expectedFaqId))
    ) {
      throw new Error(`Eval case ${index} has an invalid expectedFaqId.`);
    }

    if (!isEvalCategory(item.category)) {
      throw new Error(`Eval case ${index} has an invalid category.`);
    }

    return {
      question: item.question,
      expectedFaqId: item.expectedFaqId,
      category: item.category,
    };
  });
}

async function loadEvalCases(
  filePath = path.join(process.cwd(), "evals", "faq-eval.json"),
): Promise<EvalCase[]> {
  const rawJson = await readFile(filePath, "utf8");
  return validateEvalCases(JSON.parse(rawJson));
}

function printCounts(cases: EvalCase[]): void {
  const counts = {
    total: cases.length,
    paraphrase: cases.filter((item) => item.category === "paraphrase").length,
    out_of_scope: cases.filter((item) => item.category === "out_of_scope")
      .length,
    prompt_injection: cases.filter(
      (item) => item.category === "prompt_injection",
    ).length,
  };

  console.log(`total: ${counts.total}`);
  console.log(`paraphrase: ${counts.paraphrase}`);
  console.log(`out_of_scope: ${counts.out_of_scope}`);
  console.log(`prompt_injection: ${counts.prompt_injection}`);
}

async function runEvaluation(cases: EvalCase[]): Promise<void> {
  const config = loadConfig();

  if (!config.openAIApiKey) {
    console.error(SETUP_MESSAGE);
    process.exitCode = 1;
    return;
  }

  const faqs = await loadFaqs();
  const failures: FailureRow[] = [];
  let passed = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  for (const evalCase of cases) {
    const result = await routeQuestionWithLLM(evalCase.question, faqs, config);
    const actual =
      result.status === "success"
        ? result.matchedFaqId
        : result.status === "technical_error"
          ? "technical_error"
          : null;

    if (actual === evalCase.expectedFaqId) {
      passed += 1;
      continue;
    }

    if (typeof actual === "number" && evalCase.expectedFaqId === null) {
      falsePositives += 1;
    }

    if (
      actual !== "technical_error" &&
      actual === null &&
      evalCase.expectedFaqId !== null
    ) {
      falseNegatives += 1;
    }

    if (actual === "technical_error" && evalCase.expectedFaqId !== null) {
      falseNegatives += 1;
    }

    failures.push({
      question: evalCase.question,
      category: evalCase.category,
      expected: evalCase.expectedFaqId,
      actual,
      reason:
        result.status === "technical_error" ? "technical_error" : result.reason,
    });
  }

  const total = cases.length;
  const failed = total - passed;
  const accuracy = total === 0 ? 0 : (passed / total) * 100;

  console.log(`total: ${total}`);
  console.log(`passed: ${passed}`);
  console.log(`failed: ${failed}`);
  console.log(`accuracy: ${accuracy.toFixed(1)}%`);
  console.log(`false positives: ${falsePositives}`);
  console.log(`false negatives: ${falseNegatives}`);

  if (failures.length > 0) {
    console.table(failures);
  }
}

async function main(): Promise<void> {
  const validateOnly = process.argv.includes("--validate-only");
  const cases = await loadEvalCases();

  if (validateOnly) {
    printCounts(cases);
    return;
  }

  await runEvaluation(cases);
}

const entryPoint = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";

if (import.meta.url === entryPoint) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  });
}
