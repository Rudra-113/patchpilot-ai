import { useEffect, useId, useState } from "react";
import { useCountUp } from "../../hooks/useCountUp";
import { scoreStatus } from "../../utils/score";
import { cx } from "../../utils/cx";

function Ring({
  score,
  size,
  stroke,
}: {
  score: number;
  size: number;
  stroke: number;
}) {
  const rawId = useId().replace(/:/g, "");
  const gradientId = `score-${rawId}`;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const progress = ready ? score : 0;
  const offset = circumference - (progress / 100) * circumference;
  const start = score >= 100 ? "#00E5A0" : score >= 60 ? "#FFC857" : "#FF4D67";

  return (
    <svg width={size} height={size} className="score-glow" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={start} />
          <stop offset="100%" stopColor="#00E5A0" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#1B2A38"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-1000 ease-out"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export function SecurityScore({
  score,
  layout = "stack",
}: {
  score: number;
  layout?: "stack" | "inline";
}) {
  const shown = useCountUp(score);
  const status = scoreStatus(score);
  const label = `Security score ${score} out of 100. ${status.label}`;

  if (layout === "inline") {
    return (
      <div className="flex items-center gap-3" role="img" aria-label={label}>
        <Ring score={score} size={46} stroke={4} />
        <div>
          <div className="font-display text-lg font-semibold leading-none tracking-tight">{shown}</div>
          <div className={cx("mt-1 text-[10px] font-medium tracking-[0.14em]", status.tone)}>{status.label}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center" role="img" aria-label={label}>
      <div className="relative">
        <Ring score={score} size={148} stroke={8} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[40px] font-semibold leading-none tracking-tight">{shown}</span>
          <span className="mt-1 text-[11px] tracking-[0.16em] text-faint">/ 100</span>
        </div>
      </div>
      <p className={cx("mt-3 text-xs font-semibold tracking-[0.18em]", status.tone)}>{status.label}</p>
    </div>
  );
}
