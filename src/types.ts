/// <reference types="node" />

export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export interface RouterDecision {
  answerable: boolean;
  matchedFaqId: number | null;
  confidence: number;
  reason: string;
}

export type ValidatedRoute =
  | {
      status: "success";
      faq: FAQ;
      matchedFaqId: number;
      confidence: number;
      reason: string;
    }
  | {
      status: "no_match";
      faq: null;
      matchedFaqId: number | null;
      confidence: number;
      reason: string;
    }
  | {
      status: "technical_error";
      faq: null;
      matchedFaqId: number | null;
      confidence: number | null;
      reason: string;
    };

export type RouteResult = ValidatedRoute & {
  model: string;
};
