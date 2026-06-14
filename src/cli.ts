import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { loadConfig } from "./config.js";
import { loadFaqs } from "./faqs.js";
import { routeQuestionWithLLM } from "./llmRouter.js";
import {
  NO_MATCH_MESSAGE,
  SETUP_MESSAGE,
  TECHNICAL_ISSUE_MESSAGE,
} from "./responsePolicy.js";
import type { RouteResult } from "./types.js";

function printDebug(result: RouteResult): void {
  const matchedFaqId = result.matchedFaqId ?? "none";
  const confidence =
    result.confidence === null ? "none" : result.confidence.toFixed(3);

  console.log(
    `Debug: status=${result.status} faqId=${matchedFaqId} confidence=${confidence} reason=${result.reason} model=${result.model}`,
  );
}

async function main(): Promise<void> {
  const config = loadConfig();
  const faqs = await loadFaqs();

  if (!config.openAIApiKey) {
    console.error(SETUP_MESSAGE);
    process.exitCode = 1;
    return;
  }

  const readline = createInterface({ input, output });

  console.log("Riverside Books FAQ Assistant");
  console.log("Using LLM router.");
  console.log('Type "quit" or "exit" to leave.');

  try {
    while (true) {
      const rawQuestion = await readline.question("You: ");
      const question = rawQuestion.trim();

      if (question.toLowerCase() === "quit" || question.toLowerCase() === "exit") {
        break;
      }

      if (question === "") {
        console.log('Riverside Books: Please enter a question, or type "quit" to exit.');
        continue;
      }

      const result = await routeQuestionWithLLM(question, faqs, config);

      if (result.status === "success") {
        console.log(`Riverside Books: ${result.faq.answer}`);
      } else if (result.status === "no_match") {
        console.log(NO_MATCH_MESSAGE);
      } else {
        console.log(TECHNICAL_ISSUE_MESSAGE);
      }

      if (config.showDebug) {
        printDebug(result);
      }
    }
  } finally {
    readline.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
