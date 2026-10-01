import { useState, type DragEvent, type FormEvent } from "react";
import { ApiFailure } from "../services/api";
import { DemoNotice } from "../components/common/DemoNotice";
import { PageHeader } from "../components/common/PageHeader";
import { Pipeline } from "../components/workflow/Pipeline";
import { Terminal } from "../components/workflow/Terminal";
import { useAppState } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";

const GITHUB_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?\/?$/;

export function ScanPage() {
  usePageTitle("Scan Repository");
  const app = useAppState();
  const [url, setUrl] = useState("https://github.com/patchpilot/patchpilot-demo");
  const [branch, setBranch] = useState("main");
  const [dragOver, setDragOver] = useState(false);
  const [formError, setFormError] = useState("");
  const [formDetail, setFormDetail] = useState("");
  const running = app.pendingScan || app.scan?.status === "running";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!GITHUB_URL.test(url.trim())) {
      setFormError("Enter a GitHub repository URL.");
      setFormDetail("Use https://github.com/owner/repository");
      return;
    }
    setFormError("");
    setFormDetail("");
    try {
      await app.startScan(url.trim(), branch.trim() || "main");
    } catch (error) {
      const failure = error instanceof ApiFailure ? error : new ApiFailure("Unable to start the scan.");
      setFormError(failure.message);
      setFormDetail(failure.detail);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setFormError("Upload a ZIP archive.");
      setFormDetail("The file extension must be .zip.");
      return;
    }
    setFormError("");
    setFormDetail("");
    try {
      await app.uploadZip(file);
    } catch (error) {
      const failure = error instanceof ApiFailure ? error : new ApiFailure("Unable to upload the archive.");
      setFormError(failure.message);
      setFormDetail(failure.detail);
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragOver(false);
    void onFile(event.dataTransfer.files[0]);
  }

  return (
    <div>
      <PageHeader
        kicker="Ingest"
        title="Scan Repository"
        description="Point PatchPilot at a GitHub repository or a ZIP archive. Scanners that are not installed are skipped. Demo mode never fetches or executes the repository."
      />
      {app.scan?.demoMode ? <DemoNotice>{app.scan.note}</DemoNotice> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <form className="panel p-5" onSubmit={(event) => void onSubmit(event)}>
          <label htmlFor="repo-url" className="text-[11px] tracking-[0.18em] text-faint">
            GITHUB URL
          </label>
          <input
            id="repo-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://github.com/user/repository"
            className="mt-2 w-full rounded-xl border border-line bg-canvas px-3 py-3 font-mono text-sm text-ink outline-none focus:border-cyan"
            autoComplete="off"
          />
          <label htmlFor="repo-branch" className="mt-4 block text-[11px] tracking-[0.18em] text-faint">
            BRANCH
          </label>
          <input
            id="repo-branch"
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-canvas px-3 py-3 font-mono text-sm text-ink outline-none focus:border-cyan"
          />
          <button type="submit" className="btn-primary mt-5" disabled={running}>
            {running ? "Scanning repository..." : "Scan repository"}
          </button>
        </form>

        <div
          className={`panel flex min-h-[220px] flex-col items-center justify-center border-dashed p-6 text-center ${dragOver ? "border-accent" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <p className="font-display text-2xl font-semibold">Drop your repository ZIP here</p>
          <p className="mt-2 max-w-sm text-sm text-muted">The archive is stored for a live scan. Demo mode records the upload and does not extract or run it.</p>
          <label className="btn-secondary mt-5 cursor-pointer">
            Choose ZIP
            <input
              type="file"
              accept=".zip,application/zip"
              className="sr-only"
              onChange={(event) => void onFile(event.target.files?.[0])}
            />
          </label>
        </div>
      </div>

      {formError ? (
        <div className="mt-4 rounded-2xl border border-critical/40 bg-critical/8 px-4 py-3" role="alert">
          <p className="text-sm text-critical">{formError}</p>
          {formDetail ? <p className="mt-1 text-sm text-muted">{formDetail}</p> : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Pipeline stages={app.scan?.stages ?? []} />
        <Terminal lines={app.scan?.logs ?? []} live={app.scan?.status === "running"} />
      </div>
    </div>
  );
}
