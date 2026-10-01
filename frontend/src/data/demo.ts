import type { ActivityEvent, Finding, ScorePoint } from "../types/security";

/**
 * Deterministic demo workspace.
 * These records are fixtures for the product walkthrough. They are not the
 * output of a live scanner run.
 */
export const demoRepository = {
  name: "patchpilot-demo",
  branch: "main",
  lastScanLabel: "2 minutes ago",
  source: "Deterministic demo fixtures",
};

export const demoFindings: Finding[] = [
  {
    id: "finding-001",
    severity: "critical",
    title: "SQL Injection",
    scanner: "Semgrep",
    file: "app/database.py",
    line: 42,
    status: "unfixed",
    cwe: "CWE-89",
    description:
      "The application constructs a SQL query by concatenating unsanitized user-controlled input into the statement.",
    whyItMatters:
      "An attacker who controls user_id can change the query that reaches the database, exposing or modifying rows the application never intended to touch.",
  },
  {
    id: "finding-002",
    severity: "critical",
    title: "Hardcoded Secret",
    scanner: "Gitleaks",
    file: "app/config.py",
    line: 18,
    status: "unfixed",
    cwe: "CWE-798",
    description:
      "A cloud API credential is stored directly in source that is part of the repository tree.",
    whyItMatters:
      "Anyone who can read the repository can reuse the credential. Rotating it later does not erase copies already cloned.",
  },
  {
    id: "finding-003",
    severity: "high",
    title: "Command Injection",
    scanner: "Bandit",
    file: "app/archive.py",
    line: 27,
    status: "unfixed",
    cwe: "CWE-78",
    description:
      "A shell command is built from an unsanitized filename and passed to the operating system shell.",
    whyItMatters:
      "Metacharacters in the filename can cause the shell to run additional commands with the application's privileges.",
  },
  {
    id: "finding-004",
    severity: "high",
    title: "Weak Cryptography",
    scanner: "Bandit",
    file: "app/auth/tokens.py",
    line: 15,
    status: "unfixed",
    cwe: "CWE-327",
    description:
      "Password-reset tokens are derived with MD5, which is no longer a collision-resistant hash.",
    whyItMatters:
      "Predictable or colliding tokens can let another person request a reset that was meant for someone else.",
  },
  {
    id: "finding-005",
    severity: "high",
    title: "Vulnerable Dependency",
    scanner: "pip-audit",
    file: "requirements.txt",
    line: 4,
    status: "unfixed",
    cwe: "CWE-1395",
    description:
      "PyYAML 5.3.1 is pinned and is flagged for CVE-2020-14343, an unsafe loader issue in that release line.",
    whyItMatters:
      "Loading untrusted YAML with the vulnerable loader can execute code inside the process that parses the document.",
  },
  {
    id: "finding-006",
    severity: "medium",
    title: "Path Traversal",
    scanner: "Semgrep",
    file: "app/files.py",
    line: 61,
    status: "unfixed",
    cwe: "CWE-22",
    description:
      "A user-supplied path is joined onto the upload directory without checking that the result stays inside that directory.",
    whyItMatters:
      "A path containing parent-directory segments can read files outside the folder the feature is supposed to serve.",
  },
  {
    id: "finding-007",
    severity: "medium",
    title: "Insecure Deserialization",
    scanner: "Bandit",
    file: "app/workers/queue.py",
    line: 44,
    status: "unfixed",
    cwe: "CWE-502",
    description:
      "Worker payloads are restored with pickle from data that did not originate inside this process.",
    whyItMatters:
      "Pickle can invoke code while an object is reconstructed. Untrusted payloads become code execution.",
  },
  {
    id: "finding-008",
    severity: "medium",
    title: "Reflected Cross-Site Scripting",
    scanner: "Semgrep",
    file: "app/views/profile.py",
    line: 33,
    status: "unfixed",
    cwe: "CWE-79",
    description:
      "A query parameter is written into an HTML response without encoding.",
    whyItMatters:
      "A crafted link can run script in the victim's browser session and act with that user's privileges.",
  },
  {
    id: "finding-009",
    severity: "medium",
    title: "Debug Mode Enabled",
    scanner: "Semgrep",
    file: "app/settings.py",
    line: 9,
    status: "unfixed",
    cwe: "CWE-489",
    description:
      "The application configuration enables the interactive debugger in the runtime settings module.",
    whyItMatters:
      "A debugger exposed beyond local development can leak source, environment variables, and request data.",
  },
  {
    id: "finding-010",
    severity: "low",
    title: "Container Runs as Root",
    scanner: "Trivy",
    file: "Dockerfile",
    line: 1,
    status: "unfixed",
    cwe: "CWE-250",
    description:
      "The image does not declare a non-root user, so the process keeps the default root identity.",
    whyItMatters:
      "A compromise inside the container starts with broader filesystem and capability access than the workload needs.",
  },
];

export const demoScoreTrend: ScorePoint[] = [
  { label: "Mon", score: 58 },
  { label: "Tue", score: 61 },
  { label: "Wed", score: 66 },
  { label: "Thu", score: 69 },
  { label: "Fri", score: 72 },
];

export const demoActivity: ActivityEvent[] = [
  {
    id: "act-1",
    time: "10:42:11",
    title: "Repository loaded",
    detail: "patchpilot-demo · main · demo fixture",
  },
  {
    id: "act-2",
    time: "10:42:14",
    title: "Scanner results normalized",
    detail: "Semgrep, Bandit, pip-audit, Gitleaks, Trivy",
  },
  {
    id: "act-3",
    time: "10:42:16",
    title: "10 findings in the demo set",
    detail: "Illustrative records, not a live scan",
  },
  {
    id: "act-4",
    time: "10:42:18",
    title: "Awaiting remediation",
    detail: "No patch has been verified",
  },
];

export const workflowStages = [
  { id: "scan", label: "Scan", detail: "Repository scanners" },
  { id: "understand", label: "Understand", detail: "Root cause and impact" },
  { id: "fix", label: "Fix", detail: "Smallest safe patch" },
  { id: "test", label: "Test", detail: "Pytest on the tree" },
  { id: "verify", label: "Verify", detail: "Rescan for the original finding" },
] as const;
