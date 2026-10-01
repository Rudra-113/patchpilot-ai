export type Severity = "critical" | "high" | "medium" | "low";

export type FindingStatus = "unfixed" | "fix_ready" | "applied" | "verified" | "failed";

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  scanner: string;
  file: string;
  line: number;
  status: FindingStatus;
  description: string;
  whyItMatters: string;
  cwe: string;
}

export interface ScorePoint {
  label: string;
  score: number;
}

export interface ActivityEvent {
  id: string;
  time: string;
  title: string;
  detail: string;
}

export interface ScanRecord {
  id: string;
  repository: string;
  branch: string;
  status: string;
  demo_mode: boolean;
  security_score: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  demo_mode: boolean;
}
