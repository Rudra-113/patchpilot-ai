import { PageHeader } from "../components/common/PageHeader";
import { useAppState } from "../context/AppContext";
import { usePageTitle } from "../hooks/usePageTitle";

function Row({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "muted" }) {
  const color = tone === "good" ? "text-accent" : tone === "warn" ? "text-medium" : "text-muted";
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <span className="text-sm">{label}</span>
      <span className={`text-right text-sm ${color}`}>{value}</span>
    </div>
  );
}

export function SettingsPage() {
  usePageTitle("Settings");
  const app = useAppState();
  const settings = app.settings;

  return (
    <div>
      <PageHeader
        kicker="Configuration"
        title="Settings"
        description="Connection status only. API keys and GitHub tokens stay on the server and are never shown here."
      />
      {!settings ? (
        <div className="panel p-6 text-sm text-muted">
          {app.error ? app.error : "Loading configuration..."}
          <button type="button" className="btn-secondary mt-4" onClick={() => void app.refresh()}>
            Retry
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="panel p-5">
            <h2 className="text-[11px] tracking-[0.18em] text-faint">AI CONFIGURATION</h2>
            <div className="mt-2">
              <Row label="AI provider" value={settings.aiConfigured ? settings.aiProvider : "Not configured"} tone={settings.aiConfigured ? "good" : "warn"} />
              <Row label="Connection" value={settings.aiConfigured ? "Connected" : "Not configured"} tone={settings.aiConfigured ? "good" : "warn"} />
              <Row label="Model" value={settings.aiModel || "Unset"} tone={settings.aiModel ? "muted" : "warn"} />
            </div>
            {settings.demoMode ? <p className="mt-3 text-xs leading-relaxed text-faint">Demo mode uses bundled analysis and patches, even if a provider is connected.</p> : null}
          </section>
          <section className="panel p-5">
            <h2 className="text-[11px] tracking-[0.18em] text-faint">SCANNER STATUS</h2>
            <div className="mt-2">
              {settings.scanners.map((scanner) => (
                <Row key={scanner.name} label={scanner.name} value={scanner.available ? "Available" : "Not installed"} tone={scanner.available ? "good" : "warn"} />
              ))}
            </div>
          </section>
          <section className="panel p-5">
            <h2 className="text-[11px] tracking-[0.18em] text-faint">GITHUB CONFIGURATION</h2>
            <div className="mt-2">
              <Row label="Token" value={settings.githubConfigured ? "Configured" : "Not configured"} tone={settings.githubConfigured ? "good" : "warn"} />
            </div>
          </section>
          <section className="panel p-5">
            <h2 className="text-[11px] tracking-[0.18em] text-faint">DOCKER STATUS</h2>
            <div className="mt-2">
              <Row label="Docker" value={settings.dockerAvailable ? "Available" : "Unavailable"} tone={settings.dockerAvailable ? "good" : "warn"} />
              <Row
                label="Execution"
                value={settings.dockerMode === "docker" ? "Sandbox" : "Development fallback"}
                tone={settings.dockerMode === "docker" ? "good" : "warn"}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-faint">
              {settings.dockerMode === "docker"
                ? "Repository tests run inside Docker with no network."
                : "Docker is unavailable. Live tests would run on the host with a fixed pytest command. Demo mode does not execute repository code."}
            </p>
          </section>
          <section className="panel p-5 lg:col-span-2">
            <h2 className="text-[11px] tracking-[0.18em] text-faint">APPLICATION SETTINGS</h2>
            <div className="mt-2">
              <Row label="Demo mode" value={settings.demoMode ? "On" : "Off"} tone={settings.demoMode ? "warn" : "good"} />
              <Row label="API" value={import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api"} tone="muted" />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
