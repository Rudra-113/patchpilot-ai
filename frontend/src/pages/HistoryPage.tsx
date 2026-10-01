import { Link } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { useAppState } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { scanDate } from "../utils/format";

export function HistoryPage() {
  usePageTitle("Scan History");
  const app = useAppState();

  return (
    <div>
      <PageHeader
        kicker="Records"
        title="Scan History"
        description="Each row is a scan workspace. Opening one shows the findings, score, and status recorded for that run."
      />
      <div className="panel hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-[11px] tracking-[0.16em] text-faint">
            <tr>
              {["Repository", "Branch", "Date", "Findings", "Fixed", "Security score", "Status"].map((heading) => (
                <th key={heading} className="px-4 py-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {app.history.map((scan) => (
              <tr key={scan.id} className="border-b border-line/80 last:border-b-0">
                <td className="px-4 py-3">
                  <Link to={`/history/${scan.id}`} className="font-medium text-ink hover:text-cyan">
                    {scan.repository}
                  </Link>
                  {scan.demoMode ? <span className="ml-2 text-[10px] tracking-[0.14em] text-accent">DEMO</span> : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-cyan">{scan.branch}</td>
                <td className="px-4 py-3">{scanDate(scan.createdAt)}</td>
                <td className="px-4 py-3">{scan.findings}</td>
                <td className="px-4 py-3">{scan.fixed}</td>
                <td className="px-4 py-3">{scan.securityScore}</td>
                <td className="px-4 py-3 capitalize">{scan.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:hidden">
        {app.history.map((scan) => (
          <Link key={scan.id} to={`/history/${scan.id}`} className="panel block p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{scan.repository}</p>
              <p className="text-sm text-accent">{scan.securityScore}</p>
            </div>
            <p className="mt-2 font-mono text-xs text-cyan">{scan.branch}</p>
            <p className="mt-2 text-xs text-muted">
              {scanDate(scan.createdAt)} · {scan.findings} findings · {scan.fixed} fixed · {scan.status}
            </p>
          </Link>
        ))}
      </div>
      {app.history.length === 0 ? <p className="mt-4 text-sm text-muted">No scans yet.</p> : null}
    </div>
  );
}
