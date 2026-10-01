import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <p className="text-[11px] font-medium tracking-[0.22em] text-cyan uppercase">{kicker}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink sm:text-[34px]">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
