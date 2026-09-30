import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import jsQR from "jsqr";
import {
  BadgeCheck,
  Camera,
  CameraOff,
  Check,
  FlaskConical,
  MapPin,
  Package,
  RotateCcw,
  ScanBarcode,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Store,
  Truck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { consumerTimeline } from "@/lib/trace-data";

type Phase = "camera" | "scanning" | "authentic" | "counterfeit";
type CameraState = "off" | "requesting" | "live" | "denied";

// Deterministic QR-ish matrix for the on-screen CDP label (visual fallback)
function useQrMatrix(seed: string, size = 25) {
  return useMemo(() => {
    const cells: boolean[][] = [];
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const rnd = (r: number, c: number) => {
      let x = h ^ (r * 73856093) ^ (c * 19349663);
      x = Math.imul(x ^ (x >>> 13), 3266489917);
      x ^= x >>> 16;
      return (x >>> 0) / 4294967295;
    };
    const inFinder = (r: number, c: number) => {
      const f = (fr: number, fc: number) =>
        r >= fr && r < fr + 7 && c >= fc && c < fc + 7;
      return f(0, 0) || f(0, size - 7) || f(size - 7, 0);
    };
    for (let r = 0; r < size; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < size; c++) {
        if (inFinder(r, c)) {
          const rr = r >= size - 7 ? r - (size - 7) : r;
          const cc = c >= size - 7 ? c - (size - 7) : c;
          const edge = rr === 0 || rr === 6 || cc === 0 || cc === 6;
          const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
          row.push(edge || core);
        } else {
          row.push(rnd(r, c) > 0.52);
        }
      }
      cells.push(row);
    }
    return cells;
  }, [seed, size]);
}

/** Serial printed on the fallback CDP label. */
const BUILTIN_PAYLOAD = "TG-8492|CDP-v3|cryptoglyph";

/** Extract a batch serial from a scanned QR payload: a recognized TraceGuard
 *  code yields its own serial; any other QR gets a deterministic serial from
 *  its content. */
function deriveSerial(payload: string): string {
  const match = payload.match(/TG-(\d{3,6})/);
  if (match) return `TG-${match[1]}`;
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `TG-${((h >>> 0) % 90000) + 10000}`;
}

function registeredItemFor(serial: string, payload: string): string {
  if (serial === "TG-8492") return "Alphonso Mangoes · 1,240 crates";
  const short = payload.length > 28 ? `${payload.slice(0, 28)}…` : payload;
  return short || "Registered produce lot";
}

const timelineIcons = {
  farm: Sprout,
  truck: Truck,
  thermometer: FlaskConical,
  scan: ScanBarcode,
  store: Store,
} as const;

const SCAN_COUNT_KEY = "traceguard.scanCount";

function readScanCount() {
  if (typeof window === "undefined") return 0;
  const raw = window.sessionStorage.getItem(SCAN_COUNT_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function ConsumerView() {
  const [phase, setPhase] = useState<Phase>("camera");
  const [cameraState, setCameraState] = useState<CameraState>("off");
  const [seeking, setSeeking] = useState(false);
  const [seekTimedOut, setSeekTimedOut] = useState(false);
  const [qrDetected, setQrDetected] = useState<string | null>(null);
  const [result, setResult] = useState<{ payload: string; serial: string } | null>(null);

  const qr = useQrMatrix(BUILTIN_PAYLOAD);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanTimer = useRef<number | null>(null);
  const seekTimer = useRef<number | null>(null);
  const lockedRef = useRef(false);
  const seekingRef = useRef(false);
  const scanCountRef = useRef(readScanCount());
  const runVerificationRef = useRef<(payload: string) => void>(() => {});

  /** Re-attach the live stream whenever a <video> element (re)mounts. */
  const attachStream = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      void el.play().catch(() => {});
    }
  }, []);

  // Bind the stream to the mounted <video> whenever the camera turns live or a
  // phase transition swaps in a fresh element. The callback ref alone misses
  // the off → live transition because the element never unmounts.
  useEffect(() => {
    const el = videoRef.current;
    const stream = streamRef.current;
    if (cameraState !== "live" || !el) return;
    if (stream && el.srcObject !== stream) el.srcObject = stream;
    void el.play().catch(() => {});
  }, [cameraState, phase]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("denied");
      return;
    }
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      stopCamera();
      streamRef.current = stream;
      setCameraState("live");
    } catch {
      setCameraState("denied");
    }
  }, [stopCamera]);

  useEffect(
    () => () => {
      if (scanTimer.current) window.clearTimeout(scanTimer.current);
      if (seekTimer.current) window.clearTimeout(seekTimer.current);
      stopCamera();
    },
    [stopCamera],
  );

  /** Full verification pipeline for a real decoded payload. */
  const runVerification = useCallback((payload: string) => {
    if (seekTimer.current) {
      window.clearTimeout(seekTimer.current);
      seekTimer.current = null;
    }
    seekingRef.current = false;
    setSeeking(false);
    setSeekTimedOut(false);
    lockedRef.current = true;
    setQrDetected(payload);

    const serial = deriveSerial(payload);
    const next = scanCountRef.current + 1;
    scanCountRef.current = next;
    try {
      window.sessionStorage.setItem(SCAN_COUNT_KEY, String(next));
    } catch {
      // sessionStorage unavailable — the counter still works in memory
    }
    setResult({ payload, serial });
    setPhase("scanning");
    if (scanTimer.current) window.clearTimeout(scanTimer.current);
    scanTimer.current = window.setTimeout(() => {
      setPhase(next % 3 === 0 ? "counterfeit" : "authentic");
    }, 2100);
  }, []);
  runVerificationRef.current = runVerification;

  /** User-initiated scan: watch the feed until a QR locks on (10s window). */
  const startSeeking = useCallback(() => {
    setSeekTimedOut(false);
    lockedRef.current = false;
    setQrDetected(null);
    seekingRef.current = true;
    setSeeking(true);
    if (seekTimer.current) window.clearTimeout(seekTimer.current);
    seekTimer.current = window.setTimeout(() => {
      seekingRef.current = false;
      setSeeking(false);
      setSeekTimedOut(true);
    }, 10000);
  }, []);

  const cancelSeeking = useCallback(() => {
    if (seekTimer.current) {
      window.clearTimeout(seekTimer.current);
      seekTimer.current = null;
    }
    seekingRef.current = false;
    setSeeking(false);
    lockedRef.current = false;
    setQrDetected(null);
  }, []);

  // Passive decode loop: locks the preview chip when a QR is held steady, but
  // verification only ever runs from an explicit user action.
  useEffect(() => {
    if (phase !== "camera" || cameraState !== "live") return;
    const id = window.setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return;
      const w = 360;
      const h = 360;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      const side = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - side) / 2;
      const sy = (video.videoHeight - side) / 2;
      ctx.drawImage(video, sx, sy, side, side, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      const code = jsQR(frame.data, w, h, { inversionAttempts: "dontInvert" });
      if (code?.data && !lockedRef.current) {
        lockedRef.current = true;
        if (seekingRef.current) {
          runVerificationRef.current(code.data);
        } else {
          navigator.vibrate?.(60);
          setQrDetected(code.data);
        }
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [phase, cameraState]);

  const reset = () => {
    setQrDetected(null);
    setResult(null);
    setSeeking(false);
    setSeekTimedOut(false);
    seekingRef.current = false;
    lockedRef.current = false;
    setPhase("camera");
  };

  return (
    <div className="mx-auto flex w-full max-w-[400px] flex-col items-center gap-4">
      <div className="relative w-full overflow-hidden rounded-[2rem] border border-tg-line bg-tg-bg shadow-[0_0_60px_rgba(16,185,129,0.07)]">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-tg-panel px-5 pb-2 pt-3 text-[11px] text-foreground">
          <span className="font-tech">14:22</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-tg-muted">FreshKart · guest wifi</span>
          </div>
        </div>

        <div className="relative min-h-[560px]">
          <AnimatePresence mode="wait">
            {phase === "camera" && (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 pb-5 pt-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Verify product</p>
                    <p className="text-[11px] text-tg-muted">
                      Anti-Cloning CDP · cryptoglyph check
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      cameraState === "live" && "border-tg-green/30 bg-tg-green/10 text-tg-green",
                      cameraState === "requesting" &&
                        "border-tg-amber/30 bg-tg-amber/10 text-tg-amber",
                      (cameraState === "off" || cameraState === "denied") &&
                        "border-tg-line/70 bg-tg-panel-2 text-tg-muted",
                    )}
                  >
                    <Camera className="size-3" />
                    {cameraState === "live" && "CAMERA LIVE"}
                    {cameraState === "requesting" && "STARTING…"}
                    {cameraState === "off" && "CAMERA OFF"}
                    {cameraState === "denied" && "NO ACCESS"}
                  </Badge>
                </div>

                {/* Viewfinder */}
                <div
                  className={cn(
                    "tg-grid-bg relative aspect-square overflow-hidden rounded-2xl border bg-[radial-gradient(circle_at_50%_45%,#1d2a24_0%,#141416_70%)]",
                    qrDetected ? "border-tg-green/70" : "border-tg-line/70",
                  )}
                >
                  <video
                    ref={attachStream}
                    autoPlay
                    muted
                    playsInline
                    className={cn(
                      "absolute inset-0 size-full object-cover transition-opacity duration-500",
                      cameraState === "live" ? "opacity-100" : "opacity-0",
                    )}
                  />

                  {/* Camera-off / starting / denied overlays */}
                  {cameraState === "off" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                      <div className="flex size-14 items-center justify-center rounded-2xl border border-tg-line bg-tg-panel">
                        <CameraOff className="size-6 text-tg-muted" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Camera is off</p>
                      <p className="text-[11px] leading-4 text-tg-muted">
                        Turn the camera on to scan the CDP label printed on the pack.
                      </p>
                      <Button
                        onClick={() => void startCamera()}
                        className="mt-1 h-10 gap-2 bg-tg-green font-semibold text-tg-bg hover:bg-tg-green-bright"
                      >
                        <Camera className="size-4" /> Turn on camera
                      </Button>
                    </div>
                  )}
                  {cameraState === "requesting" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                      <span className="size-8 animate-spin rounded-full border border-tg-green/30 border-t-tg-green" />
                      <p className="text-[11px] text-tg-muted">Starting camera…</p>
                    </div>
                  )}
                  {cameraState === "denied" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                      <div className="flex size-14 items-center justify-center rounded-2xl border border-tg-amber/40 bg-tg-amber/10">
                        <CameraOff className="size-6 text-tg-amber" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Camera unavailable</p>
                      <p className="text-[11px] leading-4 text-tg-muted">
                        Allow camera access in your browser to scan a real label — or verify
                        the on-screen label below.
                      </p>
                      <div className="mt-1 flex gap-2">
                        <Button
                          onClick={() => void startCamera()}
                          className="h-10 gap-2 bg-tg-green font-semibold text-tg-bg hover:bg-tg-green-bright"
                        >
                          <Camera className="size-4" /> Retry camera
                        </Button>
                        <Button
                          onClick={() => runVerification(BUILTIN_PAYLOAD)}
                          variant="outline"
                          className="h-10 border-tg-line text-foreground hover:bg-tg-panel-2"
                        >
                          <ScanLine className="size-4" /> Use on-screen label
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Scanline + brackets (live only) */}
                  {cameraState === "live" && (
                    <>
                      <motion.div
                        className="tg-scanline absolute inset-x-6 h-10"
                        animate={{ y: [16, 380, 16] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {[
                        "left-4 top-4 border-l-2 border-t-2 rounded-tl-lg",
                        "right-4 top-4 border-r-2 border-t-2 rounded-tr-lg",
                        "left-4 bottom-4 border-l-2 border-b-2 rounded-bl-lg",
                        "right-4 bottom-4 border-r-2 border-b-2 rounded-br-lg",
                      ].map((cls) => (
                        <div key={cls} className={cn("absolute size-10 border-tg-green/80", cls)} />
                      ))}
                    </>
                  )}

                  {/* Locked-label indicator */}
                  {cameraState === "live" && qrDetected && (
                    <div className="absolute inset-x-0 top-4 flex justify-center px-4">
                      <span className="font-tech truncate rounded-full border border-tg-green/50 bg-tg-bg/90 px-3 py-1 text-[10px] text-tg-green">
                        LABEL LOCKED · {qrDetected.slice(0, 24)}
                      </span>
                    </div>
                  )}

                  {/* On-screen CDP label — fallback scan target when camera
                      access is unavailable */}
                  {cameraState === "denied" && (
                    <div className="absolute inset-x-0 bottom-14 flex justify-center">
                      <div className="rotate-[-3deg] rounded-lg border border-tg-line/60 bg-tg-panel/95 p-3 shadow-xl">
                        <div className="flex items-center gap-2.5">
                          <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(25, 2px)" }}>
                            {qr.flatMap((row, r) =>
                              row.map((on, c) => (
                                <span
                                  key={`${r}-${c}`}
                                  className={cn(
                                    "size-[2px]",
                                    on
                                      ? r % 7 === 3 && c % 5 === 2
                                        ? "bg-tg-red/80"
                                        : "bg-foreground"
                                      : "bg-transparent",
                                  )}
                                />
                              )),
                            )}
                          </div>
                          <div className="pl-1">
                            <p className="font-tech text-[9px] font-bold text-foreground">TG-8492</p>
                            <p className="text-[8px] leading-tight text-tg-muted">Alphonso Mangoes</p>
                            <p className="font-tech mt-1 text-[7px] text-tg-muted/70">CDP v3 · 1,440 glyphs</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {cameraState === "live" && (
                    <p className="absolute inset-x-0 bottom-4 text-center text-[11px] text-tg-muted">
                      {seeking
                        ? "Searching for label — hold a QR inside the frame"
                        : qrDetected
                          ? "Label locked — press Verify label"
                          : "Point the camera at the CDP label"}
                    </p>
                  )}
                </div>

                {/* Actions (live only) */}
                {cameraState === "live" && (
                  <>
                    {seeking ? (
                      <Button
                        onClick={cancelSeeking}
                        variant="outline"
                        className="mt-4 h-11 w-full border-tg-line text-foreground hover:bg-tg-panel-2"
                      >
                        Cancel scan
                      </Button>
                    ) : (
                      <Button
                        onClick={() => (qrDetected ? runVerification(qrDetected) : startSeeking())}
                        className="mt-4 h-11 w-full gap-2 bg-tg-green font-semibold text-tg-bg hover:bg-tg-green-bright"
                      >
                        <ScanLine className="size-4.5" />
                        {qrDetected ? "Verify label" : "Scan CDP label"}
                      </Button>
                    )}
                    {seekTimedOut && (
                      <p className="mt-2 text-center text-[10px] text-tg-amber">
                        No label detected — hold a QR code steady inside the frame and try again.
                      </p>
                    )}
                  </>
                )}

                <p className="mt-3 text-center text-[10px] leading-4 text-tg-muted">
                  Microscopic cryptoglyphs embedded in the printed label are read alongside the
                  QR payload — photocopies and reprints fail the pattern check even when the QR
                  decodes cleanly.
                </p>

                {/* Hidden canvas used by the QR decoder */}
                <canvas ref={canvasRef} className="hidden" />
              </motion.div>
            )}

            {phase === "scanning" && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative flex min-h-[560px] flex-col items-center justify-center overflow-hidden px-4 pb-5"
              >
                <video
                  ref={attachStream}
                  autoPlay
                  muted
                  playsInline
                  className={cn(
                    "absolute inset-0 size-full object-cover transition-opacity duration-500",
                    cameraState === "live" ? "opacity-100" : "opacity-0",
                  )}
                />
                <div
                  className={cn(
                    "absolute inset-0 bg-tg-bg/80 transition-opacity duration-500",
                    cameraState === "live" ? "opacity-100" : "opacity-0",
                  )}
                />
                <div className="relative flex w-full flex-col items-center">
                  <div className="relative flex size-24 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-tg-green/10" />
                    <div className="tg-glow-green flex size-20 items-center justify-center rounded-2xl border border-tg-green/50 bg-tg-bg">
                      <ScanLine className="size-8 animate-pulse text-tg-green" />
                    </div>
                  </div>
                  <p className="font-tech mt-5 text-xs text-foreground">Verifying cryptoglyph pattern…</p>
                  {result && (
                    <>
                      <p className="font-tech mt-2 max-w-[280px] truncate rounded-md border border-tg-line/60 bg-tg-panel/70 px-3 py-1 text-[10px] text-tg-muted">
                        payload · {result.payload}
                      </p>
                      <p className="font-tech mt-1 text-[10px] text-tg-muted">
                        serial {result.serial}
                      </p>
                    </>
                  )}
                  <div className="mt-4 w-full max-w-[260px] space-y-2">
                    {[
                      { label: "QR payload captured", done: true },
                      { label: "Comparing against registered print key", done: true },
                      {
                        label: `Resolving serial ${result?.serial ?? "—"} on Geth PoA chain`,
                        done: false,
                      },
                    ].map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 * i }}
                        className="flex items-center gap-2 rounded-lg border border-tg-line/60 bg-tg-panel/70 px-3 py-2 text-[11px]"
                      >
                        {s.done ? (
                          <Check className="size-3.5 shrink-0 text-tg-green" />
                        ) : (
                          <span className="size-3.5 shrink-0 animate-spin rounded-full border border-tg-green/30 border-t-tg-green" />
                        )}
                        <span className={s.done ? "text-foreground" : "text-tg-muted"}>{s.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {phase === "authentic" && (
              <motion.div
                key="authentic"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-4 pb-5 pt-4"
              >
                {/* Success block */}
                <div className="tg-glow-green rounded-2xl border border-tg-green/50 bg-gradient-to-b from-tg-green/15 to-tg-green/5 p-5 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-tg-green/20">
                    <ShieldCheck className="size-7 text-tg-green" />
                  </div>
                  <p className="mt-3 text-base font-bold tracking-tight text-foreground">
                    Authentic product
                  </p>
                  <p className="font-tech text-[11px] text-tg-green">
                    Batch {result?.serial ?? "—"} ·{" "}
                    {result ? registeredItemFor(result.serial, result.payload) : "—"}
                  </p>
                  {result && (
                    <p className="font-tech mt-2 break-all rounded-md border border-tg-green/20 bg-tg-bg/60 px-2 py-1 text-[9px] leading-3 text-tg-muted">
                      payload · {result.payload}
                    </p>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-left">
                    {[
                      { k: "Glyphs", v: "1,440 ✓" },
                      { k: "Device key", v: "registered" },
                      { k: "Chain record", v: "sealed" },
                    ].map((c) => (
                      <div key={c.k} className="rounded-lg border border-tg-green/25 bg-tg-bg/60 px-2 py-1.5">
                        <p className="text-[9px] uppercase tracking-wider text-tg-muted">{c.k}</p>
                        <p className="font-tech text-[10px] text-tg-green">{c.v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Batch timeline */}
                <p className="mb-2 mt-5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-tg-muted">
                  <MapPin className="size-3.5" /> Farm-to-fork history
                </p>
                <div className="relative">
                  <div className="absolute bottom-2 left-[15px] top-2 w-px bg-tg-line/70" />
                  <div className="flex flex-col gap-3">
                    {consumerTimeline.map((e) => {
                      const Icon = timelineIcons[e.icon];
                      return (
                        <div key={e.label} className="relative flex gap-3">
                          <div className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-tg-green/40 bg-tg-panel">
                            <Icon className="size-3.5 text-tg-green" />
                          </div>
                          <div className="min-w-0 flex-1 rounded-lg border border-tg-line/50 bg-tg-panel/60 p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-foreground">{e.label}</p>
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

                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="h-10 flex-1 gap-2 border-tg-line text-foreground hover:bg-tg-panel-2"
                  >
                    <RotateCcw className="size-4" /> Scan another
                  </Button>
                  <Button className="h-10 flex-1 gap-2 bg-tg-green font-semibold text-tg-bg hover:bg-tg-green-bright">
                    <Package className="size-4" /> Report issue
                  </Button>
                </div>
              </motion.div>
            )}

            {phase === "counterfeit" && (
              <motion.div
                key="counterfeit"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 pb-5 pt-4"
              >
                <div className="tg-glow-red rounded-2xl border border-tg-red/60 bg-gradient-to-b from-tg-red/20 to-tg-red/5 p-5 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-tg-red/25">
                    <ShieldAlert className="size-7 text-tg-red" />
                  </div>
                  <p className="mt-3 text-base font-bold tracking-tight text-foreground">
                    Suspected counterfeit
                  </p>
                  <p className="mt-1 text-[11px] leading-4 text-tg-red">
                    This label failed anti-cloning verification. Do not stock, sell, or consume
                    this product. Quarantine and report immediately.
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-tg-red/40 bg-tg-red/10 p-4">
                  <p className="font-tech text-[10px] uppercase tracking-wider text-tg-red">
                    Verification failures
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    {[
                      { label: "CDP cryptoglyph matrix mismatch", detail: "glyph deviation 34.2% · reprint suspected" },
                      { label: "Printing device key not registered", detail: "unknown press · not in consortium registry" },
                      {
                        label: `No chain record for serial ${result?.serial ?? "—"}`,
                        detail: "serial never anchored on Geth PoA",
                      },
                    ].map((f) => (
                      <div key={f.label} className="flex items-start gap-2.5 rounded-lg border border-tg-red/30 bg-tg-bg/50 p-2.5">
                        <X className="mt-0.5 size-3.5 shrink-0 text-tg-red" />
                        <div>
                          <p className="text-[11px] font-semibold leading-4 text-foreground">{f.label}</p>
                          <p className="font-tech text-[10px] text-tg-muted">{f.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-tg-line/60 bg-tg-panel/70 p-4">
                  <p className="text-[11px] font-medium text-foreground">Scanned at</p>
                  <p className="mt-1 font-tech text-[10px] text-tg-muted">
                    FreshKart · Store #114 · Mumbai, MH · 14:22:07 IST
                  </p>
                  {result && (
                    <p className="font-tech mt-2 break-all rounded-md border border-tg-line/60 bg-tg-bg/60 px-2 py-1 text-[9px] leading-3 text-tg-muted">
                      payload · {result.payload}
                    </p>
                  )}
                  <p className="mt-2 text-[10px] leading-4 text-tg-muted">
                    Alert dispatched to consortium members: FreshKart QA, Ratnagiri Mango Orchards,
                    carrier TG-Logistics. Reference case #CF-2026-00341.
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={reset}
                    variant="outline"
                    className="h-10 flex-1 gap-2 border-tg-line text-foreground hover:bg-tg-panel-2"
                  >
                    <RotateCcw className="size-4" /> Scan again
                  </Button>
                  <Button className="h-10 flex-1 gap-2 bg-tg-red font-semibold text-white hover:bg-tg-red/85">
                    <ShieldAlert className="size-4" /> Report counterfeit
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
