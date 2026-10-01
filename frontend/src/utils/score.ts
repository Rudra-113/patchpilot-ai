import type { Finding, Severity } from "../types/security";

/** Points removed from 100 for each open finding. Two criticals + the rest of the demo set = 28, so the demo score is 72. */
export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 7,
  high: 3,
  medium: 1,
  low: 1,
};

export function isOpenFinding(finding: Finding) {
  return finding.status !== "verified";
}

export function scoreFromFindings(findings: Finding[]) {
  const penalty = findings
    .filter(isOpenFinding)
    .reduce((sum, finding) => sum + SEVERITY_WEIGHTS[finding.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function countsFromFindings(findings: Finding[]) {
  const open = findings.filter(isOpenFinding);
  return {
    critical: open.filter((finding) => finding.severity === "critical").length,
    high: open.filter((finding) => finding.severity === "high").length,
    medium: open.filter((finding) => finding.severity === "medium").length,
    low: open.filter((finding) => finding.severity === "low").length,
    total: open.length,
  };
}

export function scoreStatus(score: number) {
  if (score >= 100) {
    return { label: "SECURE ✓", tone: "text-accent" as const };
  }
  if (score >= 60) {
    return { label: "NEEDS ATTENTION", tone: "text-medium" as const };
  }
  return { label: "AT RISK", tone: "text-critical" as const };
}
