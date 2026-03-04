"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "dotlottie-wc": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        autoplay?: boolean | string;
        loop?: boolean | string;
        style?: React.CSSProperties;
      };
    }
  }
}

/* ─── types ────────────────────────────────────────────── */
type Grade = "pass" | "risk" | "fail";

interface VerificationRow {
  Estado?: { value: string } | string;
  "Puntuación Total"?: string | number;
  "Seguridad Aprobada"?: boolean | string;
  "Evidencia Faltante"?: string;
  "Puntuación: Ejecución"?: string | number;
  "Puntuación: Condición del Sitio"?: string | number;
  "Puntuación: Documentación"?: string | number;
  "Puntuación: Educación"?: string | number;
  "Resumen IA"?: string;
}

/* ─── demo data ─────────────────────────────────────────── */
const DEMO_PASS: VerificationRow = {
  Estado: "APROBADO",
  "Puntuación Total": 47,
  "Seguridad Aprobada": true,
  "Evidencia Faltante": "",
  "Puntuación: Ejecución": 14,
  "Puntuación: Condición del Sitio": 9,
  "Puntuación: Documentación": 14,
  "Puntuación: Educación": 10,
};

const DEMO_FAIL: VerificationRow = {
  Estado: "RECHAZADO",
  "Puntuación Total": 30,
  "Seguridad Aprobada": true,
  "Evidencia Faltante": "Captura de pantalla visible del Test de Velocidad\nCaptura de pantalla visible del Visor de Obstrucciones",
  "Puntuación: Ejecución": 10,
  "Puntuación: Condición del Sitio": 5,
  "Puntuación: Documentación": 10,
  "Puntuación: Educación": 5,
  "Resumen IA": "La documentación técnica es insuficiente. ACCIONES REQUERIDAS: 1. Realiza capturas de pantalla legibles de la app Starlink mostrando el estado 'Online' y el test de velocidad (mínimo 100 Mbps). 2. Toma una captura del Visor de Obstrucciones sin zonas rojas. 3. Organiza el área del router y fotografía la instalación interior limpia. 4. Sube las nuevas evidencias al portal.",
};

/* ─── helpers ───────────────────────────────────────────── */
function gradeOf(score: number, estado: string): Grade {
  if (estado.toUpperCase() !== "APROBADO") return "fail";
  return score >= 45 ? "pass" : "risk";
}

function str(v: { value: string } | string | undefined): string {
  if (!v) return "";
  return typeof v === "object" ? v.value : v;
}

/* ─── animated counter ──────────────────────────────────── */
function AnimatedScore({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 1600;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(ease * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{count}</>;
}

/* ─── loading messages ──────────────────────────────────── */
// Each entry: [message, show after N seconds]
const TIMED_MESSAGES: [string, number][] = [
  ["Conectando con el servidor...",          0],
  ["Recibiendo datos de la instalación...", 4],
  ["Analizando fotografías subidas...",      9],
  ["Verificando criterios de seguridad...", 14],
  ["Calculando puntuación final...",        19],
  ["Casi listo, finalizando reporte...",    24],
  ["Completando verificación...",           29],
];

/* ─── theme map ─────────────────────────────────────────── */
const THEME = {
  pass: {
    color: "#4ade80",
    label: "Aprobado",
    title: "Instalación aprobada",
    barClass: "from-green-600 to-green-400",
    badgeBg: "bg-green-500/10 border-green-500/20",
    textClass: "text-green-400",
  },
  risk: {
    color: "#fbbf24",
    label: "En revisión",
    title: "Requiere revisión",
    barClass: "from-amber-600 to-amber-400",
    badgeBg: "bg-amber-500/10 border-amber-500/20",
    textClass: "text-amber-400",
  },
  fail: {
    color: "#f87171",
    label: "No aprobado",
    title: "Requiere correcciones",
    barClass: "from-red-700 to-red-400",
    badgeBg: "bg-red-500/10 border-red-500/20",
    textClass: "text-red-400",
  },
};

/* ─── loading view ──────────────────────────────────────── */
function LoadingView({ elapsed }: { elapsed: number }) {
  // pick the highest threshold that has passed
  const msg = [...TIMED_MESSAGES]
    .reverse()
    .find(([, t]) => elapsed >= t)?.[0] ?? TIMED_MESSAGES[0][0];

  // which step index are we on (for the dots)
  const stepIdx = TIMED_MESSAGES.filter(([, t]) => elapsed >= t).length - 1;

  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-8 py-12"
    >
      {/* lottie */}
      <div className="w-44 h-44">
        <dotlottie-wc
          src="https://lottie.host/897a4194-1cc9-4e83-8185-b1b4540c951f/46f51OeLjq.lottie"
          autoplay="true"
          loop="true"
          style={{ width: "176px", height: "176px", display: "block" }}
        />
      </div>

      {/* message */}
      <div className="flex flex-col items-center gap-2">
        <div className="h-5 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={msg}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="text-sm text-white/55 text-center"
            >
              {msg}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* reassurance after 15s */}
        <AnimatePresence>
          {elapsed >= 15 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-white/25 text-center"
            >
              Esto puede tardar hasta 30 s — por favor no cierres la página
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* step dots */}
      <div className="flex gap-1.5 items-center">
        {TIMED_MESSAGES.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width: i === stepIdx ? 16 : 4,
              height: 4,
              backgroundColor: i <= stepIdx ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ─── fix steps: parse AI summary ACCIONES REQUERIDAS ───── */
function buildFixSteps(
  g: Grade,
  safetyFail: boolean,
  missing: string[],
  subScores: { label: string; val: number; max: number }[],
  aiSummary?: string
): string[] {
  // 1. Try to extract numbered steps from AI summary
  if (aiSummary) {
    const accionesMatch = aiSummary.match(/ACCIONES REQUERIDAS[:\s]*([\s\S]*)/i);
    if (accionesMatch) {
      const raw = accionesMatch[1];
      // Match "1. ...", "2. ...", etc.
      const parsed = [...raw.matchAll(/\d+\.\s+([^\d]+?)(?=\d+\.|$)/g)]
        .map((m) => m[1].replace(/\n/g, " ").trim())
        .filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
  }

  // 2. Fallback: build from structured fields
  const steps: string[] = [];
  if (safetyFail) steps.push("Corrige el problema de seguridad detectado antes de continuar.");
  missing.forEach((m) => steps.push(`Sube la evidencia faltante: ${m}`));
  subScores.forEach(({ label, val, max }) => {
    if (val / max < 0.6) {
      const hints: Record<string, string> = {
        Ejecución: "Revisa el montaje del plato y el ángulo de orientación.",
        Sitio: "Documenta las condiciones del sitio con fotos claras.",
        Documentación: "Añade fotos de cada etapa: plato, cableado y router.",
        Formación: "Registra la demostración de uso al cliente con evidencia.",
      };
      if (hints[label]) steps.push(hints[label]);
    }
  });
  if (g === "risk" && steps.length === 0) {
    steps.push("Completa la documentación fotográfica de la instalación.");
    steps.push("Asegúrate de que todas las secciones superen el 60 % de puntuación.");
  }
  return steps;
}

/* ─── result view ───────────────────────────────────────── */
function ResultView({
  row,
  editUrl,
  barReady,
  isDemo,
}: {
  row: VerificationRow;
  editUrl: string | null;
  barReady: boolean;
  isDemo: boolean;
}) {
  const estado = str(row.Estado);
  const score = Number(row["Puntuación Total"] ?? 0);
  const safety = row["Seguridad Aprobada"];
  const missing = (row["Evidencia Faltante"] ?? "").split("\n").filter(Boolean);
  const g = gradeOf(score, estado);
  const t = THEME[g];
  const safetyFail = safety === false || safety === "false";

  const subScores = [
    { label: "Ejecución",     val: Number(row["Puntuación: Ejecución"] ?? 0),           max: 15 },
    { label: "Sitio",         val: Number(row["Puntuación: Condición del Sitio"] ?? 0), max: 10 },
    { label: "Documentación", val: Number(row["Puntuación: Documentación"] ?? 0),       max: 15 },
    { label: "Formación",     val: Number(row["Puntuación: Educación"] ?? 0),           max: 10 },
  ];

  const aiSummary = row["Resumen IA"] ?? "";
  const fixSteps = g !== "pass" ? buildFixSteps(g, safetyFail, missing, subScores, aiSummary) : [];

  const GradeIcon =
    g === "pass" ? (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ) : g === "risk" ? (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ) : (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4 pb-4"
    >
      {/* Demo badge */}
      {isDemo && (
        <div className="flex justify-center">
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/20 font-mono">
            — datos de ejemplo —
          </span>
        </div>
      )}

      {/* Hero */}
      <div className="flex flex-col items-center gap-3 py-2">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.05 }}
          className="w-16 h-16 rounded-full flex items-center justify-center border"
          style={{
            borderColor: `${t.color}25`,
            backgroundColor: `${t.color}0a`,
            color: t.color,
          }}
        >
          {GradeIcon}
        </motion.div>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className={`text-[10px] font-semibold tracking-[0.2em] uppercase px-3 py-1 rounded-full border ${t.badgeBg} ${t.textClass}`}
        >
          {t.label}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="text-xl font-semibold text-white text-center tracking-tight"
        >
          {t.title}
        </motion.h1>
      </div>

      {/* Score card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
      >
        <div className="flex items-end justify-between mb-3">
          <span className="text-xs text-white/30 uppercase tracking-wider">Puntuación total</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-light tabular-nums ${t.textClass}`}>
              <AnimatedScore value={score} />
            </span>
            <span className="text-sm text-white/20">/ 50</span>
          </div>
        </div>

        <div className="h-1 bg-white/6 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all duration-[1400ms] ease-out ${t.barClass}`}
            style={{ width: barReady ? `${(score / 50) * 100}%` : "0%" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {subScores.map(({ label, val, max }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="bg-white/[0.025] rounded-xl p-3 border border-white/[0.04]"
            >
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{label}</div>
              <div className="flex items-baseline gap-1">
                <span className={`text-lg font-medium ${t.textClass}`}>{val}</span>
                <span className="text-xs text-white/20">/ {max}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Fix steps — only shown when not passing */}
      {fixSteps.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"
        >
          <div className="text-xs text-white/30 uppercase tracking-wider mb-3">Pasos para aprobar</div>
          <ol className="flex flex-col gap-3">
            {fixSteps.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span
                  className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-semibold mt-0.5"
                  style={{ borderColor: `${t.color}30`, color: t.color }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-white/55 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </motion.div>
      )}

      {/* CTA */}
      {g !== "pass" && editUrl && (
        <motion.a
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          href={editUrl}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-white text-black text-sm font-semibold rounded-2xl no-underline active:scale-[0.98] transition-transform"
        >
          Actualizar documentación
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </motion.a>
      )}
    </motion.div>
  );
}

/* ─── error view ────────────────────────────────────────── */
function ErrorView({ rowId }: { rowId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <div className="w-16 h-16 rounded-full border border-white/8 bg-white/[0.03] flex items-center justify-center text-white/30">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white/80 mb-1">No se encontraron datos</h2>
        <p className="text-sm text-white/35 max-w-[260px] leading-relaxed">
          Verifica que el enlace sea correcto o contacta al soporte.
        </p>
      </div>
      {rowId && (
        <span className="text-xs font-mono text-white/25 border border-white/8 rounded-full px-4 py-1.5">
          ID: {rowId}
        </span>
      )}
    </motion.div>
  );
}



/* ─── main ──────────────────────────────────────────────── */
function VerificationInner() {
  const params = useSearchParams();
  const rowId = params.get("row_id") ?? "";
  const editUrlParam = params.get("edit_url") ?? null;
  const demoMode = params.get("demo") ?? "pass"; // "pass" | "fail"
  const isDemo = !rowId;

  type AppState = "loading" | "result" | "error";
  const [appState, setAppState] = useState<AppState>("loading");
  const [elapsed, setElapsed] = useState(0);
  const [resultRow, setResultRow] = useState<VerificationRow | null>(null);
  const [editUrl, setEditUrl] = useState<string | null>(editUrlParam);
  const [barReady, setBarReady] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

    if (isDemo) {
      const demoRow = demoMode === "fail" ? DEMO_FAIL : DEMO_PASS;
        const t = setTimeout(() => {
          clearInterval(tickRef.current!);
          setResultRow(demoRow);
          setTimeout(() => {
            setAppState("result");
            setTimeout(() => setBarReady(true), 100);
          }, 400);
        }, 3200);
      return () => { clearTimeout(t); clearInterval(tickRef.current!); };
    }

    async function poll() {
      try {
        const res = await fetch(`/api/verification?row_id=${encodeURIComponent(rowId)}`);
        const data = await res.json();
        if (!data.found) {
          if (Date.now() - startRef.current > 90000) {
              clearInterval(pollRef.current!);
              clearInterval(tickRef.current!);
              setAppState("error");
            }
            return;
          }
          clearInterval(pollRef.current!);
          clearInterval(tickRef.current!);
        setResultRow(data.row);
        setEditUrl(editUrlParam ?? data.editUrl ?? null);
          setTimeout(() => {
            setAppState("result");
            setTimeout(() => setBarReady(true), 100);
          }, 600);
      } catch (e) {
        console.warn("poll error:", e);
      }
    }

    poll();
    pollRef.current = setInterval(poll, 3000);
      return () => { clearInterval(pollRef.current!); clearInterval(tickRef.current!); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col min-h-[100dvh]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex justify-center pt-10 pb-6 shrink-0"
      >
        <img
          src="https://uploads.onecompiler.io/4454edy2w/4454ed8yh/Starlink-x-Eltex.png"
          alt="Starlink × Eltex"
          className="h-9 w-auto object-contain opacity-80"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      </motion.header>

      {/* Content */}
      <div className="flex-1 px-4">
        <AnimatePresence mode="wait">
            {appState === "loading" && <LoadingView key="loading" elapsed={elapsed} />}
          {appState === "result" && resultRow && (
            <ResultView key="result" row={resultRow} editUrl={editUrl} barReady={barReady} isDemo={isDemo} />
          )}
          {appState === "error" && <ErrorView key="error" rowId={rowId} />}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 shrink-0">
        <span className="text-[10px] uppercase tracking-[0.16em] text-white/15">
          Starlink × Eltex · Verificación
        </span>
      </footer>

      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
        className="fixed inset-0 pointer-events-none z-50"
      />
    </div>
  );
}

export default function Page() {
  return (
    <div
      className="min-h-[100dvh] selection:bg-blue-500/20"
      style={{
        background: "#080c14",
        color: "#ffffff",
        fontFamily: "var(--font-inter, Inter, -apple-system, sans-serif)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[100dvh]">
            <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
          </div>
        }
      >
        <VerificationInner />
      </Suspense>
    </div>
  );
}
