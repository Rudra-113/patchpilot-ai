import { useEffect, useRef } from "react";
import type { LogLine } from "../../types/security";

const tones: Record<LogLine["level"], string> = {
  info: "text-muted",
  good: "text-accent",
  warn: "text-medium",
  bad: "text-critical",
  ai: "text-cyan",
};

export function Terminal({ lines, live }: { lines: LogLine[]; live?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [lines.length, live]);

  return (
    <section className="panel overflow-hidden" aria-live="polite">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-[11px] tracking-[0.18em] text-faint">AGENT TERMINAL</p>
        <p className="font-mono text-[10px] tracking-[0.14em] text-cyan">{live ? "LIVE" : "LATEST RUN"}</p>
      </div>
      <div ref={ref} className="h-[420px] overflow-y-auto bg-[#070b10] px-4 py-4 font-mono text-[12.5px] leading-6">
        {lines.length === 0 ? <p className="text-faint">The agent log will appear when a scan starts.</p> : null}
        {lines.map((line, index) => (
          <p key={line.id} className={tones[line.level]}>
            <span className="text-faint">[{line.time}]</span> {line.message}
            {live && index === lines.length - 1 ? <span className="caret" /> : null}
          </p>
        ))}
      </div>
    </section>
  );
}
