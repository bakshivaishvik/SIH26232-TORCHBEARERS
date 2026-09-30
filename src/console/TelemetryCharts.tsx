import {
  Activity,
  CircleDot,
  Package,
  Thermometer,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { telemetry, type Batch } from "@/lib/trace-data";

const chartTooltip = {
  contentStyle: {
    backgroundColor: "#1e1e24",
    border: "1px solid #374151",
    borderRadius: 10,
    fontSize: 12,
    fontFamily: "var(--font-mono)",
  },
  labelStyle: { color: "#9ca3af" },
  itemStyle: { color: "#f3f4f6" },
  cursor: { stroke: "#374151" },
} as const;

/** The four edge-node time-series charts (temperature, humidity, shock, doors). */
export default function TelemetryCharts({ batch }: { batch: Batch }) {
  const series = telemetry[batch.id] ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Temperature */}
      <div className="rounded-lg border border-tg-line/50 bg-tg-bg/60 p-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-medium text-tg-muted">
            <Thermometer className="size-3.5 text-tg-green" /> Temperature
          </p>
          <p
            className={cn(
              "font-tech text-sm",
              batch.temp > 5 && batch.status !== "staged" ? "text-tg-red" : "text-tg-green",
            )}
          >
            {batch.temp.toFixed(1)}°C
          </p>
        </div>
        <p className="mb-2 text-[11px] text-tg-muted">
          Setpoint 4.0°C · excursion threshold 5.0°C
        </p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#37415155" vertical={false} />
              <XAxis dataKey="t" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[2.5, 9]} tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip {...chartTooltip} />
              <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.6} />
              <Area type="monotone" dataKey="temp" stroke="#10b981" strokeWidth={2} fill="url(#tempFill)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Humidity */}
      <div className="rounded-lg border border-tg-line/50 bg-tg-bg/60 p-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-medium text-tg-muted">
            <CircleDot className="size-3.5 text-sky-400" /> Humidity
          </p>
          <p className="font-tech text-sm text-sky-400">{batch.humidity}%</p>
        </div>
        <p className="mb-2 text-[11px] text-tg-muted">Target band 55–70% RH</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="humFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#37415155" vertical={false} />
              <XAxis dataKey="t" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[35, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip {...chartTooltip} />
              <Area type="monotone" dataKey="humidity" stroke="#60a5fa" strokeWidth={2} fill="url(#humFill)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shock */}
      <div className="rounded-lg border border-tg-line/50 bg-tg-bg/60 p-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-medium text-tg-muted">
            <Activity className="size-3.5 text-tg-amber" /> Shock / tilt (g)
          </p>
          <p className="font-tech text-sm text-tg-amber">{batch.shock.toFixed(1)}g</p>
        </div>
        <p className="mb-2 text-[11px] text-tg-muted">Impact threshold 2.5g</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="#37415155" vertical={false} />
              <XAxis dataKey="t" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip {...chartTooltip} />
              <ReferenceLine y={2.5} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Bar dataKey="shock" fill="#f59e0b" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Doors */}
      <div className="rounded-lg border border-tg-line/50 bg-tg-bg/60 p-3">
        <div className="mb-1 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-medium text-tg-muted">
            <Package className="size-3.5 text-tg-muted" /> Door openings / 2h
          </p>
          <p className="font-tech text-sm text-foreground">{batch.doors}</p>
        </div>
        <p className="mb-2 text-[11px] text-tg-muted">Every opening is signed on-device</p>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="#37415155" vertical={false} />
              <XAxis dataKey="t" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip {...chartTooltip} />
              <Bar dataKey="doors" fill="#9ca3af" radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
