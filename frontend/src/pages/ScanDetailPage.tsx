import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ApiFailure, getScan } from "../services/api";
import { PageHeader } from "../components/common/PageHeader";
import { SecurityScore } from "../components/common/SecurityScore";
import { FindingRow } from "../components/security/FindingRow";
import { useAppState } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";
import type { Scan } from "../types/security";
import { scanDate } from "../utils/format";

export function ScanDetailPage() {
  const { scanId = "" } = useParams();
  const app = useAppState();
  const [scan, setScan] = useState<Scan | null>(null);
  const [error, setError] = useState("");
  usePageTitle(scan?.repository ?? "Scan");

  useEffect(() => {
    let cancelled = false;
    void getScan(scanId)
      .then((next) => {
        if (!cancelled) setScan(next);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        const failure = caught instanceof ApiFailure ? caught : new ApiFailure("Scan not found.");
        setError(failure.message);
      });
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  if (error) {
    return (
      <div className="panel p-8" role="alert">
        <h1 className="font-display text-3xl font-semibold">{error}</h1>
        <Link to="/history" className="btn-secondary mt-5">
          Back to history
        </Link>
      </div>
    );
  }

  if (!scan) {
    return <div className="panel p-8 text-sm text-muted">Loading scan...</div>;
  }

  const active = app.scan?.id === scan.id;

  return (
    <div>
      <PageHeader
        kicker="Scan record"
        title={scan.repository}
        description={scan.note}
        action={<SecurityScore score={scan.securityScore} layout="inline" />}
      />
      <dl className="mb-4 grid gap-3 sm:grid-cols-4">
        {[
          ["Branch", scan.branch],
          ["Date", scanDate(scan.createdAt)],
          ["Findings", String(scan.findingsCount)],
          ["Fixed", String(scan.fixedCount)],
        ].map(([label, value]) => (
          <div key={label} className="panel px-4 py-3">
            <dt className="text-[10px] tracking-[0.16em] text-faint">{label.toUpperCase()}</dt>
            <dd className="mt-1 text-sm text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="panel">
        {scan.findings.map((finding) => (
          <FindingRow key={finding.id} finding={finding} href={active ? `/vulnerabilities/${finding.id}` : undefined} />
        ))}
      </div>
    </div>
  );
}
