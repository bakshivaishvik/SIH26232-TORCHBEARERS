import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDot,
  Link2,
  Package,
  RadioTower,
  ShieldCheck,
  Thermometer,
  Truck,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  alerts,
  batches,
  ledgerFeed,
  shipments,
  statusLabel,
  telemetry,
  type Batch,
  type Shipment,
} from "@/lib/trace-data";

const statusStyles: Record<Shipment["status"], string> = {
  nominal: "text-tg-green border-tg-green/30 bg-tg-green/10",
  warning: "text-tg-amber border-tg-amber/30 bg-tg-amber/10",
  critical: "text-tg-red border-tg-red/30 bg-tg-red/10",
  buffering: "text-tg-amber border-tg-amber/40 bg-tg-amber/10",
};

const batchStyles: Record<Batch["status"], string> = {
  "in-transit": "text-tg-green border-tg-green/30 bg-tg-green/10",
  "at-risk": "text-tg-red border-tg-red/30 bg-tg-red/10",
  delivered: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  staged: "text-tg-muted border-tg-line bg-tg-panel-2",
};

const txStyles: Record<string, string> = {
  "telemetry-anchor": "text-tg-green border-tg-green/25 bg-tg-green/10",
  "custody-transfer": "text-sky-400 border-sky-400/25 bg-sky-400/10",
  "qa-certification": "text-tg-amber border-tg-amber/25 bg-tg-amber/10",
  "node-register": "text-tg-muted border-tg-line bg-tg-panel-2",
};

// Quadratic bezier helpers for map arcs (all coords in % of the map box)
function ctrlPoint(a: Shipment["from"], b: Shipment["to"]) {
  return {
    x: (a.x + b.x) / 2 - (b.y - a.y) * 0.22,
    y: (a.y + b.y) / 2 + (b.x - a.x) * 0.22,
  };
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function qAt(a: Shipment["from"], c: { x: number; y: number }, b: Shipment["to"], t: number) {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}

function MapMarker({
  x,
  y,
  color,
  pulse,
  label,
  onClick,
  active,
}: {
  x: number;
  y: number;
  color: string;
  pulse?: boolean;
  label?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group absolute -translate-x-1/2 -translate-y-1/2 outline-none"
      style={{ left: `${x}%`, top: `${y}%`, zIndex: active ? 20 : 10 }}
      aria-label={label}
    >
      {pulse && (
        <span
          className="tg-pulse-ring absolute inset-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      <span
        className={cn(
          "block size-2.5 rounded-full ring-2 ring-tg-bg transition-transform group-hover:scale-125",
          active && "scale-125",
        )}
        style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}66` }}
      />
      {label && (
        <span
          className={cn(
            "font-tech pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded border border-tg-line bg-tg-bg/90 px-1.5 py-0.5 text-[9px] tracking-wide transition-opacity",
            active ? "text-foreground opacity-100" : "text-tg-muted opacity-0 group-hover:opacity-100",
          )}
        >
          {label}
        </span>
      )}
    </button>
  );
}

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

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "green",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone?: "green" | "amber" | "blue";
}) {
  const tones = {
    green: "text-tg-green bg-tg-green/10",
    amber: "text-tg-amber bg-tg-amber/10",
    blue: "text-sky-400 bg-sky-400/10",
  } as const;
  return (
    <Card className="gap-3 rounded-xl border-tg-line/60 bg-tg-panel py-4">
      <CardContent className="flex items-center gap-3 px-4">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] uppercase tracking-wider text-tg-muted">{label}</p>
          <p className="font-tech truncate text-lg font-semibold leading-tight text-foreground">
            {value}
          </p>
          <p className="truncate text-[11px] text-tg-muted">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminView() {
  const [selectedBatchId, setSelectedBatchId] = useState("TG-8492");
  const [focusedShipment, setFocusedShipment] = useState<string | null>("SHP-2231");

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) ?? batches[0];
  const series = telemetry[selectedBatch.id] ?? [];

  const activeShipments = shipments.length;
  const buffering = shipments.filter((s) => s.status === "buffering").length;
  const risk = batches.filter((b) => b.status === "at-risk").length;
  const nodes = { online: 342, total: 348 };

  return (
    <div className="flex flex-col gap-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={Truck}
          label="Active shipments"
          value={String(activeShipments)}
          sub="2 flagged for review"
          tone="green"
        />
        <StatCard
          icon={Boxes}
          label="Batches monitored"
          value={String(batches.length)}
          sub={`${risk} at risk · 0 sealed tamper`}
          tone={risk > 0 ? "amber" : "green"}
        />
        <StatCard
          icon={RadioTower}
          label="Edge nodes online"
          value={`${nodes.online}/${nodes.total}`}
          sub={`${buffering} buffering · 41ms median RTT`}
          tone="blue"
        />
        <StatCard
          icon={Link2}
          label="Geth PoA chain"
          value={`#${selectedBatch.block.toLocaleString()}`}
          sub="~2s finality · 0 gas fees"
          tone="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Map + telemetry */}
        <div className="flex flex-col gap-5 xl:col-span-2">
          {/* Network map */}
          <Card className="overflow-hidden border-tg-line/60 bg-tg-panel py-0">
            <CardHeader className="flex-row items-center justify-between border-b border-tg-line/50 py-4">
              <div className="flex items-center gap-2">
                <CircleDot className="size-4 text-tg-green" />
                <CardTitle className="text-sm">Global shipment network</CardTitle>
                <Badge variant="outline" className="border-tg-line/60 text-[10px] text-tg-muted">
                  LIVE
                </Badge>
              </div>
              <div className="hidden items-center gap-3 text-[10px] uppercase tracking-wider text-tg-muted sm:flex">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-tg-green" /> Nominal</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-tg-amber" /> Alert</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-tg-red" /> Critical</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-dashed border-tg-amber bg-tg-amber/30" /> Buffering</span>
              </div>
            </CardHeader>
            <CardContent className="relative px-0 py-0">
              <div className="tg-grid-bg relative aspect-[16/9] w-full overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,#1c2230_0%,#161619_65%)]">
                {/* abstract landmasses */}
                <div className="absolute left-[8%] top-[18%] h-[34%] w-[20%] rounded-[45%] bg-tg-panel-2/50 blur-[2px]" />
                <div className="absolute left-[16%] top-[55%] h-[30%] w-[12%] rounded-[50%] bg-tg-panel-2/40 blur-[2px]" />
                <div className="absolute left-[42%] top-[16%] h-[38%] w-[14%] rounded-[40%] bg-tg-panel-2/50 blur-[2px]" />
                <div className="absolute left-[58%] top-[50%] h-[26%] w-[9%] rounded-[50%] bg-tg-panel-2/40 blur-[2px]" />
                <div className="absolute left-[72%] top-[10%] h-[46%] w-[11%] rounded-[35%] bg-tg-panel-2/50 blur-[2px]" />
                <div className="absolute left-[78%] top-[72%] h-[18%] w-[8%] rounded-[45%] bg-tg-panel-2/40 blur-[2px]" />

                {/* shipment arcs */}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {shipments.map((s) => {
                    const c = ctrlPoint(s.from, s.to);
                    const color =
                      s.status === "nominal"
                        ? "#10b981"
                        : s.status === "warning"
                          ? "#f59e0b"
                          : s.status === "critical"
                            ? "#ef4444"
                            : "#f59e0b";
                    const head = qAt(s.from, c, s.to, s.progress / 100);
                    const focused = focusedShipment === s.id;
                    return (
                      <g key={s.id}>
                        {/* traveled */}
                        <path
                          d={`M ${s.from.x} ${s.from.y} Q ${lerp(s.from.x, c.x, s.progress / 100)} ${lerp(s.from.y, c.y, s.progress / 100)} ${head.x} ${head.y}`}
                          fill="none"
                          stroke={color}
                          strokeWidth={focused ? 0.55 : 0.35}
                          opacity={focused ? 0.95 : 0.55}
                          vectorEffect="non-scaling-stroke"
                        />
                        {/* remaining */}
                        <path
                          d={`M ${head.x} ${head.y} Q ${lerp(c.x, s.to.x, s.progress / 100)} ${lerp(c.y, s.to.y, s.progress / 100)} ${s.to.x} ${s.to.y}`}
                          fill="none"
                          stroke={color}
                          strokeWidth={0.3}
                          strokeDasharray="2 1.6"
                          opacity={0.3}
                          vectorEffect="non-scaling-stroke"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* endpoints + heads */}
                {shipments.map((s) => {
                  const c = ctrlPoint(s.from, s.to);
                  const head = qAt(s.from, c, s.to, s.progress / 100);
                  const color =
                    s.status === "nominal"
                      ? "#10b981"
                      : s.status === "warning"
                        ? "#f59e0b"
                        : s.status === "critical"
                          ? "#ef4444"
                          : "#f59e0b";
                  const focused = focusedShipment === s.id;
                  return (
                    <div key={s.id}>
                      <MapMarker x={s.from.x} y={s.from.y} color="#9ca3af" label={s.from.label} />
                      <MapMarker x={s.to.x} y={s.to.y} color="#6b7280" label={s.to.label} />
                      <MapMarker
                        x={head.x}
                        y={head.y}
                        color={color}
                        pulse={s.status === "warning" || s.status === "critical" || focused}
                        active={focused}
                        label={`${s.batch} · ${s.temp.toFixed(1)}°C`}
                        onClick={() => {
                          setFocusedShipment(s.id);
                          setSelectedBatchId(s.batch);
                        }}
                      />
                    </div>
                  );
                })}

                {/* focused shipment readout */}
                {focusedShipment &&
                  (() => {
                    const s = shipments.find((x) => x.id === focusedShipment);
                    if (!s) return null;
                    return (
                      <div className="absolute left-3 bottom-3 rounded-lg border border-tg-line/70 bg-tg-bg/85 px-3 py-2 backdrop-blur-sm">
                        <p className="font-tech text-[11px] text-foreground">
                          {s.id} · {s.batch}
                        </p>
                        <p className="text-[11px] text-tg-muted">
                          {s.truck} · {s.driver} · ETA {s.eta}
                        </p>
                        <p className="font-tech mt-1 text-[11px] text-tg-green">
                          {s.temp.toFixed(1)}°C · {s.progress}% route · anchored on-chain
                        </p>
                      </div>
                    );
                  })()}

                <div className="absolute right-3 bottom-3 rounded border border-tg-line/60 bg-tg-bg/85 px-2 py-1 font-tech text-[10px] text-tg-muted backdrop-blur-sm">
                  342 edge nodes · 348 registered
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Telemetry */}
          <Card className="border-tg-line/60 bg-tg-panel">
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-tg-green" />
                <CardTitle className="text-sm">Edge node telemetry</CardTitle>
              </div>
              <Select value={selectedBatchId} onValueChange={(v) => setSelectedBatchId(v)}>
                <SelectTrigger size="sm" className="w-[240px] border-tg-line/60 bg-tg-panel-2 font-tech text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-tg-line bg-tg-panel">
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="font-tech text-xs">
                      {b.id} — {b.product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Temperature */}
                <div className="rounded-lg border border-tg-line/50 bg-tg-bg/60 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-tg-muted">
                      <Thermometer className="size-3.5 text-tg-green" /> Temperature
                    </p>
                    <p className="font-tech text-sm text-tg-green">
                      {selectedBatch.temp.toFixed(1)}°C
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
                    <p className="font-tech text-sm text-sky-400">{selectedBatch.humidity}%</p>
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
                    <p className="font-tech text-sm text-tg-amber">{selectedBatch.shock.toFixed(1)}g</p>
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
                    <p className="font-tech text-sm text-foreground">{selectedBatch.doors}</p>
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
            </CardContent>
          </Card>
        </div>

        {/* Right rail */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Alerts */}
          <Card className="border-tg-red/30 bg-tg-panel">
            <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="size-4 text-tg-red" /> Active alerts
              </CardTitle>
              <Badge className="border-none bg-tg-red/15 text-tg-red">{alerts.length}</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 px-4">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    "rounded-lg border p-3",
                    a.severity === "critical"
                      ? "border-tg-red/40 bg-tg-red/10"
                      : "border-tg-amber/30 bg-tg-amber/5",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "font-tech text-[10px] font-semibold uppercase tracking-wider",
                        a.severity === "critical" ? "text-tg-red" : "text-tg-amber",
                      )}
                    >
                      {a.severity}
                    </span>
                    <span className="font-tech text-[10px] text-tg-muted">{a.time}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-foreground">{a.message}</p>
                  <p className="font-tech mt-0.5 text-[11px] text-tg-muted">
                    {a.batch} · {a.metric}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Batches */}
          <Card className="border-tg-line/60 bg-tg-panel">
            <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Boxes className="size-4 text-tg-green" /> Registered batches
              </CardTitle>
              <Badge variant="outline" className="border-tg-line/60 text-[10px] text-tg-muted">
                {batches.length} total
              </Badge>
            </CardHeader>
            <CardContent className="flex max-h-[420px] flex-col gap-2 overflow-y-auto px-4">
              {batches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBatchId(b.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors hover:bg-tg-panel-2/70",
                    selectedBatchId === b.id
                      ? "border-tg-green/40 bg-tg-green/5"
                      : "border-tg-line/50 bg-tg-bg/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-tech text-xs font-semibold text-foreground">{b.id}</span>
                    <Badge variant="outline" className={cn("text-[10px]", batchStyles[b.status])}>
                      {statusLabel[b.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-foreground">{b.product}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-tg-muted">
                    {b.origin} <ArrowRight className="size-3 shrink-0" /> {b.destination}
                  </p>
                  <div className="mt-2 flex items-center justify-between font-tech text-[11px]">
                    <span className={b.temp > 5 && b.status !== "staged" ? "text-tg-red" : "text-tg-green"}>
                      {b.temp.toFixed(1)}°C · {b.humidity}% RH
                    </span>
                    <span className="text-tg-muted">#{b.block.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Ledger feed */}
          <Card className="border-tg-line/60 bg-tg-panel">
            <CardHeader className="flex-row items-center justify-between space-y-0 py-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Link2 className="size-4 text-tg-green" /> Blockchain ledger
              </CardTitle>
              <Badge variant="outline" className="border-tg-green/30 bg-tg-green/10 text-[10px] text-tg-green">
                PoA · 0 gas
              </Badge>
            </CardHeader>
            <CardContent className="flex max-h-[380px] flex-col gap-2 overflow-y-auto px-4">
              {ledgerFeed.map((tx) => (
                <div key={tx.hash} className="rounded-lg border border-tg-line/50 bg-tg-bg/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={cn("text-[9px] uppercase", txStyles[tx.type])}>
                      {tx.type.replace("-", " ")}
                    </Badge>
                    <span className="flex items-center gap-1 text-[10px] text-tg-green">
                      <ShieldCheck className="size-3" /> {tx.status}
                    </span>
                  </div>
                  <p className="font-tech mt-1.5 truncate text-[11px] text-foreground">
                    {tx.hash.slice(0, 20)}…{tx.hash.slice(-8)}
                  </p>
                  <div className="font-tech mt-1 flex items-center justify-between text-[10px] text-tg-muted">
                    <span>blk #{tx.block.toLocaleString()}</span>
                    {tx.batch && <span>{tx.batch}</span>}
                    <span>gas {tx.gas}</span>
                    <span>{tx.time}</span>
                  </div>
                  <p className="font-tech mt-0.5 text-[10px] text-tg-muted/70">by {tx.validator}</p>
                </div>
              ))}
              <p className="font-tech pt-1 text-center text-[10px] text-tg-muted">
                clique of 4 validators · ~2s finality · zero-gas anchors
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
