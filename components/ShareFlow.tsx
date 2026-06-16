"use client";
// components/ShareFlow/index.tsx
// Full-screen overlay share flow — no page navigation, no flash.
// Opens instantly over the homepage. URL updates silently for shareability.
// Closes by pressing Escape or the X button, returns to homepage state.

import { useEffect, useRef, useState } from "react";
import { assistWriting, AssistMode } from "../lib/ai";
import { SHARE_TYPES } from "../lib/categories";
import { getQuestions } from "../lib/questions";
import { AnnieUser } from "../lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "who" | "q1" | "q2" | "q3" | "write" | "signin";

type Answers = {
  whoKey:     string;
  witnessed:  string | null;
  truthful:   string | null;
  identity:   string | null;
  chosenName: string;
};

type Draft = {
  answers: Answers;
  title:   string;
  body:    string;
  pullQuote: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wordCount(t: string) {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

const FREE_DAILY_ASSIST  = 3;
const FREE_IMAGES_MAX    = 2;
const PLUS_IMAGES_MAX    = 10;
const FREE_WORDS_SOFT    = 99999; // no word limit — see product decision
const DRAFT_KEY          = "annie_draft";

function saveDraftLocally(draft: Draft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
}

function loadDraftLocally(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, skipQ1 }: { step: Step; skipQ1: boolean }) {
  const all: Step[]     = ["who", "q1", "q2", "q3", "write"];
  const reduced: Step[] = ["who", "q2", "q3", "write"];
  const steps = skipQ1 ? reduced : all;
  const idx   = steps.indexOf(step);
  const pct   = idx < 0 ? 100 : Math.round(((idx + 1) / steps.length) * 100);
  return (
    <div style={{ height: "2px", background: "rgba(255,255,255,0.08)", width: "100%", flexShrink: 0 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "var(--permanent-gold)", transition: "width 0.35s ease" }} />
    </div>
  );
}

// ─── Question screen ──────────────────────────────────────────────────────────

function QuestionScreen({
  question, sub, options, onAnswer, onBack, step, skipQ1,
}: {
  question: string; sub: string;
  options: { key: string; label: string; note?: string }[];
  onAnswer: (key: string) => void;
  onBack: () => void;
  step: Step; skipQ1: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ProgressBar step={step} skipQ1={skipQ1} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px", overflowY: "auto" }}>
        <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 5vw, 34px)", fontWeight: 300, color: "var(--permanent-parchment)", lineHeight: 1.2, marginBottom: "10px" }}>
            {question}
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.45)", marginBottom: "32px", lineHeight: 1.6 }}>
            {sub}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => onAnswer(opt.key)}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", padding: "16px 20px", cursor: "pointer", textAlign: "left", transition: "border-color 0.2s, background 0.2s" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--permanent-gold)"; el.style.background = "rgba(191,155,78,0.08)"; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.12)"; el.style.background = "rgba(255,255,255,0.05)"; }}
              >
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 600, color: "var(--permanent-parchment)", marginBottom: opt.note ? "4px" : "0" }}>{opt.label}</p>
                {opt.note && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(246,241,234,0.4)" }}>{opt.note}</p>}
              </button>
            ))}
          </div>
          <button onClick={onBack} style={{ marginTop: "24px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(246,241,234,0.3)" }}>
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sign-in gate ─────────────────────────────────────────────────────────────

function SignInGate({ onSignIn, onBack }: { onSignIn: () => void; onBack: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ maxWidth: "400px", width: "100%" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(191,155,78,0.12)", border: "1px solid var(--permanent-gold)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 300, color: "var(--permanent-parchment)", marginBottom: "10px" }}>
          Your experience is ready.
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.5)", marginBottom: "8px", lineHeight: 1.6 }}>
          Sign in to publish it. Your writing is saved and will be here when you come back.
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.3)", marginBottom: "32px" }}>
          No account yet? Signing in with Google creates one instantly.
        </p>
        <button
          onClick={onSignIn}
          style={{ width: "100%", background: "var(--permanent-gold)", border: "none", borderRadius: "10px", padding: "15px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 600, color: "white", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(246,241,234,0.3)" }}>
          Go back to editing
        </button>
      </div>
    </div>
  );
}

// ─── Main ShareFlow ───────────────────────────────────────────────────────────

type Props = {
  open:      boolean;
  user:      AnnieUser | null;
  onClose:   () => void;
  onSignIn:  () => void;
  initialType?: string;
};

export default function ShareFlow({ open, user, onClose, onSignIn, initialType }: Props) {
  const [step, setStep]       = useState<Step>(initialType ? "q1" : "who");
  const [answers, setAnswers] = useState<Answers>({
    whoKey: initialType || "", witnessed: null, truthful: null, identity: null, chosenName: "",
  });
  const [title, setTitle]         = useState("");
  const [body, setBody]           = useState("");
  const [pullQuote, setPullQuote] = useState("");
  const [assistOpen, setAssistOpen]       = useState(false);
  const [assistLoading, setAssistLoading] = useState(false);
  const [assistMode, setAssistMode]       = useState<AssistMode>("improve");
  const [assistResult, setAssistResult]   = useState("");
  const [assistUsedToday, setAssistUsedToday] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [editorDark, setEditorDark] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Load local draft on open
  useEffect(() => {
    if (!open) return;
    const draft = loadDraftLocally();
    if (draft && !title && !body) {
      setAnswers(draft.answers);
      setTitle(draft.title);
      setBody(draft.body);
      setPullQuote(draft.pullQuote);
      if (draft.answers.whoKey) {
        setStep("write");
      }
    }
  }, [open]);

  // Auto-save draft every 10s while writing
  useEffect(() => {
    if (step !== "write") return;
    const id = setInterval(() => {
      saveDraftLocally({ answers, title, body, pullQuote });
    }, 10000);
    return () => clearInterval(id);
  }, [step, answers, title, body, pullQuote]);

  // Update URL silently
  useEffect(() => {
    if (!open) return;
    const url = step === "write" || step === "signin"
      ? `/share${answers.whoKey ? `?type=${answers.whoKey}` : ""}`
      : "/";
    window.history.replaceState(null, "", url);
    return () => { if (open) window.history.replaceState(null, "", "/"); };
  }, [open, step, answers.whoKey]);

  // Escape key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.documentElement.style.overflow  = open ? "hidden" : "";
    document.documentElement.style.position  = open ? "fixed"  : "";
    document.documentElement.style.width     = open ? "100%"   : "";
    return () => {
      document.documentElement.style.overflow = "";
      document.documentElement.style.position = "";
      document.documentElement.style.width    = "";
    };
  }, [open]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = bodyRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, [body]);

  const answer = (field: keyof Answers, value: string) =>
    setAnswers((a) => ({ ...a, [field]: value }));

  const qs     = getQuestions(answers.whoKey);
  const skipQ1 = qs.skipQ1 ?? false;

  const goBack = () => {
    if (step === "who")    return handleClose();
    if (step === "q1")     return setStep("who");
    if (step === "q2")     return setStep(skipQ1 ? "who" : "q1");
    if (step === "q3")     return setStep("q2");
    if (step === "write")  return setStep("q3");
    if (step === "signin") return setStep("write");
  };

  const handleClose = () => {
    saveDraftLocally({ answers, title, body, pullQuote });
    onClose();
  };

  const handleAssist = async () => {
    if (!body.trim() || assistLoading) return;
    if (!user && assistUsedToday >= FREE_DAILY_ASSIST) return;
    setAssistLoading(true);
    setAssistResult("");
    const result = await assistWriting(body, assistMode);
    setAssistResult(result);
    setAssistUsedToday((n) => n + 1);
    setAssistLoading(false);
  };

  const applyAssist = () => { setBody(assistResult); setAssistResult(""); setAssistOpen(false); };

  const handlePublish = () => {
    if (!user) { setStep("signin"); return; }
    setPublishing(true);
    // TODO: save to Supabase in next sprint
  };

  const canPublish    = title.trim().length > 0 && wordCount(body) >= 50;
  const assistsLeft   = Math.max(0, FREE_DAILY_ASSIST - assistUsedToday);
  const isPlus        = false; // TODO: read from user profile
  const whoLabel      = SHARE_TYPES.find((t) => t.key === answers.whoKey)?.label || "";

  // Editor theme tokens — light by default, dark on toggle
  const ed = {
    bg:           editorDark ? "#0f0e0c"                : "#faf9f7",
    border:       editorDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    titleColor:   editorDark ? "#f6f1ea"                : "#1a1814",
    bodyColor:    editorDark ? "rgba(246,241,234,0.85)" : "#2c2820",
    metaColor:    editorDark ? "rgba(246,241,234,0.3)"  : "rgba(44,40,32,0.4)",
    mutedBorder:  editorDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    assistBg:     editorDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    assistBorder: editorDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    assistText:   editorDark ? "rgba(246,241,234,0.45)" : "rgba(44,40,32,0.5)",
    chipBorder:   editorDark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.1)",
    chipColor:    editorDark ? "rgba(246,241,234,0.4)"  : "rgba(44,40,32,0.45)",
    resultBg:     editorDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
    resultBorder: editorDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
    resultText:   editorDark ? "rgba(246,241,234,0.8)"  : "#2c2820",
    keepBtn:      editorDark ? "rgba(246,241,234,0.5)"  : "rgba(44,40,32,0.4)",
    keepBorder:   editorDark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.1)",
    pullBg:       editorDark ? "rgba(255,255,255,0.03)" : "rgba(191,155,78,0.04)",
    pullBorder:   editorDark ? "rgba(255,255,255,0.07)" : "rgba(191,155,78,0.2)",
    pullText:     editorDark ? "rgba(246,241,234,0.7)"  : "#2c2820",
    barBg:        editorDark ? "#0f0e0c"                : "#faf9f7",
    barBorder:    editorDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    saveColor:    editorDark ? "rgba(246,241,234,0.4)"  : "rgba(44,40,32,0.4)",
    saveBorder:   editorDark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.12)",
    iconStroke:   editorDark ? "rgba(246,241,234,0.4)"  : "rgba(44,40,32,0.35)",
    tagBg:        editorDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    tagBorder:    editorDark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.1)",
    tagText:      editorDark ? "rgba(246,241,234,0.4)"  : "rgba(44,40,32,0.45)",
    wordOk:       editorDark ? "rgba(246,241,234,0.25)" : "rgba(44,40,32,0.3)",
    wordWarn:     "rgba(191,155,78,0.7)",
    toggleStroke: editorDark ? "rgba(246,241,234,0.5)"  : "rgba(44,40,32,0.4)",
  };

  if (!open) return null;

  return (
    <div style={{
      position:   "fixed",
      inset:      0,
      zIndex:     500,
      background: "var(--permanent-ink)",
      display:    "flex",
      flexDirection: "column",
      // Slide up from bottom
      animation:  "shareFlowIn 0.28s cubic-bezier(0.4,0,0.2,1)",
    }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "56px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 600, color: "var(--permanent-parchment)" }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </span>
        <button onClick={handleClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", lineHeight: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(246,241,234,0.5)" strokeWidth="1.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* WHO */}
        {step === "who" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "40px 24px" }}>
            <ProgressBar step="who" skipQ1={false} />
            <div style={{ maxWidth: "560px", margin: "32px auto 0" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 300, color: "var(--permanent-parchment)", marginBottom: "8px" }}>
                Who is sharing?
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.45)", marginBottom: "28px" }}>
                No credentials required.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {SHARE_TYPES.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => {
                      answer("whoKey", type.key);
                      const nextQs = getQuestions(type.key);
                      setStep(nextQs.skipQ1 ? "q2" : "q1");
                    }}
                    style={{ border: `1px solid ${answers.whoKey === type.key ? "var(--permanent-gold)" : "rgba(255,255,255,0.1)"}`, borderRadius: "10px", padding: "14px 16px", cursor: "pointer", background: answers.whoKey === type.key ? "rgba(191,155,78,0.12)" : "rgba(255,255,255,0.04)", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 500, color: answers.whoKey === type.key ? "var(--permanent-gold)" : "rgba(246,241,234,0.75)", textAlign: "left", transition: "all 0.15s" }}>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Q1 */}
        {step === "q1" && (
          <QuestionScreen step="q1" skipQ1={skipQ1}
            question={qs.q1.question} sub={qs.q1.sub} options={qs.q1.options}
            onAnswer={(key) => { answer("witnessed", key); setStep("q2"); }}
            onBack={goBack} />
        )}

        {/* Q2 */}
        {step === "q2" && (
          <QuestionScreen step="q2" skipQ1={skipQ1}
            question={qs.q2.question} sub={qs.q2.sub} options={qs.q2.options}
            onAnswer={(key) => { answer("truthful", key); setStep("q3"); }}
            onBack={goBack} />
        )}

        {/* Q3 */}
        {step === "q3" && (
          <QuestionScreen step="q3" skipQ1={skipQ1}
            question={qs.q3.question} sub={qs.q3.sub} options={qs.q3.options}
            onAnswer={(key) => { answer("identity", key); setStep("write"); }}
            onBack={goBack} />
        )}

        {/* SIGN IN GATE */}
        {step === "signin" && (
          <SignInGate onSignIn={onSignIn} onBack={goBack} />
        )}

        {/* WRITE */}
        {step === "write" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: ed.bg, transition: "background 0.3s ease" }}>
            <ProgressBar step="write" skipQ1={skipQ1} />

            {/* Scrollable editor area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 8px" }}>
              <div style={{ maxWidth: "680px", margin: "0 auto" }}>

                {/* Context row */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                  <button onClick={goBack} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", lineHeight: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ed.iconStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                    </svg>
                  </button>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--permanent-gold)" }}>
                    {whoLabel}
                  </span>
                  {answers.truthful === "unverified" && (
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", background: ed.tagBg, border: `1px solid ${ed.tagBorder}`, borderRadius: "4px", padding: "2px 7px", color: ed.tagText }}>
                      Unverified
                    </span>
                  )}
                  {/* Editor mode toggle */}
                  <button
                    onClick={() => setEditorDark(!editorDark)}
                    title={editorDark ? "Switch to light mode" : "Switch to dark mode"}
                    style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", padding: "4px", lineHeight: 0, display: "flex", alignItems: "center", gap: "5px" }}>
                    {editorDark ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ed.toggleStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4"/>
                        <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                        <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ed.toggleStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                      </svg>
                    )}
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", color: ed.metaColor }}>
                      {editorDark ? "Light" : "Dark"}
                    </span>
                  </button>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", color: ed.metaColor }}>
                    Draft saved
                  </span>
                </div>

                {/* Chosen name */}
                {answers.identity === "chosen" && (
                  <input
                    value={answers.chosenName}
                    onChange={(e) => answer("chosenName", e.target.value)}
                    placeholder="Name to display..."
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${ed.mutedBorder}`, padding: "8px 0", marginBottom: "20px", fontFamily: "'Inter', sans-serif", fontSize: "14px", color: ed.bodyColor, outline: "none", boxSizing: "border-box" }}
                  />
                )}

                {/* Title */}
                <textarea
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give this experience a title..."
                  rows={2}
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 600, color: ed.titleColor, lineHeight: 1.2, marginBottom: "16px", boxSizing: "border-box", overflow: "hidden" }}
                />

                {/* Body */}
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your experience here. Take your time. There is no rush — but we ask for at least 50 words so what you share can be carried fully."
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: "'Inter', sans-serif", fontSize: "16px", color: ed.bodyColor, lineHeight: 1.85, minHeight: "200px", boxSizing: "border-box" }}
                />

                {/* Word count + AI assist */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${ed.mutedBorder}` }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: wordCount(body) >= 50 ? ed.wordOk : ed.wordWarn }}>
                    {wordCount(body)} words{wordCount(body) < 50 ? ` — ${50 - wordCount(body)} more to publish` : ""}
                  </span>
                  <button
                    onClick={() => setAssistOpen(!assistOpen)}
                    style={{ background: assistOpen ? "rgba(191,155,78,0.1)" : "transparent", border: `1px solid ${assistOpen ? "var(--permanent-gold)" : ed.chipBorder}`, borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, color: assistOpen ? "var(--permanent-gold)" : ed.chipColor, display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    Annie can help {!isPlus && `(${assistsLeft} left today)`}
                  </button>
                </div>

                {/* AI assist panel */}
                {assistOpen && (
                  <div style={{ marginTop: "12px", background: ed.assistBg, border: `1px solid ${ed.assistBorder}`, borderRadius: "10px", padding: "14px" }}>
                    {!isPlus && assistUsedToday >= FREE_DAILY_ASSIST ? (
                      <div style={{ textAlign: "center", padding: "8px 0" }}>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: ed.assistText, marginBottom: "12px" }}>
                          You have used your 3 free assists today.
                        </p>
                        <button style={{ background: "var(--permanent-gold)", border: "none", borderRadius: "7px", padding: "10px 20px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white" }}>
                          Get Annie Plus — unlimited assists
                        </button>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: ed.assistText, marginBottom: "10px" }}>
                          Annie suggests. You decide. Your voice stays yours.
                        </p>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                          {(["improve", "paraphrase", "shorten", "expand"] as AssistMode[]).map((m) => (
                            <button key={m} onClick={() => setAssistMode(m)} style={{ padding: "5px 10px", borderRadius: "6px", border: `1px solid ${assistMode === m ? "var(--permanent-gold)" : ed.chipBorder}`, background: assistMode === m ? "rgba(191,155,78,0.1)" : "transparent", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, color: assistMode === m ? "var(--permanent-gold)" : ed.chipColor, cursor: "pointer", textTransform: "capitalize" }}>
                              {m}
                            </button>
                          ))}
                        </div>
                        <button onClick={handleAssist} disabled={!body.trim() || assistLoading} style={{ width: "100%", background: "var(--permanent-gold)", border: "none", borderRadius: "7px", padding: "9px", cursor: body.trim() ? "pointer" : "not-allowed", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white", opacity: body.trim() ? 1 : 0.4 }}>
                          {assistLoading ? "Working..." : "Suggest an edit"}
                        </button>
                        {assistResult && (
                          <div style={{ marginTop: "12px" }}>
                            <div style={{ background: ed.resultBg, border: `1px solid ${ed.resultBorder}`, borderRadius: "8px", padding: "12px", fontFamily: "'Inter', sans-serif", fontSize: "14px", color: ed.resultText, lineHeight: 1.7, marginBottom: "8px", whiteSpace: "pre-wrap" }}>
                              {assistResult}
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button onClick={applyAssist} style={{ flex: 1, background: "var(--permanent-gold)", border: "none", borderRadius: "7px", padding: "9px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white" }}>Use this</button>
                              <button onClick={() => setAssistResult("")} style={{ flex: 1, background: "transparent", border: `1px solid ${ed.keepBorder}`, borderRadius: "7px", padding: "9px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: ed.keepBtn }}>Keep mine</button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Pull quote */}
                {wordCount(body) >= 30 && (
                  <div style={{ marginTop: "20px" }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: ed.metaColor, marginBottom: "8px" }}>
                      Pull quote (optional)
                    </p>
                    <textarea
                      value={pullQuote}
                      onChange={(e) => setPullQuote(e.target.value)}
                      placeholder="Paste the one sentence that carries the most weight. This is what people see first."
                      rows={2}
                      style={{ width: "100%", background: ed.pullBg, border: `1px solid ${ed.pullBorder}`, borderRadius: "8px", padding: "10px 12px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "15px", color: ed.pullText, lineHeight: 1.6, resize: "none", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                )}

                <div style={{ height: "80px" }} />
              </div>
            </div>

            {/* Sticky publish bar */}
            <div style={{ borderTop: `1px solid ${ed.barBorder}`, padding: "12px 20px", display: "flex", gap: "10px", alignItems: "center", flexShrink: 0, background: ed.barBg, transition: "background 0.3s ease" }}>
              <button
                disabled={!canPublish || publishing}
                onClick={handlePublish}
                style={{ flex: 1, background: canPublish ? "var(--permanent-gold)" : (editorDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"), color: canPublish ? "white" : (editorDark ? "rgba(246,241,234,0.2)" : "rgba(44,40,32,0.25)"), border: "none", borderRadius: "8px", padding: "13px", cursor: canPublish ? "pointer" : "not-allowed", fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 600, transition: "all 0.2s" }}>
                {publishing ? "Publishing..." : "Publish this experience"}
              </button>
              <button
                onClick={() => { saveDraftLocally({ answers, title, body, pullQuote }); handleClose(); }}
                style={{ background: "transparent", border: `1px solid ${ed.saveBorder}`, borderRadius: "8px", padding: "13px 16px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: ed.saveColor, whiteSpace: "nowrap" }}>
                Save draft
              </button>
            </div>
          </div>
        )}
        )}
      </div>

      <style>{`
        @keyframes shareFlowIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}