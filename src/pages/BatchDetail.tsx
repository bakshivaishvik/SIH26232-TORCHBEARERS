import { Link, Navigate, useParams } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CircleDot,
  FlaskConical,
  Store,
  Thermometer,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import TelemetryCharts from "@/console/TelemetryCharts";
import { cn } from "@/lib/utils";
import {
  batches,
  consumerTimeline,
  ledgerFeed,
  shipments,
  statusLabel,
  type TimelineEvent,
} from "@/lib/trace-data";

const statusTone: Record<string, string> = {
  "in-transit": "text-tg-green border-tg-green/30 bg-tg-green/10",
  "at-risk": "text-tg-red border-tg-red/30 bg-tg-red/10",
  delivered: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  staged: "text-tg-muted border-tg-line bg-tg-panel-2",
};

const eventIcons = {
  farm: Store,
  truck: Truck,
  thermometer: FlaskConical,
  scan: CircleDot,
  store: Store,
} as const;

export default function BatchDetail() {
  const { batchId } = useParams();
  const batch = batches.find((b) => b.id === batchId);

  if (!batch) {
    return <Navigate to="/dashboard" replace />;
  }

  const shipment = shipments.find((s) => s.batch === batch.id);
  const timeline: TimelineEvent[] = consumerTimeline;
  const anchors = ledgerFeed.filter((tx) => tx.batch === batch.id);

  return (
    <div className="min-h-screen bg-tg-bg text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-tg-line/60 bg-tg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-tg-muted hover:bg-tg-panel-2 hover:text-foreground"
            >
              <Link to="/dashboard" aria-label="Back to your dashboard">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <p className="truncate text-sm text-tg-muted">
              <span className="font-sans">Your dashboard</span>
              <span className="mx-2 text-tg-line">/</span>
              <span className="font-tech text-foreground">{batch.id}</span>
            </p>
          </div>
          <Badge variant="outline" className={`shrink-0 text-[10px] ${statusTone[batch.status]}`}>
            {statusLabel[batch.status]}
          </Badge>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {/* Header block */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="font-tech text-[11px] uppercase tracking-widest text-tg-green">
              Cold-chain record
            </p>
            <h1 className="font-tech mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {batch.id}
            </h1>
            <p className="mt-1 text-sm text-tg-muted">
              {batch.product} · {batch.quantity} ·{" "}
              {batch.origin} → {batch.destination}
            </p>
          </div>
          <Badge
            variant="outline"
            className="w-fit gap-1.5 border-tg-green/30 bg-tg-green/10 px-3 py-1 text-[11px] text-tg-green"
          >
            <BadgeCheck className="size-3.5" /> Provenance sealed on Geth PoA
          </Badge>
        </motion.div>

        {/* Key readings */}
        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            {
              icon: Thermometer,
              label: "Current temperature",
              value: `${batch.temp.toFixed(1)}°C`,
              sub: batch.temp > 5 && batch.status !== "staged"
                ? "Above excursion threshold"
                : "Within setpoint band",
              valueTone: batch.temp > 5 && batch.status !== "staged" ? "text-tg-red" : "text-tg-green",
              iconTone: "text-tg-green bg-tg-green/10",
            },
            {
              icon: CircleDot,
              label: "Humidity",
              value: `${batch.humidity}% RH`,
              sub: "Target band 55–70%",
              valueTone: "text-sky-400",
              iconTone: "text-sky-400 bg-sky-400/10",
            },
            {
              icon: Truck,
              label: "Route progress",
              value: shipment ? `${shipment.progress}%` : "—",
              sub: shipment ? `${shipment.driver} · ETA ${shipment.eta}` : "Not in transit",
              valueTone: "text-foreground",
              iconTone: "text-sky-400 bg-sky-400/10",
            },
            {
              icon: BadgeCheck,
              label: "Latest anchor",
              value: `#${batch.block.toLocaleString()}`,
              sub: `${batch.validator} · ${batch.updated}`,
              valueTone: "text-tg-green",
              iconTone: "text-tg-green bg-tg-green/10",
            },
          ].map((t) => (
            <Card key={t.label} className="gap-3 rounded-xl border-tg-line/60 bg-tg-panel py-4">
              <CardContent className="flex items-center gap-3 px-4">
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", t.iconTone)}>
                  <t.icon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] uppercase tracking-wider text-tg-muted">{t.label}</p>
                  <p className={cn("font-tech truncate text-lg font-semibold leading-tight", t.valueTone)}>
                    {t.value}
                    {t.valueTone === "text-tg-red" && (
                      <span className="ml-2 rounded bg-tg-red/15 px-1.5 py-0.5 text-[9px] font-normal uppercase tracking-wider text-tg-red">
                        alert
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-tg-muted">{t.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Telemetry */}
        <Card className="mt-6 border-tg-line/60 bg-tg-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Thermometer className="size-4 text-tg-green" /> Edge node telemetry
            </CardTitle>
            <CardDescription>
              Signed readings from the node assigned to this batch, streamed every two hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TelemetryCharts batch={batch} />
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Custody timeline */}
          <Card className="border-tg-line/60 bg-tg-panel lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="size-4 text-tg-green" /> Custody and handling timeline
              </CardTitle>
              <CardDescription>
                Every custody transfer, QA release and intake scan recorded for this batch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute bottom-2 left-[15px] top-2 w-px bg-tg-line/70" />
                <div className="flex flex-col gap-3">
                  {timeline.map((e) => {
                    const Icon = eventIcons[e.icon];
                    return (
                      <div key={e.label} className="relative flex gap-3">
                        <div className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-tg-green/40 bg-tg-panel">
                          <Icon className="size-3.5 text-tg-green" />
                        </div>
                        <div className="min-w-0 flex-1 rounded-lg border border-tg-line/50 bg-tg-bg/40 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold">{e.label}</p>
                            <BadgeCheck className="size-3.5 shrink-0 text-tg-green" />
                          </div>
                          <p className="mt-0.5 text-[11px] leading-4 text-tg-muted">{e.detail}</p>
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="truncate text-[10px] text-tg-muted">{e.place}</span>
                            <span className="font-tech shrink-0 text-[10px] text-tg-muted">{e.time}</span>
                          </div>
                          <p className="font-tech mt-1 truncate text-[9px] text-tg-muted/60">
                            tx {e.txHash.slice(0, 26)}… verified on-chain
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right rail: ledger + summary */}
          <div className="flex flex-col gap-6">
            <Card className="border-tg-line/60 bg-tg-panel">
              <CardHeader>
                <CardTitle className="text-sm">On-chain anchors</CardTitle>
                <CardDescription>
                  Transactions referencing this batch.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {anchors.length === 0 && (
                  <p className="font-tech text-[11px] text-tg-muted">
                    No direct anchors in the recent feed.
                  </p>
                )}
                {anchors.map((tx) => (
                  <div key={tx.hash} className="rounded-lg border border-tg-line/50 bg-tg-bg/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="border-tg-green/25 bg-tg-green/10 text-[9px] uppercase text-tg-green">
                        {tx.type.replace("-", " ")}
                      </Badge>
                      <span className="font-tech text-[10px] text-tg-muted">{tx.time}</span>
                    </div>
                    <p className="font-tech mt-1.5 truncate text-[11px]">
                      {tx.hash.slice(0, 20)}…{tx.hash.slice(-8)}
                    </p>
                    <p className="font-tech mt-0.5 text-[10px] text-tg-muted">
                      blk #{tx.block.toLocaleString()} · gas {tx.gas} · {tx.status}
                    </p>
                  </div>
                ))}
                <Separator className="bg-tg-line/50" />
                <p className="font-tech text-[10px] leading-4 text-tg-muted">
                  Chain state is final within ~2s. Anchoring is free on the consortium —
                  fees never gate traceability.
                </p>
              </CardContent>
            </Card>

            <Card className="border-tg-line/60 bg-tg-panel">
              <CardHeader>
                <CardTitle className="text-sm">Registration</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-tg-muted">Registered to</span>
                  <span>Ganga Fresh Logistics</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-tg-muted">Origin facility</span>
                  <span className="text-right">{batch.origin}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-tg-muted">Destination</span>
                  <span className="text-right">{batch.destination}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-tg-muted">Quantity</span>
                  <span className="font-tech">{batch.quantity}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-tg-muted">Consensus</span>
                  <span className="font-tech">Geth PoA · clique</span>
                </div>
              </CardContent>
            </Card>

            <Button
              asChild
              variant="outline"
              className="w-full gap-2 border-tg-line text-foreground hover:bg-tg-panel-2"
            >
              <Link to="/dashboard">
                Back to your dashboard <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
