import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { DemoNotice } from "../components/common/DemoNotice";
import { PageHeader } from "../components/common/PageHeader";
import { useAppState } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";
import type { Finding, VerificationChecks } from "../types/security";
import { cx } from "../utils/cx";

const checkLabels: Array<{ key: keyof VerificationChecks; label: string }> = [
  { key: "securityScan", label: "Security scan" },
  { key: "tests", label: "Tests" },
  { key: "originalVulnerability", label: "Original vulnerability" },
  { key: "regression", label: "Regression check" },
];

function checkText(value: string) {
  if (value === "resolved") return "RESOLVED ✓";
  if (value === "passed") return "PASSED ✓";
  if (value === "still_present") return "STILL PRESENT";
  if (value === "failed") return "FAILED";
  return "PENDING";
}

function timeline(finding: Finding) {
  const verified = Boolean(finding.verification?.verified);
  return [
    { label: "Vulnerability detected", done: true },
    { label: "Patch generated", done: Boolean(finding.fix) },
    { label: "Patch applied", done: finding.status === "applied" || finding.status === "verified" || Boolean(finding.testResult) },
    { label: "Tests passed", done: finding.testResult?.status === "passed" },
    { label: "Security re-scan", done: Boolean(finding.verification) },
    { label: "Vulnerability resolved", done: verified },
  ];
}

export function VerificationPage() {
  usePageTitle("Verification");
  const app = useAppState();
  const verified = [...app.findings]
    .filter((finding) => finding.verification?.verified)
    .sort((a, b) => (b.verifiedAt ?? "").localeCompare(a.verifiedAt ?? ""));
  const failed = app.findings.filter((finding) => finding.verification && !finding.verification.verified);
  const hero = verified[0] ?? failed[0] ?? null;

  return (
    <div>
      <PageHeader
        kicker="Evidence"
        title="Verification"
        description="PATCH VERIFIED is shown only when the security scan completed, tests passed, and the original vulnerability is no longer reported."
      />
      {app.scan?.demoMode ? (
        <DemoNotice>
          {hero?.verification?.verified
            ? "Demo evidence. The bundled rescan no longer contains this finding. pytest was not executed on the host."
            : "Nothing is verified yet. Demo mode will not mark a generated patch as proof."}
        </DemoNotice>
      ) : null}

      {!hero ? <Unverified /> : null}
      {hero?.verification?.verified ? <VerifiedHero finding={hero} /> : null}
      {hero && hero.verification && !hero.verification.verified ? <FailedHero finding={hero} /> : null}

      {verified.length > 1 ? (
        <div className="mt-4 grid gap-3">
          {verified.slice(1).map((finding) => (
            <Link key={finding.id} to={`/vulnerabilities/${finding.id}`} className="panel block px-4 py-3 text-sm">
              {finding.title} · verified
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Unverified() {
  return (
    <section className="panel px-6 py-16 text-center">
      <p className="text-[12px] tracking-[0.22em] text-medium">UNVERIFIED</p>
      <h2 className="mt-3 font-display text-4xl font-semibold">No patch has been proved</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Generate a fix, apply it, pass tests, and rescan. Until those checks exist, this screen stays unverified.
      </p>
      <div className="mx-auto mt-8 grid max-w-lg gap-2 text-left">
        {["Security scan", "Tests", "Original vulnerability", "Regression check"].map((label) => (
          <div key={label} className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm">
            <span>{label}</span>
            <span className="font-mono text-[11px] tracking-[0.14em] text-faint">PENDING</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function VerifiedHero({ finding }: { finding: Finding }) {
  const verification = finding.verification;
  if (!verification) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="verified-glow rounded-[28px] border border-accent/40 px-6 py-12 text-center"
    >
      <ShieldCheck className="mx-auto h-12 w-12 text-accent" />
      <p className="mt-5 font-display text-4xl font-semibold tracking-[0.08em] text-accent sm:text-5xl">PATCH VERIFIED ✓</p>
      <p className="mt-3 text-lg text-ink">Vulnerability resolved</p>
      <p className="mt-2 text-sm text-muted">{finding.title}</p>
      <div className="mx-auto mt-8 grid max-w-xl gap-2 text-left">
        {checkLabels.map((check) => (
          <div key={check.key} className="flex items-center justify-between rounded-xl border border-accent/25 bg-canvas/40 px-4 py-3">
            <span className="text-sm">{check.label}</span>
            <span className="font-mono text-[11px] tracking-[0.14em] text-accent">{checkText(verification.checks[check.key])}</span>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-6 grid max-w-3xl gap-3 text-left md:grid-cols-2">
        <article className="rounded-2xl border border-critical/30 bg-critical/8 p-4">
          <p className="text-[11px] tracking-[0.16em] text-critical">BEFORE</p>
          <p className="mt-2 text-sm text-ink">{verification.before}</p>
        </article>
        <article className="rounded-2xl border border-accent/30 bg-accent/8 p-4">
          <p className="text-[11px] tracking-[0.16em] text-accent">AFTER</p>
          <p className="mt-2 text-sm text-ink">{verification.after}</p>
        </article>
      </div>
      <ol className="mx-auto mt-8 max-w-md space-y-3 text-left">
        {timeline(finding).map((item) => (
          <li key={item.label} className="flex items-center justify-between text-sm">
            <span>{item.label}</span>
            <span className={item.done ? "text-accent" : "text-faint"}>{item.done ? "✓" : "○"}</span>
          </li>
        ))}
        <li className="flex items-center justify-between font-display text-lg text-accent">
          <span>PATCH VERIFIED</span>
          <span>✓</span>
        </li>
      </ol>
      <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted">{verification.summary}</p>
      <Link to={`/vulnerabilities/${finding.id}`} className="btn-secondary mt-6">
        Review finding
      </Link>
    </motion.section>
  );
}

function FailedHero({ finding }: { finding: Finding }) {
  const verification = finding.verification;
  if (!verification) return null;
  return (
    <section className="rounded-[28px] border border-critical/40 bg-critical/8 px-6 py-12 text-center">
      <p className="font-display text-4xl font-semibold text-critical">VERIFICATION FAILED</p>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink">{verification.summary}</p>
      <div className="mx-auto mt-6 grid max-w-xl gap-2 text-left">
        {checkLabels.map((check) => {
          const value = verification.checks[check.key];
          const bad = value === "failed" || value === "still_present";
          return (
            <div key={check.key} className="flex items-center justify-between rounded-xl border border-line bg-canvas/50 px-4 py-3">
              <span className="text-sm">{check.label}</span>
              <span className={cx("font-mono text-[11px] tracking-[0.14em]", bad ? "text-critical" : "text-faint")}>{checkText(value)}</span>
            </div>
          );
        })}
      </div>
      <Link to={`/vulnerabilities/${finding.id}`} className="btn-primary mt-6">
        Review patch
      </Link>
    </section>
  );
}
