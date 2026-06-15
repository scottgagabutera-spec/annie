"use client";
// app/share/page.tsx
// The full "Share an experience" flow.
// Step 1: Who is sharing (category — passed via URL param)
// Step 2: Three verification questions, one at a time
// Step 3: Writing editor with optional AI assist

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { assistWriting, AssistMode } from "../../lib/ai";
import { SHARE_TYPES } from "../../lib/categories";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "who" | "q1" | "q2" | "q3" | "write";

type Answers = {
  whoKey:    string;
  witnessed: "yes" | "carrying" | null;
  truthful:  "confirmed" | "unverified" | null;
  identity:  "name" | "chosen" | "anonymous" | null;
  chosenName: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NAV_H = 56;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: Step }) {
  const steps: Step[] = ["who", "q1", "q2", "q3", "write"];
  const idx = steps.indexOf(step);
  const pct = Math.round(((idx + 1) / steps.length) * 100);
  return (
    <div style={{ height: "2px", background: "rgba(255,255,255,0.08)", width: "100%" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "var(--permanent-gold)", transition: "width 0.4s ease" }} />
    </div>
  );
}

function QuestionScreen({
  question,
  sub,
  options,
  onAnswer,
  onBack,
}: {
  question: string;
  sub: string;
  options: { key: string; label: string; note?: string }[];
  onAnswer: (key: string) => void;
  onBack: () => void;
}) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--permanent-ink)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 300, color: "var(--permanent-parchment)", lineHeight: 1.2, marginBottom: "12px" }}>
          {question}
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.45)", marginBottom: "40px", lineHeight: 1.6 }}>
          {sub}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onAnswer(opt.key)}
              style={{
                background:   "rgba(255,255,255,0.05)",
                border:       "1px solid rgba(255,255,255,0.12)",
                borderRadius: "10px",
                padding:      "16px 20px",
                cursor:       "pointer",
                textAlign:    "left",
                transition:   "all 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--permanent-gold)"; (e.currentTarget as HTMLElement).style.background = "rgba(191,155,78,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
            >
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 600, color: "var(--permanent-parchment)", marginBottom: opt.note ? "4px" : "0" }}>
                {opt.label}
              </p>
              {opt.note && (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(246,241,234,0.4)" }}>
                  {opt.note}
                </p>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={onBack}
          style={{ marginTop: "28px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(246,241,234,0.3)" }}>
          Go back
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function SharePageInner() {
  const params   = useSearchParams();
  const router   = useRouter();
  const initialWho = params.get("type") || "";

  const [step, setStep]     = useState<Step>(initialWho ? "q1" : "who");
  const [answers, setAnswers] = useState<Answers>({
    whoKey:    initialWho,
    witnessed: null,
    truthful:  null,
    identity:  null,
    chosenName: "",
  });

  // Editor state
  const [title, setTitle]         = useState("");
  const [body, setBody]           = useState("");
  const [pullQuote, setPullQuote] = useState("");
  const [assistOpen, setAssistOpen] = useState(false);
  const [assistLoading, setAssistLoading] = useState(false);
  const [assistMode, setAssistMode] = useState<AssistMode>("improve");
  const [assistResult, setAssistResult] = useState("");
  const [publishing, setPublishing] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = bodyRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, [body]);

  const answer = (field: keyof Answers, value: string) => {
    setAnswers((a) => ({ ...a, [field]: value }));
  };

  const goBack = () => {
    const prev: Record<Step, Step> = {
      who: "who", q1: "who", q2: "q1", q3: "q2", write: "q3",
    };
    setStep(prev[step]);
  };

  const handleAssist = async () => {
    if (!body.trim()) return;
    setAssistLoading(true);
    setAssistResult("");
    const result = await assistWriting(body, assistMode);
    setAssistResult(result);
    setAssistLoading(false);
  };

  const applyAssist = () => {
    setBody(assistResult);
    setAssistResult("");
    setAssistOpen(false);
  };

  const canPublish = title.trim().length > 0 && wordCount(body) >= 50;

  const whoLabel = SHARE_TYPES.find((t) => t.key === answers.whoKey)?.label || "An experience";

  // ── Step: Who ──
  if (step === "who") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--permanent-ink)", paddingTop: `${NAV_H}px` }}>
        <ProgressBar step="who" />
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "48px 24px" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 300, color: "var(--permanent-parchment)", marginBottom: "8px" }}>
            Who is sharing?
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.45)", marginBottom: "32px" }}>
            No credentials required.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {SHARE_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => { answer("whoKey", type.key); setStep("q1"); }}
                style={{
                  border:       "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding:      "14px 16px",
                  cursor:       "pointer",
                  background:   answers.whoKey === type.key ? "rgba(191,155,78,0.12)" : "rgba(255,255,255,0.04)",
                  fontFamily:   "'Inter', sans-serif",
                  fontSize:     "13px",
                  fontWeight:   500,
                  color:        answers.whoKey === type.key ? "var(--permanent-gold)" : "rgba(246,241,234,0.75)",
                  textAlign:    "left",
                  transition:   "all 0.15s",
                  borderColor:  answers.whoKey === type.key ? "var(--permanent-gold)" : "rgba(255,255,255,0.1)",
                }}>
                {type.label}
              </button>
            ))}
          </div>
          <button onClick={() => router.back()} style={{ marginTop: "28px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(246,241,234,0.3)" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Q1 ──
  if (step === "q1") {
    return (
      <>
        <div style={{ position: "fixed", top: NAV_H, left: 0, right: 0, zIndex: 10 }}><ProgressBar step="q1" /></div>
        <QuestionScreen
          question="Did you witness or live this experience?"
          sub="Annie carries both. This helps us present it honestly."
          options={[
            { key: "yes",      label: "Yes, I was there",          note: "You personally lived or witnessed this." },
            { key: "carrying", label: "I am carrying it forward",  note: "This happened to someone else and you are preserving it." },
          ]}
          onAnswer={(key) => { answer("witnessed", key as any); setStep("q2"); }}
          onBack={goBack}
        />
      </>
    );
  }

  // ── Step: Q2 ──
  if (step === "q2") {
    return (
      <>
        <div style={{ position: "fixed", top: NAV_H, left: 0, right: 0, zIndex: 10 }}><ProgressBar step="q2" /></div>
        <QuestionScreen
          question="Is this true to the best of your knowledge?"
          sub="Annie does not require proof. But we ask you to be honest about what you know."
          options={[
            { key: "confirmed",  label: "Yes, I confirm this is true",     note: "You stand behind this account." },
            { key: "unverified", label: "I cannot fully verify this",      note: "Annie will mark it as unverified. Still worth sharing." },
          ]}
          onAnswer={(key) => { answer("truthful", key as any); setStep("q3"); }}
          onBack={goBack}
        />
      </>
    );
  }

  // ── Step: Q3 ──
  if (step === "q3") {
    return (
      <>
        <div style={{ position: "fixed", top: NAV_H, left: 0, right: 0, zIndex: 10 }}><ProgressBar step="q3" /></div>
        <QuestionScreen
          question="How do you want to appear?"
          sub="You can always change this later."
          options={[
            { key: "name",      label: "My real name",      note: "Your full name as on your profile." },
            { key: "chosen",    label: "A name I choose",   note: "You will enter it on the next screen." },
            { key: "anonymous", label: "Anonymously",       note: "No name shown. Annie protects your identity." },
          ]}
          onAnswer={(key) => { answer("identity", key as any); setStep("write"); }}
          onBack={goBack}
        />
      </>
    );
  }

  // ── Step: Write ──
  return (
    <div style={{ minHeight: "100dvh", background: "var(--permanent-ink)", paddingTop: `${NAV_H}px` }}>
      <div style={{ position: "fixed", top: NAV_H, left: 0, right: 0, zIndex: 10 }}>
        <ProgressBar step="write" />
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px 120px" }}>

        {/* Who + back */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <button onClick={goBack} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", lineHeight: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(246,241,234,0.4)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--permanent-gold)" }}>
            {whoLabel}
          </span>
          {answers.truthful === "unverified" && (
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", padding: "2px 8px", color: "rgba(246,241,234,0.4)" }}>
              Unverified
            </span>
          )}
        </div>

        {/* Chosen name input */}
        {answers.identity === "chosen" && (
          <input
            value={answers.chosenName}
            onChange={(e) => answer("chosenName", e.target.value)}
            placeholder="Name to display..."
            style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.12)", padding: "8px 0", marginBottom: "28px", fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "var(--permanent-parchment)", outline: "none", boxSizing: "border-box" }}
          />
        )}

        {/* Title */}
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give this experience a title..."
          rows={2}
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 600, color: "var(--permanent-parchment)", lineHeight: 1.2, marginBottom: "24px", boxSizing: "border-box", overflow: "hidden" }}
        />

        {/* Body */}
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your experience here. Take your time. There is no minimum — but we ask for at least 50 words so that what you share can be carried fully."
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: "'Inter', sans-serif", fontSize: "16px", color: "rgba(246,241,234,0.85)", lineHeight: 1.85, minHeight: "240px", boxSizing: "border-box" }}
        />

        {/* Word count */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: wordCount(body) >= 50 ? "rgba(246,241,234,0.3)" : "rgba(191,155,78,0.6)" }}>
            {wordCount(body)} {wordCount(body) === 1 ? "word" : "words"}{wordCount(body) < 50 ? ` — ${50 - wordCount(body)} more to publish` : ""}
          </span>

          {/* AI assist toggle */}
          <button
            onClick={() => setAssistOpen(!assistOpen)}
            style={{ background: assistOpen ? "rgba(191,155,78,0.12)" : "transparent", border: `1px solid ${assistOpen ? "var(--permanent-gold)" : "rgba(255,255,255,0.12)"}`, borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, color: assistOpen ? "var(--permanent-gold)" : "rgba(246,241,234,0.4)", display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Annie can help
          </button>
        </div>

        {/* AI assist panel */}
        {assistOpen && (
          <div style={{ marginTop: "16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "16px" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(246,241,234,0.5)", marginBottom: "12px" }}>
              Annie will suggest an edit. You decide whether to use it. Your voice always stays yours.
            </p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
              {(["improve", "paraphrase", "shorten", "expand"] as AssistMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setAssistMode(m)}
                  style={{ padding: "6px 12px", borderRadius: "6px", border: `1px solid ${assistMode === m ? "var(--permanent-gold)" : "rgba(255,255,255,0.1)"}`, background: assistMode === m ? "rgba(191,155,78,0.12)" : "transparent", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, color: assistMode === m ? "var(--permanent-gold)" : "rgba(246,241,234,0.45)", cursor: "pointer", textTransform: "capitalize" }}>
                  {m}
                </button>
              ))}
            </div>

            <button
              onClick={handleAssist}
              disabled={!body.trim() || assistLoading}
              style={{ width: "100%", background: "var(--permanent-gold)", border: "none", borderRadius: "7px", padding: "10px", cursor: body.trim() ? "pointer" : "not-allowed", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white", opacity: body.trim() ? 1 : 0.4 }}>
              {assistLoading ? "Working..." : "Suggest an edit"}
            </button>

            {assistResult && (
              <div style={{ marginTop: "14px" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "14px", fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "rgba(246,241,234,0.8)", lineHeight: 1.7, marginBottom: "10px", whiteSpace: "pre-wrap" }}>
                  {assistResult}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={applyAssist} style={{ flex: 1, background: "var(--permanent-gold)", border: "none", borderRadius: "7px", padding: "10px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white" }}>
                    Use this
                  </button>
                  <button onClick={() => setAssistResult("")} style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "7px", padding: "10px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.5)" }}>
                    Keep mine
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pull quote */}
        {wordCount(body) >= 30 && (
          <div style={{ marginTop: "24px" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(246,241,234,0.3)", marginBottom: "8px" }}>
              Pull quote (optional)
            </p>
            <textarea
              value={pullQuote}
              onChange={(e) => setPullQuote(e.target.value)}
              placeholder="Paste the one sentence from your experience that carries the most weight. This is what people see first."
              rows={3}
              style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "12px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "16px", color: "rgba(246,241,234,0.75)", lineHeight: 1.6, resize: "none", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        )}
      </div>

      {/* Sticky publish bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--permanent-ink)", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "16px 24px", display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          disabled={!canPublish || publishing}
          onClick={() => setPublishing(true)}
          style={{ flex: 1, background: canPublish ? "var(--permanent-gold)" : "rgba(255,255,255,0.06)", color: canPublish ? "white" : "rgba(246,241,234,0.25)", border: "none", borderRadius: "8px", padding: "14px", cursor: canPublish ? "pointer" : "not-allowed", fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 600, transition: "all 0.2s" }}>
          {publishing ? "Publishing..." : "Publish this experience"}
        </button>
        <button
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "14px 18px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.4)" }}>
          Save draft
        </button>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "var(--permanent-ink)" }} />}>
      <SharePageInner />
    </Suspense>
  );
}