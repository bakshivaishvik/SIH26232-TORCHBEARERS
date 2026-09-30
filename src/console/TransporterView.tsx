import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BatteryFull,
  Check,
  CloudOff,
  Fingerprint,
  Gauge,
  Hand,
  MapPin,
  Navigation,
  Package,
  ScanFace,
  ShieldCheck,
  Signal,
  SignalZero,
  Snowflake,
  Thermometer,
  TriangleAlert,
  Truck,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const TELEMETRY_TICK_MS = 3200;

type BufferItem = {
  id: number;
  label: string;
  detail: string;
  size: number; // bytes
};

const initialBuffer: BufferItem[] = [
  { id: 1, label: "telemetry.anchor", detail: "4.0°C · 65% RH · sealed locally", size: 214 },
  { id: 2, label: "door.event", detail: "cargo door opened · rear bay", size: 96 },
];

// Deterministic pseudo-random walk keeps sensor output lively but stable
function nextTemp(t: number, offline: boolean) {
  const drift = ((Math.sin(Date.now() / 9000) + 1) / 2) * 0.6 - 0.25;
  const spike = offline ? 0 : 0;
  return Math.min(5.6, Math.max(3.2, t + drift * 0.4 + spike));
}
function nextHumidity(h: number) {
  const drift = ((Math.cos(Date.now() / 11000) + 1) / 2) * 2 - 1;
  return Math.min(72, Math.max(58, Math.round(h + drift)));
}
function nextShock() {
  return Math.round(Math.random() * 14) / 10;
}

function SensorTile({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
  tone: "green" | "amber" | "red";
}) {
  const tones = {
    green: "text-tg-green",
    amber: "text-tg-amber",
    red: "text-tg-red",
  } as const;
  return (
    <div className="rounded-xl border border-tg-line/60 bg-tg-bg/60 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-tg-muted">{label}</p>
        <Icon className={cn("size-3.5", tones[tone])} />
      </div>
      <p className={cn("font-tech mt-1.5 text-xl font-semibold leading-none", tones[tone])}>
        {value}
        <span className="ml-1 text-[11px] font-normal text-tg-muted">{unit}</span>
      </p>
    </div>
  );
}

export default function TransporterView() {
  const [offline, setOffline] = useState(false);
  const [temp, setTemp] = useState(4.0);
  const [humidity, setHumidity] = useState(65);
  const [shock, setShock] = useState(0.6);
  const [buffer, setBuffer] = useState<BufferItem[]>(initialBuffer);
  const [syncedCount, setSyncedCount] = useState(187);
  const [nextId, setNextId] = useState(3);
  const [alertOpen, setAlertOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [scanState, setScanState] = useState<"idle" | "scanning" | "match">("idle");
  const [handoffDone, setHandoffDone] = useState(false);
  const timer = useRef<number | null>(null);
  const scanTimer = useRef<number | null>(null);

  // Live sensor feed — only when online (offline = buffered sampling)
  useEffect(() => {
    timer.current = window.setInterval(() => {
      setTemp((t) => nextTemp(t, offline));
      setHumidity((h) => nextHumidity(h));
      const s = nextShock();
      setShock(s);
      if (offline) {
        setBuffer((b) =>
          [
            ...b,
            {
              id: Date.now(),
              label: "telemetry.anchor",
              detail: `${temp.toFixed(1)}°C · ${humidity}% RH · signed on-device`,
              size: 214,
            },
          ].slice(-6),
        );
      } else {
        setSyncedCount((c) => c + 1);
      }
    }, TELEMETRY_TICK_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline, temp, humidity]);

  // Raise the preventative edge alert shortly after the view mounts
  useEffect(() => {
    const t = window.setTimeout(() => setAlertOpen(true), 4200);
    return () => window.clearTimeout(t);
  }, []);

  const flushBuffer = () => {
    const count = buffer.length;
    setSyncedCount((c) => c + count);
    setBuffer([]);
  };

  // Auto-flush when connectivity returns
  useEffect(() => {
    if (!offline && buffer.length > 0) {
      const t = window.setTimeout(flushBuffer, 1600);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline, buffer.length]);

  const startScan = () => {
    if (scanTimer.current) window.clearTimeout(scanTimer.current);
    setScanState("scanning");
    scanTimer.current = window.setTimeout(() => setScanState("match"), 2000);
  };

  const tempTone = temp > 5 ? "red" : temp > 4.4 ? "amber" : "green";
  const bufferBytes = buffer.reduce((a, b) => a + b.size, 0);

  const handoffSteps = [
    { label: "Face captured on secure enclave", at: "0.4s" },
    { label: "Liveness check passed", at: "0.9s" },
    { label: "Driver credential matched (TG-DRV-118)", at: "1.4s" },
    { label: "Custody transfer signed — queued to custody-transfer contract", at: "2.1s" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col items-center gap-4">
      {/* Phone frame */}
      <div className="relative w-full overflow-hidden rounded-[2rem] border border-tg-line bg-tg-bg shadow-[0_0_60px_rgba(16,185,129,0.07)]">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-tg-panel px-5 pb-2 pt-3 text-[11px] text-foreground">
          <span className="font-tech">09:41</span>
          <div className="flex items-center gap-1.5">
            {offline ? (
              <SignalZero className="size-3.5 text-tg-amber" />
            ) : (
              <Signal className="size-3.5 text-tg-green" />
            )}
            <Wifi className={cn("size-3.5", offline ? "text-tg-muted" : "text-tg-green")} />
            <BatteryFull className="size-4 text-foreground" />
          </div>
        </div>

        {/* App header */}
        <div className="flex items-center justify-between bg-tg-panel px-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-tg-green/15 text-tg-green">
              <Truck className="size-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">R. Patil</p>
              <p className="text-[11px] text-tg-muted">Reefer TRK-118 · NH-66 N</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "font-tech text-[10px]",
              offline
                ? "border-tg-amber/40 bg-tg-amber/10 text-tg-amber"
                : "border-tg-green/40 bg-tg-green/10 text-tg-green",
            )}
          >
            {offline ? "OFFLINE" : "SYNCED"}
          </Badge>
        </div>

        {/* Active run card */}
        <div className="border-t border-tg-line/60 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-tg-muted">Active run</p>
              <p className="font-tech text-sm font-semibold text-foreground">
                TG-8492 · Alphonso Mangoes
              </p>
            </div>
            <Badge variant="outline" className="border-tg-green/30 bg-tg-green/10 text-[10px] text-tg-green">
              <ShieldCheck className="size-3" /> CHAIN VERIFIED
            </Badge>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-tg-muted">
            <MapPin className="size-3.5 shrink-0 text-tg-green" />
            <span>Ratnagiri, MH</span>
            <div className="relative h-px flex-1 bg-tg-line">
              <div className="absolute left-[62%] top-1/2 size-2 -translate-y-1/2 rounded-full bg-tg-green shadow-[0_0_8px_#10b981]" />
            </div>
            <span>Mumbai, MH</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-tg-muted">
              <Navigation className="size-3.5" /> 129 km remaining
            </span>
            <span className="font-tech text-tg-green">ETA 3h 12m</span>
          </div>
        </div>

        {/* Offline toggle */}
        <div className="mx-4 mb-4 rounded-xl border border-tg-line/60 bg-tg-panel-2/50 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg",
                  offline ? "bg-tg-amber/15 text-tg-amber" : "bg-tg-green/15 text-tg-green",
                )}
              >
                {offline ? <CloudOff className="size-4" /> : <Wifi className="size-4" />}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Offline mode</p>
                <p className="text-[10px] text-tg-muted">
                  {offline ? "Edge buffering active" : "Cellular · LTE-M strong"}
                </p>
              </div>
            </div>
            <Switch
              checked={offline}
              onCheckedChange={(v) => {
                setOffline(v);
                if (v) setAlertOpen(true);
              }}
              className="data-[state=checked]:bg-tg-amber"
            />
          </div>

          {/* Edge buffer */}
          <div className="mt-3 border-t border-tg-line/50 pt-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-tg-muted">
              <span className="flex items-center gap-1">
                <Package className="size-3" /> Edge buffer queue
              </span>
              <span className={cn("font-tech", buffer.length > 0 ? "text-tg-amber" : "text-tg-green")}>
                {buffer.length} pkts · {bufferBytes} B
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <AnimatePresence initial={false}>
                {buffer.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    className="font-tech flex items-center justify-between rounded-md border border-tg-amber/25 bg-tg-amber/5 px-2.5 py-1.5 text-[10px]"
                  >
                    <span className="text-tg-amber">{item.label}</span>
                    <span className="truncate px-2 text-tg-muted">{item.detail}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {buffer.length === 0 && (
                <p className="font-tech flex items-center gap-1.5 rounded-md border border-tg-green/25 bg-tg-green/5 px-2.5 py-1.5 text-[10px] text-tg-green">
                  <Check className="size-3" /> all records anchored on-chain · queue empty
                </p>
              )}
            </div>
            {offline && buffer.length > 0 && (
              <p className="mt-2 text-[10px] leading-4 text-tg-muted">
                Records are Merkle-signed on-device and stored in flash. Anchoring resumes
                automatically when signal returns — zero data loss, zero gas.
              </p>
            )}
          </div>
        </div>

        {/* Live sensors */}
        <div className="px-4 pb-4">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-tg-muted">
            <Gauge className="size-3" /> Live cargo sensors
            <span className="relative ml-1 flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tg-green opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-tg-green" />
            </span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            <SensorTile icon={Thermometer} label="Temp" value={temp.toFixed(1)} unit="°C" tone={tempTone} />
            <SensorTile icon={Snowflake} label="Humidity" value={String(humidity)} unit="%RH" tone="green" />
            <SensorTile icon={Hand} label="Shock" value={shock.toFixed(1)} unit="g" tone={shock > 2.5 ? "red" : "green"} />
          </div>
          <div className="mt-3 rounded-xl border border-tg-line/60 bg-tg-panel-2/50 p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-tg-muted">Reefer unit duty cycle</span>
              <span className="font-tech text-foreground">42% · nominal</span>
            </div>
            <Progress value={42} className="mt-2 h-1.5 bg-tg-bg" />
            <div className="mt-2.5 flex items-center justify-between text-[10px] text-tg-muted">
              <span className="font-tech">{syncedCount} anchors this trip</span>
              <span className="font-tech text-tg-green">0 excursions</span>
            </div>
          </div>
        </div>

        {/* Biometric handoff */}
        <div className="border-t border-tg-line/60 bg-tg-panel/60 px-4 py-4">
          <p className="mb-2.5 text-[10px] uppercase tracking-wider text-tg-muted">
            Custody transfer — next stop
          </p>
          <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-tg-line/60 bg-tg-bg/60 p-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sky-400/15 text-sky-400">
              <MapPin className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">
                FreshKart DC · Dock 12, Mumbai
              </p>
              <p className="text-[10px] text-tg-muted">Receiver: P. Deshpande · FreshKart Retail</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setHandoffOpen(true);
              setHandoffDone(false);
              setScanState("idle");
              if (scanTimer.current) window.clearTimeout(scanTimer.current);
            }}
            className="h-11 w-full gap-2 bg-tg-green font-semibold text-tg-bg hover:bg-tg-green-bright"
          >
            <ScanFace className="size-4.5" />
            Biometric handoff
          </Button>
          <p className="mt-2 text-center text-[10px] leading-4 text-tg-muted">
            Face match is verified on-device via the secure enclave — custody binds to the
            smart contract even with no cloud connection.
          </p>
        </div>
      </div>

      {/* Preventative edge alert popup */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="w-[340px] gap-0 rounded-2xl border-tg-amber/50 bg-tg-panel p-0" showCloseButton={false}>
          <div className="flex items-start gap-3 border-b border-tg-line/60 p-4">
            <div className="tg-glow-red flex size-10 shrink-0 items-center justify-center rounded-xl bg-tg-amber/15 text-tg-amber">
              <TriangleAlert className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-sm">Edge alert · intervene now</DialogTitle>
              <DialogDescription className="text-[11px]">
                Preventative warning raised by node TG-N-2231
              </DialogDescription>
            </div>
          </div>
          <div className="space-y-2.5 p-4 text-xs">
            <div className="rounded-lg border border-tg-red/35 bg-tg-red/10 p-3">
              <p className="font-tech text-[10px] uppercase tracking-wider text-tg-red">
                projected excursion in ~47 min
              </p>
              <p className="mt-1 leading-5 text-foreground">
                Cargo temp is trending <span className="font-tech text-tg-red">4.8°C</span> with
                reefer duty at 74%. At this rate the 5.0°C threshold is breached before Mumbai.
              </p>
            </div>
            <div className="rounded-lg border border-tg-line/60 bg-tg-bg/60 p-3">
              <p className="text-[11px] font-medium text-foreground">Recommended actions</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[11px] leading-5 text-tg-muted">
                <li>Drop setpoint to 3.0°C for the next 60 km</li>
                <li>Check door seal on rear bay (last opening 14:02)</li>
                <li>Log intervention — anchors an intervention record on-chain</li>
              </ul>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                className="h-9 flex-1 gap-1.5 bg-tg-green text-tg-bg hover:bg-tg-green-bright"
                onClick={() => setAlertOpen(false)}
              >
                <Check className="size-3.5" /> Acknowledge
              </Button>
              <Button
                variant="outline"
                className="h-9 flex-1 border-tg-line text-foreground hover:bg-tg-panel-2"
                onClick={() => setAlertOpen(false)}
              >
                Snooze 15m
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Biometric handoff dialog */}
      <Dialog open={handoffOpen} onOpenChange={setHandoffOpen}>
        <DialogContent className="w-[340px] gap-0 rounded-2xl border-tg-line bg-tg-panel p-0" showCloseButton={false}>
          <DialogHeader className="border-b border-tg-line/60 p-4">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <ScanFace className="size-4 text-tg-green" /> Biometric handoff
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              On-device facial recognition · secure enclave · no cloud required
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center p-4">
            <div
              className={cn(
                "relative flex size-28 items-center justify-center overflow-hidden rounded-2xl border-2 transition-colors",
                scanState === "idle" && "border-tg-line/70",
                scanState === "scanning" && "border-tg-green/60",
                scanState === "match" && "border-tg-green tg-glow-green",
              )}
            >
              <Fingerprint
                className={cn(
                  "size-14 transition-colors",
                  scanState === "match" ? "text-tg-green" : "text-tg-muted",
                )}
              />
              {scanState === "scanning" && (
                <motion.div
                  className="tg-scanline absolute inset-x-0 h-8"
                  animate={{ y: [8, 88, 8] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </div>
            <p className="font-tech mt-3 text-center text-[11px] text-tg-muted">
              {scanState === "idle" && "awaiting driver look-in…"}
              {scanState === "scanning" && "matching biometric template…"}
              {scanState === "match" && "identity verified · R. Patil"}
            </p>

            {scanState !== "idle" && (
              <div className="mt-3 w-full space-y-1.5 rounded-lg border border-tg-line/60 bg-tg-bg/60 p-3">
                {handoffSteps.map((step, i) => {
                  const reached =
                    scanState === "match" || (scanState === "scanning" && i === 0);
                  return (
                    <div key={step.label} className="flex items-center gap-2 text-[10px]">
                      {reached ? (
                        <Check className="size-3 shrink-0 text-tg-green" />
                      ) : (
                        <span className="size-3 shrink-0 rounded-full border border-tg-line" />
                      )}
                      <span className={reached ? "text-foreground" : "text-tg-muted/60"}>
                        {step.label}
                      </span>
                      {reached && <span className="font-tech ml-auto text-tg-muted">{step.at}</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {scanState === "match" && handoffDone && (
              <div className="mt-3 w-full rounded-lg border border-tg-green/35 bg-tg-green/10 p-3 text-center">
                <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-tg-green">
                  <ShieldCheck className="size-4" /> Custody transfer bound to contract
                </p>
                <p className="font-tech mt-1 text-[10px] text-tg-muted">
                  tx 0x9c2e…d9e2 · custody-transfer · gas 0 · pending anchor
                </p>
              </div>
            )}

            <div className="mt-4 flex w-full gap-2">
              {scanState === "idle" && (
                <Button
                  onClick={startScan}
                  className="h-10 flex-1 bg-tg-green font-semibold text-tg-bg hover:bg-tg-green-bright"
                >
                  Start face scan
                </Button>
              )}
              {scanState === "scanning" && (
                <Button disabled className="h-10 flex-1 bg-tg-panel-2 text-tg-muted">
                  Verifying…
                </Button>
              )}
              {scanState === "match" && !handoffDone && (
                <Button
                  onClick={() => setHandoffDone(true)}
                  className="h-10 flex-1 bg-tg-green font-semibold text-tg-bg hover:bg-tg-green-bright"
                >
                  Confirm handoff
                </Button>
              )}
              {scanState === "match" && handoffDone && (
                <Button
                  variant="outline"
                  onClick={() => setHandoffOpen(false)}
                  className="h-10 flex-1 border-tg-line text-foreground hover:bg-tg-panel-2"
                >
                  Done
                </Button>
              )}
              {scanState !== "match" && (
                <Button
                  variant="outline"
                  onClick={() => setHandoffOpen(false)}
                  className="h-10 border-tg-line text-foreground hover:bg-tg-panel-2"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <p className="font-tech text-center text-[10px] text-tg-muted">
        Try toggling <span className="text-tg-amber">Offline mode</span> — telemetry keeps
        sampling and Merkle-buffers locally until signal returns.
      </p>
    </div>
  );
}
