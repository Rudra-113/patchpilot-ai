import { useMemo, useState } from "react";
import { PageHeader } from "../components/common/PageHeader";
import { FindingRow } from "../components/security/FindingRow";
import { useAppState } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";
const filters = ["All", "Critical", "High", "Medium", "Low", "Resolved", "Unresolved"] as const;

export function VulnerabilitiesPage() {
  usePageTitle("Vulnerabilities");
  const app = useAppState();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return app.findings.filter((finding) => {
      if (filter === "Resolved" && finding.status !== "verified") return false;
      if (filter === "Unresolved" && finding.status === "verified") return false;
      if (["Critical", "High", "Medium", "Low"].includes(filter) && finding.severity !== filter.toLowerCase()) return false;
      if (!needle) return true;
      return [finding.title, finding.file, finding.scanner, finding.cwe, finding.description]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [app.findings, filter, query]);

  return (
    <div>
      <PageHeader
        kicker="Queue"
        title="Vulnerabilities"
        description="Every scanner result is shown in one shape. Open a finding to read the analysis and generate a patch."
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter findings">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
              className={`rounded-full border px-3 py-1.5 text-xs tracking-[0.12em] ${filter === item ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-muted"}`}
              onClick={() => setFilter(item)}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="finding-search">
          Search vulnerabilities
        </label>
        <input
          id="finding-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search vulnerabilities..."
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-cyan lg:max-w-xs"
        />
      </div>
      <div className="panel">
        {app.loading ? <p className="p-6 text-sm text-muted">Loading findings...</p> : null}
        {!app.loading && visible.length === 0 ? (
          <p className="p-6 text-sm text-muted">No findings match this filter.</p>
        ) : null}
        {visible.map((finding) => (
          <FindingRow key={finding.id} finding={finding} href={`/vulnerabilities/${finding.id}`} />
        ))}
      </div>
    </div>
  );
}
