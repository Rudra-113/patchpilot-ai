export function DemoNotice({ children }: { children: string }) {
  return (
    <p className="mb-5 rounded-2xl border border-accent/30 bg-accent/8 px-4 py-3 text-sm leading-relaxed text-ink">
      <span className="mr-2 align-middle text-[10px] font-semibold tracking-[0.16em] text-accent">DEMO MODE</span>
      {children}
    </p>
  );
}
