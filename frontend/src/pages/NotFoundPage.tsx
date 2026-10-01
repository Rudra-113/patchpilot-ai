import { Link } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

export function NotFoundPage() {
  usePageTitle("Not found");

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 text-ink">
      <div className="panel max-w-lg p-8">
        <p className="text-[11px] tracking-[0.2em] text-cyan">404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">That route is not on the map.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The console and the landing page are the two places this build knows how to open.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/" className="btn-secondary">
            Landing
          </Link>
          <Link to="/overview" className="btn-primary">
            Command center
          </Link>
        </div>
      </div>
    </div>
  );
}
