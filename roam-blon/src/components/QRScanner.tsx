"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  QrCode,
  ChevronLeft,
  SwitchCamera,
  Flashlight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

/* ── Status types ─────────────────────────────────────────────────────── */
type ScanStatus = "idle" | "scanning" | "success" | "error";

/* ── Tiny corner-frame SVG overlay ───────────────────────────────────── */
function ScanFrame() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      {/* Dark vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.65) 70%)",
        }}
      />

      {/* Scan box */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72">
        {/* Animated scan line */}
        <div
          className="absolute left-4 right-4 h-0.5 bg-rose-500 rounded-full shadow-[0_0_12px_rgba(225,29,72,0.9)]"
          style={{ animation: "scanline 2s ease-in-out infinite" }}
        />

        {/* Corner brackets */}
        {(["tl", "tr", "bl", "br"] as const).map((corner) => (
          <div
            key={corner}
            className="absolute w-10 h-10"
            style={{
              top: corner.startsWith("t") ? 0 : "auto",
              bottom: corner.startsWith("b") ? 0 : "auto",
              left: corner.endsWith("l") ? 0 : "auto",
              right: corner.endsWith("r") ? 0 : "auto",
              borderTop: corner.startsWith("t")
                ? "3px solid #e11d48"
                : "none",
              borderBottom: corner.startsWith("b")
                ? "3px solid #e11d48"
                : "none",
              borderLeft: corner.endsWith("l")
                ? "3px solid #e11d48"
                : "none",
              borderRight: corner.endsWith("r")
                ? "3px solid #e11d48"
                : "none",
              borderRadius: corner === "tl"
                ? "8px 0 0 0"
                : corner === "tr"
                ? "0 8px 0 0"
                : corner === "bl"
                ? "0 0 0 8px"
                : "0 0 8px 0",
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes scanline {
          0%   { top: 16px; opacity: 1; }
          50%  { top: calc(100% - 16px); opacity: 1; }
          100% { top: 16px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── Main Scanner ─────────────────────────────────────────────────────── */
export default function QRScanner() {
  const router = useRouter();
  const scannerRef = useRef<any>(null);
  const mountedRef = useRef(false);

  const [status, setStatus] = useState<ScanStatus>("idle");
  const [scannedUrl, setScannedUrl] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [cameraStarted, setCameraStarted] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );

  /* ── Clean up scanner on unmount ───────────────────────────────────── */
  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState?.();
        // State 2 = SCANNING, State 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear?.();
        scannerRef.current = null;
      }
    } catch {
      // ignore cleanup errors
    }
  }, []);

  /* ── Start scanning ────────────────────────────────────────────────── */
  const startScanner = useCallback(
    async (facing: "environment" | "user") => {
      await stopScanner();
      setStatus("idle");
      setErrMsg("");

      try {
        // 1. Request camera permission via navigator.mediaDevices if available
        if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
          try {
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
            tempStream.getTracks().forEach(track => track.stop());
          } catch (permErr: any) {
            const errName = permErr?.name || "";
            const errMessage = permErr?.message || "";
            if (errName === "NotAllowedError" || /permission|denied/i.test(errMessage)) {
              throw new Error("Camera permission denied. Please allow camera access in browser settings.");
            } else if (errName === "NotFoundError" || /not found|no camera/i.test(errMessage)) {
              throw new Error("No camera device found on this system.");
            } else if (errName === "NotReadableError" || /in use|already/i.test(errMessage)) {
              throw new Error("Camera is in use by another application. Please close other camera apps.");
            }
          }
        }

        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import("html5-qrcode");

        const el = document.getElementById("qr-reader");
        if (!el) return;

        const scanner = new Html5Qrcode("qr-reader", { verbose: false });
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        };

        const onScanSuccess = (decodedText: string) => {
          handleScanSuccess(decodedText);
        };
        const onScanFailure = () => {};

        // 2. Get list of available cameras
        let selectedDeviceId: string | null = null;
        try {
          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            if (facing === "environment") {
              const backCam = cameras.find(c => /back|rear|environment/i.test(c.label));
              selectedDeviceId = backCam ? backCam.id : cameras[cameras.length - 1].id;
            } else {
              const frontCam = cameras.find(c => /front|user/i.test(c.label));
              selectedDeviceId = frontCam ? frontCam.id : cameras[0].id;
            }
          }
        } catch (camErr) {
          console.warn("Could not list cameras via getCameras, falling back to facingMode constraint", camErr);
        }

        // 3. Start scanning with deviceId or facingMode constraint
        if (selectedDeviceId) {
          await scanner.start(selectedDeviceId, config, onScanSuccess, onScanFailure);
        } else {
          await scanner.start({ facingMode: facing }, config, onScanSuccess, onScanFailure);
        }

        setCameraStarted(true);
        setStatus("scanning");
      } catch (err: any) {
        console.error("Camera scanner error:", err);
        const msg = err?.message || "Could not start camera. Please try again.";
        setErrMsg(msg);
        setStatus("error");
        setCameraStarted(false);
      }
    },
    [stopScanner]
  );

  /* ── Boot camera on mount ──────────────────────────────────────────── */
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    startScanner(facingMode);
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, []);

  /* ── Flip camera ───────────────────────────────────────────────────── */
  const flipCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    setCameraStarted(false);
    setStatus("idle");
    await startScanner(next);
  };

  /* ── Handle successful scan ────────────────────────────────────────── */
  const handleScanSuccess = async (raw: string) => {
    await stopScanner();
    setScannedUrl(raw);
    setStatus("success");

    // If it's a relative or absolute URL, navigate to it
    setTimeout(() => {
      try {
        const url = new URL(raw);
        // Same origin → use router
        if (url.origin === window.location.origin) {
          router.push(url.pathname + url.search);
        } else {
          window.location.href = raw;
        }
      } catch {
        // Not a URL — treat as a relative path if it starts with /
        if (raw.startsWith("/")) {
          router.push(raw);
        } else {
          setErrMsg(`Scanned: "${raw}" — not a valid URL.`);
          setStatus("error");
        }
      }
    }, 800);
  };

  /* ── Retry ─────────────────────────────────────────────────────────── */
  const retry = () => {
    setStatus("idle");
    setErrMsg("");
    setScannedUrl("");
    startScanner(facingMode);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#0d1117]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <a
          href="/"
          className="flex items-center gap-1.5 text-white/60 hover:text-rose-400 transition-colors"
        >
          <ChevronLeft size={20} />
        </a>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 bg-rose-600 rounded-lg flex items-center justify-center">
            <QrCode size={14} className="text-white" />
          </div>
          <span className="font-black text-white text-sm uppercase tracking-wider">
            ROAM-BLON · Scanner
          </span>
        </div>
        {cameraStarted && (
          <button
            onClick={flipCamera}
            className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
            title="Flip camera"
          >
            <SwitchCamera size={16} />
          </button>
        )}
      </header>

      {/* ── Camera viewport ── */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-6 pb-8 gap-6">

        {/* Title */}
        <div className="text-center">
          <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.25em] mb-1">
            Point camera at a QR Code
          </p>
          <h1 className="text-2xl font-black tracking-tighter uppercase">
            QR Scanner
          </h1>
        </div>

        {/* Camera box */}
        <div className="relative w-full max-w-sm">
          {/* html5-qrcode renders into this div */}
          <div
            id="qr-reader"
            className="w-full rounded-3xl overflow-hidden bg-black border-2 border-white/10 shadow-2xl"
            style={{ minHeight: 300 }}
          />

          {/* Overlay frame — only show while scanning */}
          {status === "scanning" && <ScanFrame />}

          {/* Success overlay */}
          {status === "success" && (
            <div className="absolute inset-0 bg-emerald-900/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-3 animate-in zoom-in duration-300">
              <CheckCircle2 size={56} className="text-emerald-400" />
              <p className="font-black text-white text-lg">QR Scanned!</p>
              <p className="text-emerald-300 text-sm font-bold text-center px-4 break-all max-w-[260px]">
                Redirecting…
              </p>
            </div>
          )}

          {/* Error overlay */}
          {status === "error" && (
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-4 px-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-rose-900/50 rounded-2xl flex items-center justify-center">
                <AlertCircle size={36} className="text-rose-400" />
              </div>
              <p className="font-black text-white text-base text-center">
                Scanner Error
              </p>
              <p className="text-white/60 text-sm font-medium text-center leading-relaxed">
                {errMsg}
              </p>
              <button
                onClick={retry}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-3 rounded-xl text-sm uppercase tracking-widest transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Idle / loading overlay */}
          {status === "idle" && (
            <div className="absolute inset-0 bg-slate-900/80 rounded-3xl flex flex-col items-center justify-center gap-3">
              <Loader2 size={36} className="text-rose-400 animate-spin" />
              <p className="text-white/60 text-sm font-bold">
                Starting camera…
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        {status === "scanning" && (
          <div className="text-center space-y-1 animate-in fade-in duration-500">
            <p className="text-white/50 text-sm font-bold">
              Hold steady — auto-detects QR codes
            </p>
            <p className="text-white/30 text-xs font-medium">
              Works with ROAM-BLON destination & dining QR codes
            </p>
          </div>
        )}

        {/* Tips */}
        {status === "scanning" && (
          <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">
              Tips for best results
            </p>
            {[
              "Ensure good lighting on the QR code",
              "Hold device 15–30 cm from QR code",
              "Keep camera steady while scanning",
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                <span className="text-white/60 text-xs font-medium">{tip}</span>
              </div>
            ))}
          </div>
        )}

        {/* Scanned result (non-URL) */}
        {status === "error" && scannedUrl && (
          <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
              Scanned Content
            </p>
            <p className="text-white/80 text-sm font-bold break-all">
              {scannedUrl}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
