# Riverside Books FAQ Assistant

A command-line FAQ chatbot for the Magnus Consulting AI Graduate technical task.
It answers customer questions for Riverside Books by matching the question to the
approved FAQ data in `faqs.json`.

## What It Does

- Lets a customer type a question in the terminal.
- Finds the closest matching Riverside Books FAQ.
- Returns the approved answer from `faqs.json`.
- Falls back safely when there is no good match.
- Keeps running until the user types `quit` or `exit`.

The FAQ data is the source of truth. The bot does not generate new policy
answers.

## Tech Stack

- Node.js
- TypeScript
- ESM modules
- Vitest
- Optional OpenAI embeddings via the `openai` package
- Local offline lexical matching as the default fallback

## Install

```bash
npm install
```

## Run Development Mode

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Run The Compiled App

```bash
npm start
```

## Run Tests

```bash
npm test
```

## Optional OpenAI Setup

The app works without an OpenAI API key by using the local lexical matcher.

To enable the optional embeddings matcher, create a local `.env` file based on
`.env.example` and add a real `OPENAI_API_KEY` there.

Never commit `.env`, `.env.*`, API keys, or secret links. The repository only
tracks `.env.example` with placeholder values.

## Matching Approach

The assistant uses retrieval-style matching:

1. Load and validate `faqs.json`.
2. Build searchable text for each FAQ from the question, answer, and a small set
   of manual aliases.
3. Normalize, tokenize, expand synonyms, and score each FAQ.
4. Compare the best match against a confidence threshold.
5. Reject the match if the top two scores are too close.
6. Return the original FAQ answer only when the match is confident.

If `OPENAI_API_KEY` is present, the app attempts to use OpenAI embeddings with
`text-embedding-3-small` for matching. If the key is missing, setup fails, or an
embedding call fails, the app falls back to the local lexical matcher.

## Why Retrieval Instead Of Generation

Riverside Books policies are already defined in `faqs.json`, so the safest
answer is an approved FAQ answer. Generating free-form answers would increase
the risk of inventing policies, prices, opening times, or services that are not
in the source data.

The optional AI path is used only to improve matching. It never generates the
customer-facing answer.

## No-Good-Answer Handling

The app refuses to answer when:

- The best score is below the configured threshold.
- The top two matches are too close to call.
- The question is empty.
- OpenAI matching is unavailable and the lexical matcher cannot find a confident
  match.

Fallback response:

```text
Riverside Books: Sorry, I don't know that one — please ask a member of staff.
```

## Trade-Offs

- Accuracy: lexical matching is simple and transparent, but it can miss unusual
  phrasing. Embeddings can improve semantic matching when available.
- Latency: lexical matching is instant and offline. Embeddings add network
  latency during startup and each query.
- Cost: lexical matching is free. Embeddings have API cost when enabled.
- Hallucination risk: returning only approved FAQ answers keeps unsupported
  answers out of the chatbot.
- Robustness: the CLI still works without network access or an API key because
  the lexical matcher is always available.

## Assumptions

- `faqs.json` remains the trusted source data.
- FAQ IDs are stable and unique.
- A safe fallback is better than confidently returning the wrong policy.
- A command-line interface is sufficient for the core technical task.

## What I Would Do With More Time

- Add evaluation fixtures with more paraphrased customer questions.
- Tune thresholds from measured examples rather than fixed defaults.
- Cache embeddings locally so startup does not recompute them every time.
- Add structured debug output for reviewing failed matches.
- Add a small admin check to detect duplicate or missing FAQ IDs.

## Example Questions

Try:

- `when can I come in?`
- `where can I find the shop?`
- `can you wrap this as a present?`
- `can you get a book you don't have in stock?`
- `do you buy used books?`
- `can I get a refund?`
- `is there a discount for students?`
- `do you repair laptops?`
