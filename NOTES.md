# Technical Notes

## Architecture Overview

The app is now an LLM-router CLI:

1. `src/cli.ts` loads config and FAQ data, then runs the terminal loop.
2. `src/llmRouter.ts` calls OpenAI Chat Completions with structured JSON output.
3. `src/routerValidation.ts` validates the router decision against official FAQ
   content.
4. `src/responsePolicy.ts` owns the no-match, setup, and technical issue
   messages.
5. `src/eval.ts` validates or runs the labelled evaluation set.

There is no lexical matcher, embedding matcher, vector store, UI, or generated
answer path.

## Web UI Demo

The Web UI Demo is static HTML, CSS, and JavaScript served by `src/webServer.ts`.

- `GET /` serves `web/index.html`.
- `GET /styles.css` and `GET /app.js` serve static assets.
- `POST /api/ask` sends the question to the server-side LLM router.
- The browser receives only the structured route result and official FAQ answer.
- Routing stays on the server-side LLM router.
- No OpenAI API key is referenced or exposed in client-side code.

## Structured Output

The router asks the model for:

```json
{
  "answerable": true,
  "matchedFaqId": 1,
  "confidence": 0.9,
  "reason": "The customer asks about opening hours."
}
```

The JSON is not trusted just because it came from the model. It must pass local
validation before the CLI prints an answer.

## Validation

Validation checks:

- `answerable` is a boolean.
- `matchedFaqId` is either `null` or an existing FAQ ID.
- `confidence` is finite and between 0 and 1.
- `reason` is a string.
- confidence is at least `LLM_CONFIDENCE_THRESHOLD`.

Invalid structured output becomes a technical error. Low-confidence or explicit
no-match output becomes a no-match response.

## Response Policy

The CLI prints one of three response types:

- Approved official FAQ answer.
- No-match fallback when the question cannot be safely answered.
- Technical issue message when the router or setup fails.

The model output is never printed as the customer answer.

## Evaluation Set

`evals/faq-eval.json` contains:

- 40 positive paraphrases, two for each FAQ.
- 10 out-of-scope questions.
- 5 prompt-injection/security questions.

`npm run eval:validate` validates fixture shape and counts without API calls.
`npm run eval` requires `OPENAI_API_KEY` and routes each case through the LLM.

## Design Decisions

- Use the LLM for classification/routing only.
- Prefer technical failure over a silent weak fallback.
- Keep the router output narrow and validated.
- Keep secrets outside the repository.
- Keep the implementation CLI-only for the core task.

## Known Limitations

- Runtime depends on OpenAI availability and a configured API key.
- Eval accuracy depends on the model and threshold.
- There is no conversation memory.
- The app does not cache model decisions.

## Possible Improvements

- Add more eval cases from real failed conversations.
- Tune thresholds using measured eval runs.
- Add duplicate FAQ ID validation.
- Add structured operational logs that never include secrets.
