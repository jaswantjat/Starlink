"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "dotlottie-wc": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        autoplay?: boolean | string;
        loop?: boolean | string;
        style?: React.CSSProperties;
      };
    }
  }
}

/* ─── types ─────────────────────────────────────────── */
type Grade = "pass" | "risk" | "fail";

interface VerificationRow {
  Estado?: { value: string } | string;
  Resultado?: { value: string } | string;
  "Puntuación Total"?: string | number;
  "Seguridad Aprobada"?: boolean | string;
  "Evidencia Faltante"?: string;
  "Puntuación: Ejecución"?: string | number;
  "Puntuación: Condición del Sitio"?: string | number;
  "Puntuación: Documentación"?: string | number;
  "Puntuación: Educación"?: string | number;
  "Resumen de IA"?: string;
}

/* ─── helpers ───────────────────────────────────────── */
function gradeOf(score: number, estado: string): Grade {
  if (estado.toUpperCase() !== "APROBADO") return "fail";
  return score >= 45 ? "pass" : "risk";
}

function str(v: { value: string } | string | undefined): string {
  if (!v) return "";
  return typeof v === "object" ? v.value : v;
}

/* ─── Background / Starfield ────────────────────────── */
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 1.5,
      speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random(),
      fadeSpeed: Math.random() * 0.015 + 0.005,
      fadeDir: Math.random() > 0.5 ? 1 : -1,
    }));

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      stars.forEach((star) => {
        star.opacity += star.fadeSpeed * star.fadeDir;
        if (star.opacity >= 1) {
          star.opacity = 1;
          star.fadeDir = -1;
        } else if (star.opacity <= 0.1) {
          star.opacity = 0.1;
          star.fadeDir = 1;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * 0.7})`;
        ctx.fill();

        star.y -= star.speed;
        if (star.y < 0) {
          star.y = h;
          star.x = Math.random() * w;
        }
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 mix-blend-screen opacity-50"
    />
  );
}

/* ─── confetti ──────────────────────────────────────── */
function runConfetti(canvas: HTMLCanvasElement) {
  canvas.style.display = "block";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d")!;
  const pal = ["#22c55e", "#3b82f6", "#f59e0b", "#a855f7", "#ffffff"];
  const bits = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -Math.random() * canvas.height * 0.4,
    r: Math.random() * 6 + 2,
    d: Math.random() * 3 + 1.5,
    c: pal[Math.floor(Math.random() * pal.length)],
    a: Math.random() * 360,
    s: (Math.random() - 0.5) * 8,
  }));
  let f = 0;
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bits.forEach((b) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate((b.a * Math.PI) / 180);
      ctx.fillStyle = b.c;
      ctx.fillRect(-b.r / 2, -b.r / 2, b.r, b.r * 2);
      ctx.restore();
      b.y += b.d;
      b.a += b.s;
      if (b.y > canvas.height) {
        b.y = -10;
        b.x = Math.random() * canvas.width;
      }
    });
    if (++f < 200) requestAnimationFrame(draw);
    else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = "none";
    }
  })();
}

/* ─── Animated Score ────────────────────────────────── */
function AnimatedScore({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1800;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * value));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <>{count}</>;
}

/* ─── Loading component ─────────────────────────────── */
const MESSAGES = [
  "Estableciendo enlace satelital...",
  "Sincronizando telemetría...",
  "Recibiendo datos de la instalación...",
  "Analizando coordenadas...",
  "Verificando integridad estructural...",
  "Evaluando fotografías...",
];

function LoadingState({ msgIdx }: { msgIdx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col items-center gap-12 py-10"
    >
      {/* Lottie Animation */}
      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280, marginBottom: -24 }}>
        <dotlottie-wc
          src="https://lottie.host/897a4194-1cc9-4e83-8185-b1b4540c951f/46f51OeLjq.lottie"
          style={{ width: "300px", height: "300px" }}
          autoplay
          loop
        />
      </div>

      <div className="text-center flex flex-col gap-3 h-20">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-lg md:text-xl font-medium tracking-wide text-white/90"
          >
            {MESSAGES[msgIdx % MESSAGES.length]}
          </motion.p>
        </AnimatePresence>
        <p className="text-xs text-blue-400/80 tracking-[0.2em] font-mono uppercase">
          Procesando...
        </p>
      </div>

      {/* Loading Bar */}
      <div className="w-full max-w-[200px] h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 w-1/3 rounded-full animate-[pulse-ring_1.5s_ease-in-out_infinite]" style={{ transformOrigin: 'left' }} />
      </div>
    </motion.div>
  );
}

/* ─── Result component ──────────────────────────────── */
function ResultState({
  row,
  editUrl,
  barReady,
}: {
  row: VerificationRow;
  editUrl: string | null;
  barReady: boolean;
}) {
  const estado = str(row.Estado);
  const res = str(row.Resultado);
  const score = Number(row["Puntuación Total"] ?? 0);
  const safety = row["Seguridad Aprobada"];
  const summary = row["Resumen de IA"] ?? "";
  const missing = (row["Evidencia Faltante"] ?? "").split("\n").filter(Boolean);
  const g = gradeOf(score, estado);

  const icons = {
    pass: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    ),
    risk: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    fail: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  const badges = { pass: "Aprobado", risk: "Revisión necesaria", fail: "Requiere correcciones" };
  const titles = {
    pass: "¡Instalación completada!",
    risk: "Instalación en revisión",
    fail: "Hay puntos que mejorar",
  };
  const subs = { pass: "Tu instalación cumple todos los estándares aeroespaciales.", risk: res, fail: res };

  const theme = {
    pass: {
      glow: "shadow-[0_0_50px_rgba(34,197,94,0.15)]",
      text: "text-green-400",
      bgBadge: "bg-green-500/10 border-green-500/20",
      bar: "bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_15px_#4ade80]",
      iconBg: "bg-green-500/10 border-green-500/30",
    },
    risk: {
      glow: "shadow-[0_0_50px_rgba(245,158,11,0.15)]",
      text: "text-amber-400",
      bgBadge: "bg-amber-500/10 border-amber-500/20",
      bar: "bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_15px_#fbbf24]",
      iconBg: "bg-amber-500/10 border-amber-500/30",
    },
    fail: {
      glow: "shadow-[0_0_50px_rgba(244,63,94,0.15)]",
      text: "text-rose-400",
      bgBadge: "bg-rose-500/10 border-rose-500/20",
      bar: "bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_#fb7185]",
      iconBg: "bg-rose-500/10 border-rose-500/30",
    },
  }[g];

  const safetyFail = safety === false || safety === "false";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col gap-6"
    >
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 py-2">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          className={`w-24 h-24 rounded-full flex items-center justify-center relative border ${theme.iconBg} ${theme.text} ${theme.glow}`}
        >
          <div className="absolute inset-[-6px] rounded-full border border-current opacity-20 animate-[pulse-ring_3s_ease-out_infinite]" />
          {icons[g]}
        </motion.div>

        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full border backdrop-blur-md ${theme.bgBadge} ${theme.text}`}
        >
          {badges[g]}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-center leading-tight tracking-tight text-white/95"
        >
          {titles[g]}
        </motion.h1>

        {subs[g] && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-white/50 text-center max-w-[85%]"
          >
            {subs[g]}
          </motion.p>
        )}
      </div>

      {/* Safety banner */}
      {safetyFail && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-rose-500/10 border border-rose-500/20 backdrop-blur-md rounded-2xl p-4 text-sm text-rose-200 leading-relaxed flex gap-3"
        >
          <div className="text-xl">⚠️</div>
          <div>
            <strong className="text-rose-400 font-semibold block mb-0.5">Atención Crítica</strong>
            Se detectó un problema de seguridad que debe subsanarse antes de la aprobación.
          </div>
        </motion.div>
      )}

      {/* Score card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-[24px] p-5 sm:p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid-white opacity-20 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              Índice de Rendimiento
            </span>
            <span className={`text-4xl font-light tracking-tighter ${theme.text}`}>
              <AnimatedScore value={score} />
              <span className="text-xl text-white/20 font-medium tracking-normal ml-1">/ 50</span>
            </span>
          </div>

          {/* bar */}
          <div className="h-2.5 bg-black/40 rounded-full overflow-hidden mb-6 border border-white/5 relative">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-[1500ms] ease-[cubic-bezier(.16,1,.3,1)] ${theme.bar}`}
              style={{ width: barReady ? `${(score / 50) * 100}%` : "0%" }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[scanline_2s_linear_infinite] opacity-50" />
            </div>
          </div>

          {/* sub grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Ejecución (/ 15)", row["Puntuación: Ejecución"]],
              ["Estado del sitio (/ 10)", row["Puntuación: Condición del Sitio"]],
              ["Documentación (/ 15)", row["Puntuación: Documentación"]],
              ["Formación al cliente (/ 10)", row["Puntuación: Educación"]],
            ].map(([label, val], idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                key={label as string}
                className="bg-black/20 border border-white/[0.03] rounded-2xl p-3 sm:p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="text-[9px] text-white/40 uppercase tracking-[0.1em] mb-1.5 leading-snug">
                  {label as string}
                </div>
                <div className="text-lg font-medium text-white/90">{val ?? "—"}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Missing evidence */}
      {missing.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-rose-500/5 border border-rose-500/10 backdrop-blur-md rounded-[24px] p-5 sm:p-6"
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-400 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Evidencia Faltante
          </div>
          <ul className="flex flex-col gap-3">
            {missing.map((m, i) => (
              <li key={i} className="text-sm text-rose-200/80 flex gap-3 leading-relaxed">
                <span className="text-rose-500/50 mt-0.5">•</span>
                {m}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Summary */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-[24px] p-5 sm:p-6"
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-3 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Análisis de Diagnóstico
          </div>
          <p className="text-[13px] sm:text-sm text-white/70 leading-relaxed whitespace-pre-line">
            {summary}
          </p>
        </motion.div>
      )}

      {/* CTA */}
      {g !== "pass" && editUrl && (
        <motion.a
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          href={editUrl}
          className="mt-2 group relative overflow-hidden flex items-center justify-center gap-2 w-full py-4 bg-white text-black text-[14px] font-bold uppercase tracking-[0.05em] rounded-2xl no-underline shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          Actualizar Documentación
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </motion.a>
      )}
    </motion.div>
  );
}

/* ─── Error component ───────────────────────────────── */
function ErrorState({ rowId }: { rowId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4 py-8 text-center"
    >
      <div className="w-16 h-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
        <svg className="w-8 h-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold tracking-tight text-white/90">Interferencia en la Señal</h2>
      <p className="text-sm text-white/50 leading-relaxed max-w-[280px]">
        No hemos podido enlazar con los datos. Si esto persiste, contacta al centro de control indicando tu ID.
      </p>
      {rowId && (
        <div className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-white/40 tracking-wider">
          ID: {rowId}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Main inner component ──────────────────────────── */
function VerificationInner() {
  const params = useSearchParams();
  const rowId = params.get("row_id") ?? "";
  const editUrlParam = params.get("edit_url") ?? null;

  type AppState = "loading" | "result" | "error";
  const [appState, setAppState] = useState<AppState>("loading");
  const [msgIdx, setMsgIdx] = useState(0);
  const [resultRow, setResultRow] = useState<VerificationRow | null>(null);
  const [editUrl, setEditUrl] = useState<string | null>(editUrlParam);
  const [barReady, setBarReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!rowId) {
      setAppState("error");
      return;
    }

    async function poll() {
      try {
        const res = await fetch(`/api/verification?row_id=${encodeURIComponent(rowId)}`);
        const data = await res.json();

        if (!data.found) {
          if (Date.now() - startRef.current > 90000) {
            clearInterval(pollRef.current!);
            clearInterval(msgRef.current!);
            setAppState("error");
          }
          return;
        }

        clearInterval(pollRef.current!);
        clearInterval(msgRef.current!);
        setResultRow(data.row);
        setEditUrl(editUrlParam ?? data.editUrl ?? null);
        
        // Slight delay for aesthetic transition
        setTimeout(() => {
          setAppState("result");
          setTimeout(() => setBarReady(true), 150);

          const estado = typeof data.row.Estado === "object" ? data.row.Estado?.value : data.row.Estado ?? "";
          const score = Number(data.row["Puntuación Total"] ?? 0);
          if (gradeOf(score, estado) === "pass" && canvasRef.current) {
            setTimeout(() => runConfetti(canvasRef.current!), 600);
          }
        }, 800);

      } catch (e) {
        console.warn("poll error:", e);
      }
    }

    poll();
    pollRef.current = setInterval(poll, 3000);
    msgRef.current = setInterval(() => setMsgIdx((i) => i + 1), 4000);

    return () => {
      clearInterval(pollRef.current!);
      clearInterval(msgRef.current!);
    };
  }, [rowId, editUrlParam]);

  return (
    <>
      <Starfield />

      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
        className="fixed inset-0 pointer-events-none z-[999]"
      />

      <div className="w-full max-w-[500px] flex flex-col items-center relative z-10 mx-auto">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full flex justify-center py-8 sm:py-12"
        >
          <img
            src="https://uploads.onecompiler.io/4454edy2w/4454ed8yh/Starlink-x-Eltex.png"
            alt="Starlink × Eltex"
            className="h-12 w-auto object-contain opacity-90"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </motion.header>

        {/* Main Card Wrapper */}
        <div className="w-full px-4 sm:px-0">
          <AnimatePresence mode="wait">
            {appState === "loading" && (
              <motion.div key="loading" exit={{ opacity: 0, scale: 0.95 }} className="w-full">
                <LoadingState msgIdx={msgIdx} />
              </motion.div>
            )}
            
            {appState === "result" && resultRow && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                <ResultState row={resultRow} editUrl={editUrl} barReady={barReady} />
              </motion.div>
            )}

            {appState === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                <ErrorState rowId={rowId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-[10px] uppercase tracking-[0.15em] text-white/30 text-center flex flex-col items-center gap-2"
        >
          <div className="w-8 h-[1px] bg-white/20" />
          Starlink × Eltex · Sistema de Verificación
        </motion.footer>
      </div>
    </>
  );
}

/* ─── Page ──────────────────────────────────────────── */
export default function Page() {
  return (
    <div
      className="min-h-[100dvh] flex flex-col selection:bg-blue-500/30 selection:text-white relative overflow-x-hidden"
      style={{
        background: "#050505",
        color: "#ffffff",
        fontFamily: "var(--font-inter, Inter, -apple-system, sans-serif)",
        WebkitFontSmoothing: "antialiased",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
      }}
    >
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-white/40">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500/50 border-t-blue-400 animate-spin" />
            <span className="text-xs uppercase tracking-[0.2em]">Iniciando...</span>
          </div>
        }
      >
        <VerificationInner />
      </Suspense>
    </div>
  );
}
