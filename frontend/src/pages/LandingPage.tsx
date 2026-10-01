import { ArrowRight, Play, ScanSearch, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { LogoLockup } from "../components/common/Logo";
import { SeverityBadge } from "../components/common/SeverityBadge";
import { MissionConsole } from "../components/workflow/MissionConsole";
import { demoFindings, workflowStages } from "../data/demo";
import { usePageTitle } from "../hooks/usePageTitle";

const samples = [demoFindings[0], demoFindings[2], demoFindings[1]];

const contrast = [
  {
    icon: ScanSearch,
    kicker: "Scanners",
    title: "Find problems",
    body: "Semgrep, Bandit, pip-audit, Gitleaks, and Trivy detect the issues. The model does not invent scanner evidence.",
  },
  {
    icon: Sparkles,
    kicker: "AI engineer",
    title: "Understand and fix",
    body: "The agent explains root cause, attack path, and impact, then drafts the smallest patch that preserves behavior.",
  },
  {
    icon: ShieldCheck,
    kicker: "Proof",
    title: "Test and prove",
    body: "Tests run, the scanner runs again, and PATCH VERIFIED appears only when the original finding is gone.",
  },
];

export function LandingPage() {
  usePageTitle("PatchPilot AI");

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas text-ink">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-8%] h-[460px] w-[460px] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-[-10%] top-[6%] h-[420px] w-[420px] rounded-full bg-cyan/10 blur-3xl" />
        <div className="grid-fade absolute inset-0" />
      </div>

      <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6">
          <LogoLockup />
          <nav aria-label="Page" className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a href="#workflow" className="hover:text-ink">
              Workflow
            </a>
            <a href="#evidence" className="hover:text-ink">
              Evidence
            </a>
            <a href="#proof" className="hover:text-ink">
              Proof
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/overview" className="btn-secondary hidden sm:inline-flex">
              Open console
            </Link>
            <Link to="/scan" className="btn-primary">
              Scan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="relative mx-auto w-full max-w-[1180px] px-4 pb-20 sm:px-6">
        <section className="grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:py-20">
          <div>
            <p className="text-[11px] font-medium tracking-[0.24em] text-cyan">AUTONOMOUS SECURITY ENGINEER</p>
            <h1 className="mt-4 font-display text-5xl font-semibold tracking-[-0.045em] text-ink sm:text-6xl lg:text-7xl">
              PATCHPILOT <span className="text-cyan">AI</span>
            </h1>
            <p className="mt-4 max-w-xl font-display text-2xl font-medium tracking-tight text-ink/90 sm:text-[28px]">
              Your Autonomous AI Security Engineer
            </p>
            <blockquote className="mt-6 max-w-xl border-l-2 border-accent pl-4 text-lg leading-relaxed text-muted">
              Security vulnerabilities don&apos;t need another dashboard.
              <span className="text-ink"> They need an engineer.</span>
            </blockquote>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/scan" className="btn-primary">
                Scan a repository
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/overview" className="btn-secondary">
                <Play className="h-4 w-4" />
                View demo
              </Link>
            </div>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">
              Detect. Understand. Fix. Test. Prove. Real scanners find the issue. The agent explains it, patches it,
              and will not call the work verified until a rescan says the original finding is gone.
            </p>
          </div>
          <MissionConsole />
        </section>

        <section id="workflow" className="scroll-mt-24">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium tracking-[0.22em] text-cyan">WORKFLOW</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Five stages. One proof.</h2>
            </div>
          </div>
          <ol className="grid gap-3 md:grid-cols-5">
            {workflowStages.map((stage, index) => (
              <li key={stage.id} className="panel relative px-4 py-4">
                <p className="font-mono text-[11px] text-cyan">0{index + 1}</p>
                <h3 className="mt-3 font-display text-lg font-semibold tracking-[0.08em] uppercase">{stage.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{stage.detail}</p>
                {index < workflowStages.length - 1 ? (
                  <span className="absolute top-1/2 -right-2 hidden h-px w-4 bg-line-strong md:block" aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section id="evidence" className="scroll-mt-24 pt-16">
          <div className="mb-5">
            <p className="text-[11px] font-medium tracking-[0.22em] text-cyan">SAMPLE FINDINGS</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">What the queue looks like</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Illustrative cards from the demo repository. These are fixtures, not the result of a scan you just ran.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {samples.map((finding) => (
              <article key={finding.id} className="panel panel-hover p-5">
                <div className="flex items-center justify-between gap-3">
                  <SeverityBadge severity={finding.severity} />
                  <span className="text-[10px] font-semibold tracking-[0.16em] text-cyan">AI FIX READY</span>
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">{finding.title}</h3>
                <p className="mt-3 font-mono text-xs text-muted">
                  {finding.file}:{finding.line}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-3 text-xs text-faint">
                  <span>{finding.scanner}</span>
                  <span className="font-mono">{finding.cwe}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="proof" className="scroll-mt-24 pt-16">
          <div className="mb-5">
            <p className="text-[11px] font-medium tracking-[0.22em] text-cyan">THE DIFFERENCE</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">Find. Understand. Fix. Test. Prove.</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {contrast.map((item) => (
              <article key={item.title} className="panel p-5">
                <item.icon className="h-5 w-5 text-accent" />
                <p className="mt-4 text-[11px] tracking-[0.18em] text-faint uppercase">{item.kicker}</p>
                <h3 className="mt-2 font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="panel mt-4 grid gap-4 p-5 lg:grid-cols-2">
            <div>
              <p className="text-[11px] tracking-[0.18em] text-critical">BEFORE</p>
              <p className="mt-2 text-sm text-muted">SQL Injection detected · Semgrep · app/database.py:42</p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-critical/25 bg-critical/8 p-4 font-mono text-[12.5px] leading-6 text-ink">
                <div>
                  <span className="mr-3 text-critical">−</span>
                  query = &quot;SELECT * FROM users WHERE id=&quot; + user_id
                </div>
                <div>
                  <span className="mr-3 text-critical">−</span>
                  cursor.execute(query)
                </div>
              </pre>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.18em] text-accent">AFTER</p>
              <p className="mt-2 text-sm text-muted">Illustrative remediation. Verification still requires a rescan.</p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-accent/25 bg-accent/8 p-4 font-mono text-[12.5px] leading-6 text-ink">
                <div>
                  <span className="mr-3 text-accent">+</span>
                  query = &quot;SELECT * FROM users WHERE id = ?&quot;
                </div>
                <div>
                  <span className="mr-3 text-accent">+</span>
                  cursor.execute(query, (user_id,))
                </div>
              </pre>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-line">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <p>PatchPilot AI · Detect. Understand. Fix. Test. Prove.</p>
          <p>Demo mode uses deterministic fixtures.</p>
        </div>
      </footer>
    </div>
  );
}
