import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ScorePoint } from "../../types/security";

export function ScoreTrend({ data }: { data: ScorePoint[] }) {
  return (
    <div className="h-[168px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E5A0" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#00E5A0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1B2A38" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#61788c"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            fontFamily="IBM Plex Sans"
          />
          <YAxis hide domain={[40, 100]} />
          <Tooltip
            cursor={{ stroke: "#2A4258" }}
            contentStyle={{
              background: "#101923",
              border: "1px solid #1B2A38",
              borderRadius: 12,
              fontSize: 12,
              color: "#E8F1F8",
            }}
            labelStyle={{ color: "#8AA0B5" }}
            formatter={(value) => [`${value ?? 0} / 100`, "Score"]}
          />
          <Area type="monotone" dataKey="score" stroke="#00E5A0" strokeWidth={2} fill="url(#scoreFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
