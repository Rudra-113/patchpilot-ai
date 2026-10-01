import { useState } from "react";
import { cx } from "../../utils/cx";

const KEYWORDS = new Set(["def", "return", "import", "from", "if", "else", "True", "False", "None", "and", "or", "not", "in", "as", "with"]);

function Highlight({ text }: { text: string }) {
  const tokens = text.split(/("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\b(?:def|return|import|from|if|else|True|False|None|and|or|not|in|as|with)\b)/g);
  return tokens.map((token, index) => {
    if (!token) return null;
    if (token.startsWith('"') || token.startsWith("'")) {
      return (
        <span key={index} className="text-cyan">
          {token}
        </span>
      );
    }
    if (KEYWORDS.has(token)) {
      return (
        <span key={index} className="text-accent">
          {token}
        </span>
      );
    }
    return <span key={index}>{token}</span>;
  });
}

function Pane({
  title,
  text,
  tone,
  marker,
}: {
  title: string;
  text: string;
  tone: "before" | "after";
  marker: string;
}) {
  const lines = text.split("\n");
  return (
    <div className="min-w-0">
      <p className={cx("text-[11px] tracking-[0.18em]", tone === "before" ? "text-critical" : "text-accent")}>{title}</p>
      <pre
        className={cx(
          "mt-2 overflow-x-auto rounded-xl border p-3 font-mono text-[12.5px] leading-6",
          tone === "before" ? "border-critical/30 bg-critical/8" : "border-accent/30 bg-accent/8",
        )}
      >
        {lines.map((line, index) => (
          <div key={`${title}-${index}`} className="flex gap-3">
            <span className="w-6 shrink-0 text-right text-faint">{index + 1}</span>
            <span className={tone === "before" ? "text-critical" : "text-accent"}>{marker}</span>
            <span className="text-ink">
              <Highlight text={line || " "} />
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export function CodeDiff({
  file,
  before,
  after,
}: {
  file: string;
  before: string;
  after?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyText = after ?? before;

  async function copy() {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-muted">{file}</p>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary min-h-9 px-3 text-[11px]" onClick={() => void copy()}>
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" className="btn-secondary min-h-9 px-3 text-[11px]" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            Open file
          </button>
        </div>
      </div>
      {open ? (
        <p className="mb-3 rounded-xl border border-line bg-canvas/70 px-3 py-2 text-xs leading-relaxed text-muted">
          Workspace path <span className="font-mono text-ink">{file}</span>. Demo mode does not open a host editor. The snippet below is the file region the scanner cited.
        </p>
      ) : null}
      {after ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Pane title="BEFORE" text={before} tone="before" marker="−" />
          <Pane title="AFTER" text={after} tone="after" marker="+" />
        </div>
      ) : (
        <Pane title="AFFECTED CODE" text={before} tone="before" marker=" " />
      )}
    </div>
  );
}
