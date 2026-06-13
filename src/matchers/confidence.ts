export interface ConfidenceResult {
  accepted: boolean;
  reason: string;
}

export function evaluateConfidence(
  bestScore: number,
  secondBestScore: number,
  threshold: number,
  margin: number,
): ConfidenceResult {
  if (bestScore < threshold) {
    return {
      accepted: false,
      reason: "best score below threshold",
    };
  }

  if (bestScore - secondBestScore < margin) {
    return {
      accepted: false,
      reason: "top matches too close",
    };
  }

  return {
    accepted: true,
    reason: "accepted",
  };
}
