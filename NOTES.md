# Technical Notes

## Architecture Overview

The CLI loads configuration, validates `faqs.json`, creates the best available
matcher, and then reads questions from standard input until the user exits.

The matcher layer has two implementations:

- `lexicalMatcher`: offline matching using token overlap, FAQ aliases, synonym
  expansion, thresholds, and ambiguity margins.
- `semanticMatcher`: optional OpenAI embedding matching using
  `text-embedding-3-small`.

Both matchers return a `MatchResult`. The CLI is responsible for printing either
the approved FAQ answer or the safe fallback message.

## Main Design Decisions

- FAQ answers are never generated. The app only returns text from `faqs.json`.
- OpenAI embeddings are optional so the app remains usable without secrets,
  network access, or API spend.
- Confidence checks are shared across matchers so low-confidence and ambiguous
  results are handled consistently.
- Lexical aliases are explicit because the FAQ set is small and known.
- The fallback message lives in the CLI rather than inside the matcher.

## Known Limitations

- Lexical matching can miss phrasing that has no overlapping useful terms.
- Manual aliases need maintenance if the FAQ data changes.
- Embeddings are recomputed on startup when OpenAI matching is enabled.
- The app has no conversation memory; each question is handled independently.

## Possible Improvements

- Add a larger labelled evaluation set for threshold tuning.
- Cache FAQ embeddings between runs.
- Add clearer debug reports for the top few rejected matches.
- Add validation for duplicate FAQ IDs.
- Consider a lightweight UI only after the CLI is complete and evaluated.
