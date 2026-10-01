export type Severity = "critical" | "high" | "medium" | "low";

export type FindingStatus = "unfixed" | "fix_ready" | "applied" | "verified" | "failed";

export type StageStatus = "pending" | "running" | "completed" | "failed";

export interface Analysis {
  summary: string;
  rootCause: string;
  attackVector: string;
  securityImpact: string;
  recommendedRemediation: string;
  source: "demo" | "model";
}

export interface FixProposal {
  summary: string;
  explanation: string;
  before: string;
  after: string;
  file: string;
  source: "demo" | "model";
}

export interface TestResult {
  command: string;
  passed: number;
  failed: number;
  status: "passed" | "failed";
  demoMode: boolean;
  note: string;
}

export interface VerificationChecks {
  securityScan: "passed" | "failed" | "pending";
  tests: "passed" | "failed" | "pending";
  originalVulnerability: "resolved" | "still_present" | "pending";
  regression: "passed" | "failed" | "pending";
}

export interface Verification {
  verified: boolean;
  checks: VerificationChecks;
  summary: string;
  before: string;
  after: string;
  demoMode: boolean;
}

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
  code?: string;
  analysis?: Analysis | null;
  fix?: FixProposal | null;
  testResult?: TestResult | null;
  verification?: Verification | null;
  verifiedAt?: string | null;
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

export interface PipelineStage {
  id: string;
  label: string;
  status: StageStatus;
}

export interface LogLine {
  id: string;
  time: string;
  message: string;
  level: "info" | "good" | "warn" | "bad" | "ai";
}

export interface Scan {
  id: string;
  repository: string;
  branch: string;
  status: "running" | "completed" | "failed";
  demoMode: boolean;
  createdAt: string;
  note: string;
  stages: PipelineStage[];
  logs: LogLine[];
  findings: Finding[];
  activity: ActivityEvent[];
  securityScore: number;
  findingsCount: number;
  fixedCount: number;
}

export interface ScanSummary {
  id: string;
  repository: string;
  branch: string;
  createdAt: string;
  findings: number;
  fixed: number;
  securityScore: number;
  status: string;
  demoMode: boolean;
}

export interface ScannerStatus {
  name: string;
  available: boolean;
}

export interface SettingsStatus {
  demoMode: boolean;
  aiProvider: string;
  aiConfigured: boolean;
  aiModel: string;
  githubConfigured: boolean;
  dockerAvailable: boolean;
  dockerMode: string;
  scanners: ScannerStatus[];
}

export interface HealthResponse {
  status: string;
  service: string;
  demoMode: boolean;
}
