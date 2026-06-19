"use client";
// components/ShareFlow.tsx

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { assistWriting, AssistMode } from "../lib/ai";
import { SHARE_TYPES } from "../lib/categories";
import { getQuestions } from "../lib/questions";
import { AnnieUser } from "../lib/auth";
import { publishExperience, uploadExperienceImage, parseVideoUrl, FREE_PHOTO_LIMIT } from "../lib/experiences";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Step = "who" | "q1" | "q2" | "q3" | "write" | "signin";

type Answers = {
  whoKey:     string;
  witnessed:  string | null;
  truthful:   string | null;
  identity:   string | null;
  chosenName: string;
};

type Draft = {
  answers:   Answers;
  title:     string;
  body:      string;
  pullQuote: string;
};

function wordCount(t: string) {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

const FREE_DAILY_ASSIST = 3;
const DRAFT_KEY         = "annie_draft";

export const PENDING_PUBLISH_KEY = "annie_pending_publish";

function saveDraftLocally(draft: Draft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
}

function loadDraftLocally(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearDraftLocally() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

function hasDraft(): boolean {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw) as Draft;
    return !!(d.title?.trim() || d.body?.trim());
  } catch { return false; }
}

const BLANK_ANSWERS: Answers = {
  whoKey: "", witnessed: null, truthful: null, identity: null, chosenName: "",
};

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

// ─── Draft banner ─────────────────────────────────────────────────────────────

function DraftBanner({ onContinue, onDiscard }: { onContinue: () => void; onDiscard: () => void }) {
  return (
    <div style={{ margin: "0 0 20px", background: "rgba(191,155,78,0.08)", border: "1px solid rgba(191,155,78,0.25)", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" as const }}>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.75)", margin: 0 }}>
        You have an unfinished experience.
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={onContinue}
          style={{ background: "var(--permanent-gold)", border: "none", borderRadius: "6px", padding: "7px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, color: "white" }}>
          Continue it
        </button>
        <button
          onClick={onDiscard}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", padding: "7px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(246,241,234,0.45)" }}>
          Start fresh
        </button>
      </div>
    </div>
  );
}

// ─── Question screen ──────────────────────────────────────────────────────────

function QuestionScreen({ question, sub, options, onAnswer, onBack, step, skipQ1 }: {
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
          Your experience is written.
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.5)", marginBottom: "8px", lineHeight: 1.6 }}>
          Sign in to publish. Everything you wrote is saved and will still be here when you return.
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.3)", marginBottom: "32px" }}>
          No account yet? Signing in with Google sets one up right away.
        </p>
        <button onClick={onSignIn} style={{ width: "100%", background: "var(--permanent-gold)", border: "none", borderRadius: "10px", padding: "15px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 600, color: "white", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
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

// ─── "Coming soon" disabled control ──────────────────────────────────────────
// Reusable across the icon row. Looks like a real button, not greyed-out
// decoration — the point is it should read as "arriving," not "broken."
// Tap/hover surfaces a short plain label, no sentence, no explaining itself.

function ComingSoonButton({ icon, label, edTone }: { icon: React.ReactNode; label: string; edTone: { iconStroke: string; chipBorder: string; chipColor: string } }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={() => setShow((s) => !s)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ display: "flex", alignItems: "center", gap: "7px", background: "rgba(255,255,255,0.04)", border: `1px solid ${edTone.chipBorder}`, borderRadius: "8px", padding: "10px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: edTone.chipColor }}>
        {icon}
        {label}
      </button>
      {show && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#1a1814", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", padding: "6px 10px", fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.7)", whiteSpace: "nowrap", zIndex: 10 }}>
          Coming soon
        </div>
      )}
    </div>
  );
}

// ─── Main ShareFlow ───────────────────────────────────────────────────────────

type Props = {
  open:          boolean;
  user:          AnnieUser | null;
  onClose:       () => void;
  onSignIn:      () => void;
  onPublished:   () => void;
  initialType?:  string;
  resumeDraft?:  boolean;
};

export default function ShareFlow({ open, user, onClose, onSignIn, onPublished, initialType, resumeDraft }: Props) {
  const [step, setStep]           = useState<Step>("who");
  const [answers, setAnswers]     = useState<Answers>({ ...BLANK_ANSWERS, whoKey: initialType || "" });
  const [title, setTitle]         = useState("");
  const [body, setBody]           = useState("");
  const [pullQuote, setPullQuote] = useState("");
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  const [assistOpen, setAssistOpen]           = useState(false);
  const [assistLoading, setAssistLoading]     = useState(false);
  const [assistMode, setAssistMode]           = useState<AssistMode>("improve");
  const [assistResult, setAssistResult]       = useState("");
  const [assistUsedToday, setAssistUsedToday] = useState(0);
  const [publishing, setPublishing]           = useState(false);
  const [publishError, setPublishError]       = useState("");
  const [publishedId, setPublishedId]         = useState("");
  const [editorDark, setEditorDark]           = useState(false);

  // Photos — up to FREE_PHOTO_LIMIT live slots, locked slot beyond that
  const [imageFiles, setImageFiles]       = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError]       = useState("");

  // Video link — live feature, paste a URL
  const [videoUrl, setVideoUrl]           = useState("");
  const [videoUrlError, setVideoUrlError] = useState("");
  const [videoLinkOpen, setVideoLinkOpen] = useState(false);

  const bodyRef        = useRef<HTMLTextAreaElement>(null);
  const imageInputRef  = useRef<HTMLInputElement>(null);

  // On open: if returning from a sign-in redirect with a pending publish,
  // restore the draft exactly and go straight to write. Otherwise start
  // fresh at "who" and surface the draft banner if one happens to exist.
  useEffect(() => {
    if (!open) return;

    if (resumeDraft) {
      const draft = loadDraftLocally();
      if (draft) {
        setAnswers(draft.answers);
        setTitle(draft.title);
        setBody(draft.body);
        setPullQuote(draft.pullQuote);
        setStep("write");
        setShowDraftBanner(false);
        setPublishedId("");
        setPublishError("");
        setAssistOpen(false);
        setAssistResult("");
        setImageFiles([]);
        setImagePreviews([]);
        setImageError("");
        setVideoUrl("");
        setVideoUrlError("");
        return;
      }
    }

    setStep("who");
    setAnswers({ ...BLANK_ANSWERS, whoKey: initialType || "" });
    setTitle("");
    setBody("");
    setPullQuote("");
    setPublishedId("");
    setPublishError("");
    setAssistOpen(false);
    setAssistResult("");
    setImageFiles([]);
    setImagePreviews([]);
    setImageError("");
    setVideoUrl("");
    setVideoUrlError("");
    setShowDraftBanner(hasDraft());
  }, [open, resumeDraft]);

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
    document.documentElement.style.overflow = open ? "hidden" : "";
    document.documentElement.style.position = open ? "fixed"  : "";
    document.documentElement.style.width    = open ? "100%"   : "";
    return () => {
      document.documentElement.style.overflow = "";
      document.documentElement.style.position = "";
      document.documentElement.style.width    = "";
    };
  }, [open]);

  // Auto-resize body textarea
  useEffect(() => {
    const ta = bodyRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, [body]);

  // Clean up preview object URLs on unmount
  useEffect(() => {
    return () => { imagePreviews.forEach((url) => URL.revokeObjectURL(url)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (title.trim() || body.trim()) {
      saveDraftLocally({ answers, title, body, pullQuote });
    }
    onClose();
  };

  const handleContinueDraft = () => {
    const draft = loadDraftLocally();
    if (!draft) return;
    setAnswers(draft.answers);
    setTitle(draft.title);
    setBody(draft.body);
    setPullQuote(draft.pullQuote);
    setShowDraftBanner(false);
    setStep("write");
  };

  const handleDiscardDraft = () => {
    clearDraftLocally();
    setShowDraftBanner(false);
  };

  // Resolve display name based on identity choice
  const resolveDisplayName = (): { name: string; initial: string; isAnonymous: boolean } => {
    if (answers.identity === "anonymous") {
      return { name: "Shared anonymously", initial: "A", isAnonymous: true };
    }
    if (answers.identity === "chosen" && answers.chosenName.trim()) {
      const n = answers.chosenName.trim();
      return { name: n, initial: n[0].toUpperCase(), isAnonymous: false };
    }
    if (answers.identity === "name" && user) {
      return { name: user.name, initial: user.name[0].toUpperCase(), isAnonymous: false };
    }
    return { name: "Anonymous", initial: "A", isAnonymous: true };
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

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (imageFiles.length >= FREE_PHOTO_LIMIT) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("That file type isn't supported. Use a JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("That image is too large. Keep it under 5MB.");
      return;
    }

    setImageError("");
    setImageFiles((prev) => [...prev, file]);
    setImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImageError("");
  };

  const handleVideoUrlChange = (value: string) => {
    setVideoUrl(value);
    if (!value.trim()) { setVideoUrlError(""); return; }
    const parsed = parseVideoUrl(value);
    setVideoUrlError(parsed ? "" : "Paste a YouTube or Vimeo link.");
  };

  const parsedVideo = videoUrl.trim() ? parseVideoUrl(videoUrl) : null;

  const handlePublish = async () => {
    if (!user) {
      saveDraftLocally({ answers, title, body, pullQuote });
      try { localStorage.setItem(PENDING_PUBLISH_KEY, "true"); } catch {}
      setStep("signin");
      return;
    }
    setPublishing(true);
    setPublishError("");

    let imageUrls: string[] = [];
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const uploadResult = await uploadExperienceImage(file, user.id);
        if (!uploadResult.ok) {
          setPublishError("One of your photos didn't upload. You can try again, or publish without it.");
          setPublishing(false);
          return;
        }
        imageUrls.push(uploadResult.url);
      }
    }

    const { isAnonymous, name } = resolveDisplayName();

    const result = await publishExperience({
      profile_id:        user.id,
      category:          answers.whoKey,
      title:             title.trim(),
      content:           body.trim(),
      pull_quote:        pullQuote.trim() || undefined,
      language:          "en",
      is_anonymous:      isAnonymous,
      is_live:           answers.whoKey === "live",
      is_historical:     answers.whoKey === "historical",
      historical_source: undefined,
      published:         true,
      display_name:      isAnonymous ? undefined : name,
      image_urls:        imageUrls,
      video_url:         parsedVideo ? videoUrl.trim() : undefined,
    });

    if (!result.ok) {
      setPublishError("Something went wrong. Your draft is saved. Try again.");
      setPublishing(false);
      return;
    }

    // Clear draft, reload feed, show success
    clearDraftLocally();
    setPublishedId(result.id);
    setPublishing(false);
    onPublished();
  };

  // Back to Annie from success screen — reset everything
  const handleSuccessClose = () => {
    setPublishedId("");
    setStep("who");
    setAnswers({ ...BLANK_ANSWERS });
    setTitle("");
    setBody("");
    setPullQuote("");
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    setImageError("");
    setVideoUrl("");
    setVideoUrlError("");
    setVideoLinkOpen(false);
    onClose();
  };

  const canPublish  = title.trim().length > 0 && wordCount(body) >= 50 && !videoUrlError;
  const assistsLeft = Math.max(0, FREE_DAILY_ASSIST - assistUsedToday);
  const isPlus      = false;
  const whoLabel    = SHARE_TYPES.find((t) => t.key === answers.whoKey)?.label || "";

  const ed = {
    bg:               editorDark ? "#141210"                : "#faf9f7",
    titleColor:       editorDark ? "#f6f1ea"                : "#1a1814",
    bodyColor:        editorDark ? "#e8e2d9"                : "#2c2820",
    placeholderTitle: editorDark ? "rgba(246,241,234,0.35)" : "rgba(44,40,32,0.28)",
    placeholderBody:  editorDark ? "rgba(246,241,234,0.35)" : "rgba(44,40,32,0.28)",
    metaColor:        editorDark ? "rgba(246,241,234,0.55)" : "rgba(44,40,32,0.45)",
    mutedBorder:      editorDark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.08)",
    assistBg:         editorDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
    assistBorder:     editorDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    assistText:       editorDark ? "rgba(246,241,234,0.65)" : "rgba(44,40,32,0.5)",
    chipBorder:       editorDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)",
    chipColor:        editorDark ? "rgba(246,241,234,0.65)" : "rgba(44,40,32,0.5)",
    resultBg:         editorDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
    resultBorder:     editorDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.07)",
    resultText:       editorDark ? "#e8e2d9"                : "#2c2820",
    keepBtn:          editorDark ? "rgba(246,241,234,0.65)" : "rgba(44,40,32,0.4)",
    keepBorder:       editorDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)",
    pullBg:           editorDark ? "rgba(255,255,255,0.04)" : "rgba(191,155,78,0.04)",
    pullBorder:       editorDark ? "rgba(255,255,255,0.12)" : "rgba(191,155,78,0.2)",
    pullText:         editorDark ? "#e8e2d9"                : "#2c2820",
    barBg:            editorDark ? "#141210"                : "#faf9f7",
    barBorder:        editorDark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.08)",
    saveColor:        editorDark ? "rgba(246,241,234,0.6)"  : "rgba(44,40,32,0.4)",
    saveBorder:       editorDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)",
    iconStroke:       editorDark ? "rgba(246,241,234,0.6)"  : "rgba(44,40,32,0.35)",
    tagBg:            editorDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    tagBorder:        editorDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
    tagText:          editorDark ? "rgba(246,241,234,0.6)"  : "rgba(44,40,32,0.45)",
    wordOk:           editorDark ? "rgba(246,241,234,0.45)" : "rgba(44,40,32,0.35)",
    wordWarn:         "#bf9b4e",
    toggleStroke:     editorDark ? "rgba(246,241,234,0.65)" : "rgba(44,40,32,0.4)",
    publishDisabledBg:    editorDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    publishDisabledColor: editorDark ? "rgba(246,241,234,0.35)" : "rgba(44,40,32,0.3)",
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "var(--permanent-ink)", display: "flex", flexDirection: "column", animation: "shareFlowIn 0.28s cubic-bezier(0.4,0,0.2,1)" }}>

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

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* WHO */}
        {step === "who" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "40px 24px" }}>
            <ProgressBar step="who" skipQ1={false} />
            <div style={{ maxWidth: "560px", margin: "32px auto 0" }}>
              {showDraftBanner && (
                <DraftBanner onContinue={handleContinueDraft} onDiscard={handleDiscardDraft} />
              )}
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 300, color: "var(--permanent-parchment)", marginBottom: "8px" }}>
                Who is sharing this?
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.45)", marginBottom: "28px" }}>
                Anyone can share here.
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

        {step === "q1" && (
          <QuestionScreen step="q1" skipQ1={skipQ1} question={qs.q1.question} sub={qs.q1.sub} options={qs.q1.options}
            onAnswer={(key) => { answer("witnessed", key); setStep("q2"); }} onBack={goBack} />
        )}
        {step === "q2" && (
          <QuestionScreen step="q2" skipQ1={skipQ1} question={qs.q2.question} sub={qs.q2.sub} options={qs.q2.options}
            onAnswer={(key) => { answer("truthful", key); setStep("q3"); }} onBack={goBack} />
        )}
        {step === "q3" && (
          <QuestionScreen step="q3" skipQ1={skipQ1} question={qs.q3.question} sub={qs.q3.sub} options={qs.q3.options}
            onAnswer={(key) => { answer("identity", key); setStep("write"); }} onBack={goBack} />
        )}
        {step === "signin" && <SignInGate onSignIn={onSignIn} onBack={goBack} />}

        {/* WRITE */}
        {step === "write" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: ed.bg, transition: "background 0.3s ease" }}>
            <ProgressBar step="write" skipQ1={skipQ1} />
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 8px" }}>
              <div style={{ maxWidth: "680px", margin: "0 auto" }}>

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
                  <button onClick={() => setEditorDark(!editorDark)} title={editorDark ? "Switch to light mode" : "Switch to dark mode"} style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", padding: "4px", lineHeight: 0, display: "flex", alignItems: "center", gap: "5px" }}>
                    {editorDark ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ed.toggleStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                        <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ed.toggleStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                      </svg>
                    )}
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", color: ed.metaColor }}>{editorDark ? "Light" : "Dark"}</span>
                  </button>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", color: ed.metaColor }}>Saved</span>
                </div>

                {answers.identity === "chosen" && (
                  <input value={answers.chosenName} onChange={(e) => answer("chosenName", e.target.value)}
                    placeholder="What name should appear with this?" className="annie-editor-name"
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${ed.mutedBorder}`, padding: "8px 0", marginBottom: "20px", fontFamily: "'Inter', sans-serif", fontSize: "14px", color: ed.bodyColor, outline: "none", boxSizing: "border-box" }} />
                )}

                {answers.identity === "name" && user && (
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: ed.metaColor, marginBottom: "16px" }}>
                    Publishing as {user.name}
                  </p>
                )}

                {answers.identity === "anonymous" && (
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: ed.metaColor, marginBottom: "16px" }}>
                    Publishing anonymously
                  </p>
                )}

                <textarea value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="What would you call this experience?" className="annie-editor-title" rows={2}
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 600, color: ed.titleColor, lineHeight: 1.2, marginBottom: "16px", boxSizing: "border-box", overflow: "hidden" }} />

                <textarea ref={bodyRef} value={body} onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your experience here. Take as much space as you need. We only ask for at least 50 words so the full story comes through."
                  className="annie-editor-body"
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: "'Inter', sans-serif", fontSize: "16px", color: ed.bodyColor, lineHeight: 1.85, minHeight: "200px", boxSizing: "border-box" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${ed.mutedBorder}` }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: wordCount(body) >= 50 ? ed.wordOk : ed.wordWarn }}>
                    {wordCount(body)} words{wordCount(body) < 50 ? ` — ${50 - wordCount(body)} more words needed to publish` : ""}
                  </span>
                  <button onClick={() => setAssistOpen(!assistOpen)}
                    style={{ background: assistOpen ? "rgba(191,155,78,0.1)" : "transparent", border: `1px solid ${assistOpen ? "var(--permanent-gold)" : ed.chipBorder}`, borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, color: assistOpen ? "var(--permanent-gold)" : ed.chipColor, display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    Annie can help {!isPlus && `(${assistsLeft} left today)`}
                  </button>
                </div>

                {assistOpen && (
                  <div style={{ marginTop: "12px", background: ed.assistBg, border: `1px solid ${ed.assistBorder}`, borderRadius: "10px", padding: "14px" }}>
                    {!isPlus && assistUsedToday >= FREE_DAILY_ASSIST ? (
                      <div style={{ textAlign: "center", padding: "8px 0" }}>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: ed.assistText, marginBottom: "12px" }}>You have reached your 3 free assists for today.</p>
                        <button style={{ background: "var(--permanent-gold)", border: "none", borderRadius: "7px", padding: "10px 20px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white" }}>Get Annie Plus for unlimited assists</button>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: ed.assistText, marginBottom: "10px" }}>Annie can offer a suggestion. You choose what to keep. Nothing changes without you deciding it does.</p>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                          {(["improve", "paraphrase", "shorten", "expand"] as AssistMode[]).map((m) => (
                            <button key={m} onClick={() => setAssistMode(m)} style={{ padding: "5px 10px", borderRadius: "6px", border: `1px solid ${assistMode === m ? "var(--permanent-gold)" : ed.chipBorder}`, background: assistMode === m ? "rgba(191,155,78,0.1)" : "transparent", fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, color: assistMode === m ? "var(--permanent-gold)" : ed.chipColor, cursor: "pointer", textTransform: "capitalize" }}>
                              {m}
                            </button>
                          ))}
                        </div>
                        <button onClick={handleAssist} disabled={!body.trim() || assistLoading}
                          style={{ width: "100%", background: "var(--permanent-gold)", border: "none", borderRadius: "7px", padding: "9px", cursor: body.trim() ? "pointer" : "not-allowed", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white", opacity: body.trim() ? 1 : 0.4 }}>
                          {assistLoading ? "Thinking..." : "Show me a suggestion"}
                        </button>
                        {assistResult && (
                          <div style={{ marginTop: "12px" }}>
                            <div style={{ background: ed.resultBg, border: `1px solid ${ed.resultBorder}`, borderRadius: "8px", padding: "12px", fontFamily: "'Inter', sans-serif", fontSize: "14px", color: ed.resultText, lineHeight: 1.7, marginBottom: "8px", whiteSpace: "pre-wrap" }}>{assistResult}</div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button onClick={applyAssist} style={{ flex: 1, background: "var(--permanent-gold)", border: "none", borderRadius: "7px", padding: "9px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white" }}>Use this version</button>
                              <button onClick={() => setAssistResult("")} style={{ flex: 1, background: "transparent", border: `1px solid ${ed.keepBorder}`, borderRadius: "7px", padding: "9px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: ed.keepBtn }}>Keep what I wrote</button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {wordCount(body) >= 30 && (
                  <div style={{ marginTop: "20px" }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: ed.metaColor, marginBottom: "8px" }}>A line to lead with (optional)</p>
                    <textarea value={pullQuote} onChange={(e) => setPullQuote(e.target.value)}
                      placeholder="If one sentence from what you wrote stays with you the most, put it here. People will read this first."
                      className="annie-editor-pull" rows={2}
                      style={{ width: "100%", background: ed.pullBg, border: `1px solid ${ed.pullBorder}`, borderRadius: "8px", padding: "10px 12px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "15px", color: ed.pullText, lineHeight: 1.6, resize: "none", outline: "none", boxSizing: "border-box" }} />
                  </div>
                )}

                {/* ── Photos — up to FREE_PHOTO_LIMIT, locked slot beyond that ── */}
                <div style={{ marginTop: "20px" }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: ed.metaColor, marginBottom: "8px" }}>
                    Photos (optional)
                  </p>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    style={{ display: "none" }}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                    {imagePreviews.map((src, i) => (
                      <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: "8px", overflow: "hidden", border: `1px solid ${ed.assistBorder}` }}>
                        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        <button
                          onClick={() => handleRemoveImage(i)}
                          aria-label="Remove photo"
                          style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(15,14,12,0.75)", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}

                    {imagePreviews.length < FREE_PHOTO_LIMIT && (
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", background: ed.assistBg, border: `1px dashed ${ed.assistBorder}`, borderRadius: "8px", cursor: "pointer" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ed.assistText} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </button>
                    )}

                    {imagePreviews.length >= FREE_PHOTO_LIMIT && (
                      <div style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", background: "rgba(191,155,78,0.06)", border: `1px solid ${ed.pullBorder}`, borderRadius: "8px" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
                        </svg>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px", fontWeight: 600, color: "var(--permanent-gold)" }}>Plus</span>
                      </div>
                    )}
                  </div>

                  {imageError && (
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#bf9b4e", marginTop: "8px" }}>{imageError}</p>
                  )}

                  {!isPlus && (
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: ed.metaColor, marginTop: "8px" }}>
                      Up to {FREE_PHOTO_LIMIT} photos on the free plan.
                    </p>
                  )}
                </div>

                {/* ── Video link — live feature ── */}
                <div style={{ marginTop: "20px" }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: ed.metaColor, marginBottom: "8px" }}>
                    Video link (optional)
                  </p>

                  {!videoLinkOpen && !videoUrl ? (
                    <button
                      onClick={() => setVideoLinkOpen(true)}
                      style={{ display: "flex", alignItems: "center", gap: "8px", background: ed.assistBg, border: `1px dashed ${ed.assistBorder}`, borderRadius: "10px", padding: "14px 16px", cursor: "pointer", width: "100%", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: ed.assistText }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 10l4.55-2.55A1 1 0 0 1 21 8.36v7.28a1 1 0 0 1-1.45.9L15 14"/>
                        <rect x="3" y="6" width="12" height="12" rx="2"/>
                      </svg>
                      Add a YouTube or Vimeo link
                    </button>
                  ) : (
                    <div>
                      <input
                        value={videoUrl}
                        onChange={(e) => handleVideoUrlChange(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        style={{ width: "100%", background: ed.assistBg, border: `1px solid ${videoUrlError ? "#bf9b4e" : ed.assistBorder}`, borderRadius: "8px", padding: "10px 12px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: ed.bodyColor, outline: "none", boxSizing: "border-box" }} />
                      {videoUrlError && (
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#bf9b4e", marginTop: "6px" }}>{videoUrlError}</p>
                      )}
                      {parsedVideo && (
                        <div style={{ marginTop: "10px", borderRadius: "8px", overflow: "hidden", border: `1px solid ${ed.assistBorder}`, position: "relative" }}>
                          {parsedVideo.thumbnailUrl ? (
                            <img src={parsedVideo.thumbnailUrl} alt="" style={{ width: "100%", maxHeight: "180px", objectFit: "cover", display: "block" }} />
                          ) : (
                            <div style={{ height: "100px", background: "#0f0e0c", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(246,241,234,0.4)" }}>Vimeo video linked</span>
                            </div>
                          )}
                          <button
                            onClick={() => { setVideoUrl(""); setVideoUrlError(""); setVideoLinkOpen(false); }}
                            aria-label="Remove video link"
                            style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(15,14,12,0.75)", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Video upload + voice to text — not yet, honest disabled state ── */}
                <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" as const }}>
                  <ComingSoonButton
                    edTone={ed}
                    icon={
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 10l4.55-2.55A1 1 0 0 1 21 8.36v7.28a1 1 0 0 1-1.45.9L15 14"/>
                        <rect x="3" y="6" width="12" height="12" rx="2"/>
                      </svg>
                    }
                    label="Upload a video"
                  />
                  <ComingSoonButton
                    edTone={ed}
                    icon={
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
                      </svg>
                    }
                    label="Speak it instead"
                  />
                </div>

                <div style={{ height: "80px" }} />
              </div>
            </div>

            {publishError && (
              <div style={{ padding: "8px 20px", background: "rgba(193,58,58,0.1)", borderTop: "1px solid rgba(193,58,58,0.2)" }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#e07070", margin: 0, textAlign: "center" }}>{publishError}</p>
              </div>
            )}
            <div style={{ borderTop: `1px solid ${ed.barBorder}`, padding: "12px 20px", display: "flex", gap: "10px", alignItems: "center", flexShrink: 0, background: ed.barBg, transition: "background 0.3s ease" }}>
              <button disabled={!canPublish || publishing} onClick={handlePublish}
                style={{ flex: 1, background: canPublish ? "var(--permanent-gold)" : ed.publishDisabledBg, color: canPublish ? "white" : ed.publishDisabledColor, border: "none", borderRadius: "8px", padding: "13px", cursor: canPublish ? "pointer" : "not-allowed", fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 600, transition: "all 0.2s" }}>
                {publishing ? (imageFiles.length > 0 ? "Uploading your photos..." : "Publishing your experience...") : "Publish your experience"}
              </button>
              <button onClick={() => { saveDraftLocally({ answers, title, body, pullQuote }); handleClose(); }}
                style={{ background: "transparent", border: `1px solid ${ed.saveBorder}`, borderRadius: "8px", padding: "13px 16px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: ed.saveColor, whiteSpace: "nowrap" }}>
                Save for later
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SUCCESS STATE */}
      {publishedId && (
        <div style={{ position: "absolute", inset: 0, background: "var(--permanent-ink)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center", zIndex: 10 }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(191,155,78,0.12)", border: "1px solid var(--permanent-gold)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 300, color: "var(--permanent-parchment)", marginBottom: "10px" }}>
            Your experience is published.
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.5)", marginBottom: "32px", lineHeight: 1.6, maxWidth: "320px" }}>
            It is now part of Annie. Others can read it, carry it forward, and respond to it.
          </p>
          <button onClick={handleSuccessClose}
            style={{ background: "var(--permanent-gold)", border: "none", borderRadius: "10px", padding: "13px 32px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 600, color: "white" }}>
            Back to Annie
          </button>
        </div>
      )}

      <style>{`
        @keyframes shareFlowIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .annie-editor-title::placeholder { color: ${ed.placeholderTitle}; }
        .annie-editor-body::placeholder  { color: ${ed.placeholderBody};  }
        .annie-editor-name::placeholder  { color: ${ed.placeholderBody};  }
        .annie-editor-pull::placeholder  { color: ${ed.placeholderBody};  }
      `}</style>
    </div>
  );
}