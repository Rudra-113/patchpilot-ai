import type { Finding, Severity } from "../types/security";

/** Points removed from 100 for each open finding. Two criticals + the rest of the demo set = 28, so the demo score is 72. */
export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 7,
  high: 3,
  medium: 1,
  low: 1,
};

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function isOpenFinding(finding: Finding) {
  return finding.status !== "verified";
}

/** Open findings first, then severity, so the next thing to prove is at the top. */
export function sortFindings(findings: Finding[]) {
  return [...findings].sort((left, right) => {
    const leftOpen = isOpenFinding(left) ? 0 : 1;
    const rightOpen = isOpenFinding(right) ? 0 : 1;
    if (leftOpen !== rightOpen) return leftOpen - rightOpen;
    const bySeverity = SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity];
    if (bySeverity !== 0) return bySeverity;
    return left.line - right.line;
  });
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
