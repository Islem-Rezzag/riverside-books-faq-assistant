/// <reference types="node" />

export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export type MatcherName = "lexical" | "semantic";

export interface MatchCandidate {
  faq: FAQ;
  score: number;
}

export interface MatchResult {
  faq: FAQ | null;
  score: number;
  secondBestScore: number;
  matcher: MatcherName;
  reason: string;
}

export interface Matcher {
  name: MatcherName;
  match(question: string): Promise<MatchResult>;
}
