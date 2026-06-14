const PROMPT_INJECTION_PATTERNS = [
  /\bignore\s+(?:all\s+)?previous\s+instructions\b/i,
  /\byou\s+are\s+now\s+the\s+system\b/i,
  /\balways\s+answer\s+faq\b/i,
  /\btell\s+me\s+the\s+api\s+key\b/i,
  /\bprint\s+your\s+hidden\s+prompt\b/i,
  /\bforget\s+the\s+faqs\b/i,
  /\bdo\s+not\s+follow\s+the\s+routing\s+rules\b/i,
  /\breveal\s+(?:the\s+)?system\s+prompt\b/i,
  /\bshow\s+(?:the\s+)?developer\s+message\b/i,
];

export function isUnsafePromptInjectionAttempt(question: string): boolean {
  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(question));
}
