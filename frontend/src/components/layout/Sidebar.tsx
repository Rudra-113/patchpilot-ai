import {
  Activity,
  History,
  LayoutDashboard,
  Radar,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { cx } from "../../utils/cx";
import { LogoLockup } from "../common/Logo";

type Item = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const groups: Array<{ label: string; items: Item[] }> = [
  {
    label: "Mission",
    items: [
      { to: "/overview", label: "Overview", icon: LayoutDashboard },
      { to: "/scan", label: "Scan Repository", icon: Radar },
    ],
  },
  {
    label: "Evidence",
    items: [
      { to: "/vulnerabilities", label: "Vulnerabilities", icon: ShieldAlert },
      { to: "/fixes", label: "Fixes", icon: Wrench },
      { to: "/verification", label: "Verification", icon: ShieldCheck },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/activity", label: "Agent Activity", icon: Activity },
      { to: "/history", label: "Scan History", icon: History },
    ],
  },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {open ? (
        <button className="fixed inset-0 z-30 bg-black/60 lg:hidden" aria-label="Close navigation" onClick={onClose} />
      ) : null}
      <aside
        id="app-sidebar"
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-line bg-surface transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-line px-5 py-5">
          <NavLink to="/overview" className="inline-flex" onClick={onClose} aria-label="PatchPilot AI overview">
            <LogoLockup />
          </NavLink>
          <p className="mt-3 text-xs leading-5 text-muted">Your autonomous AI security engineer</p>
        </div>

        <nav aria-label="Primary" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-2 text-[10px] font-medium tracking-[0.18em] text-faint uppercase">{group.label}</p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className="nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-elevated/80 hover:text-ink"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-line p-3">
          <NavLink
            to="/settings"
            onClick={onClose}
            className="nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-elevated/80 hover:text-ink"
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </NavLink>
          <div className="rounded-xl border border-line bg-canvas/70 px-3 py-3">
            <p className="text-[10px] tracking-[0.18em] text-faint">SYSTEM STATUS</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-ink">
              <span className="status-dot h-2 w-2 rounded-full bg-accent" />
              All systems operational
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
