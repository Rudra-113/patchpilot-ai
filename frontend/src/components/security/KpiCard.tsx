import { useCountUp } from "../../hooks/useCountUp";

export function KpiCard({
  label,
  value,
  tone,
  caption,
}: {
  label: string;
  value: number;
  tone: string;
  caption: string;
}) {
  const shown = useCountUp(value);

  return (
    <article className="panel panel-hover relative overflow-hidden px-4 py-4 pl-5">
      <span className="absolute inset-y-3 left-0 w-[2px] rounded-full" style={{ background: tone }} />
      <p className="text-[11px] font-medium tracking-[0.18em] text-faint">{label}</p>
      <p className="mt-2 font-display text-4xl font-semibold tracking-tight" style={{ color: tone }}>
        {shown}
      </p>
      <p className="mt-1 text-xs text-muted">{caption}</p>
    </article>
  );
}
