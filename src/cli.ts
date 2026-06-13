import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { loadConfig } from "./config.js";
import { loadFaqs } from "./faqs.js";
import { createMatcher } from "./matchers/matcher.js";
import type { MatchResult } from "./types.js";

const FALLBACK_MESSAGE =
  "Riverside Books: Sorry, I don't know that one \u2014 please ask a member of staff.";

function printDebug(result: MatchResult): void {
  const matchedFaqId = result.faq?.id ?? "none";

  console.log(
    `Debug: score=${result.score.toFixed(3)} secondBestScore=${result.secondBestScore.toFixed(
      3,
    )} matcher=${result.matcher} reason=${result.reason} faqId=${matchedFaqId}`,
  );
}

async function main(): Promise<void> {
  const config = loadConfig();
  const faqs = await loadFaqs();
  const matcher = await createMatcher(faqs, config);
  const readline = createInterface({ input, output });

  console.log("Riverside Books FAQ Assistant");
  console.log(`Using ${matcher.name} matcher.`);
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

      const result = await matcher.match(question);

      if (result.faq) {
        console.log(`Riverside Books: ${result.faq.answer}`);
      } else {
        console.log(FALLBACK_MESSAGE);
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
