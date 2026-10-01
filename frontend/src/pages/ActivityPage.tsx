import { useEffect, useState } from "react";
import { ApiFailure, getActivity } from "../services/api";
import { PageHeader } from "../components/common/PageHeader";
import { useAppState } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";
import type { ActivityEvent } from "../types/security";
import { cx } from "../utils/cx";

export function ActivityPage() {
  usePageTitle("Agent Activity");
  const app = useAppState();
  const [events, setEvents] = useState<ActivityEvent[]>(app.scan?.activity ?? []);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!app.scan) return;
    let cancelled = false;
    void getActivity(app.scan.id)
      .then((next) => {
        if (!cancelled) setEvents(next);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        const failure = caught instanceof ApiFailure ? caught : new ApiFailure("Unable to load activity.");
        setError(failure.message);
        setEvents(app.scan?.activity ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [app.scan]);

  return (
    <div>
      <PageHeader
        kicker="Timeline"
        title="Agent Activity"
        description="A timestamped trail of what the security engineer actually did. PATCH VERIFIED appears only after evidence is recorded."
      />
      {error ? <p className="mb-4 text-sm text-critical">{error}</p> : null}
      <ol className="relative space-y-4 border-l border-line pl-6">
        {events.map((event) => {
          const proved = event.title === "PATCH VERIFIED";
          return (
            <li key={event.id} className="relative">
              <span className={cx("absolute top-3 -left-[31px] h-3 w-3 rounded-full", proved ? "bg-accent shadow-[0_0_12px_rgba(0,229,160,0.8)]" : "bg-cyan")} />
              <article className={cx("panel px-4 py-3", proved && "border-accent/40 shadow-[0_0_30px_rgba(0,229,160,0.12)]")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className={cx("text-sm font-medium", proved && "text-accent")}>{event.title}</h2>
                  <time className="font-mono text-xs text-cyan">{event.time}</time>
                </div>
                <p className="mt-1 text-sm text-muted">{event.detail}</p>
              </article>
            </li>
          );
        })}
      </ol>
      {events.length === 0 ? <p className="text-sm text-muted">No agent events yet.</p> : null}
    </div>
  );
}
