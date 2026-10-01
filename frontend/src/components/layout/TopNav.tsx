import { Menu } from "lucide-react";
import { useAppState } from "../../context/AppContext";
import { scoreFromFindings } from "../../utils/score";
import { SecurityScore } from "../common/SecurityScore";

export function TopNav({ onMenu }: { onMenu: () => void }) {
  const app = useAppState();
  const score = app.scan ? scoreFromFindings(app.findings) : null;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink lg:hidden"
          onClick={onMenu}
          aria-label="Open navigation"
          aria-controls="app-sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.18em] text-faint">PROJECT STATUS</p>
          <p className="truncate text-sm text-ink">
            <span className="font-medium">{app.repository}</span>
            <span className="text-faint"> · </span>
            <span className="font-mono text-xs text-cyan">{app.branch}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <p className="hidden text-right text-xs text-muted md:block">
          Last scan
          <span className="mt-0.5 block text-sm text-ink">{app.lastScanLabel}</span>
        </p>
        <span className="hidden rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-accent sm:inline-flex">
          DEMO MODE
        </span>
        {score === null ? <span className="text-xs text-muted">Loading score</span> : <SecurityScore score={score} layout="inline" />}
      </div>
    </header>
  );
}
