"use client";
// app/experience/[id]/page.tsx
// The full reading page for a single experience.
// Dedicated route — not an overlay — because individual stories need to be
// linkable and shareable on their own, outside the feed entirely.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getExperienceById, carryForward, FeedExperience } from "../../../lib/experiences";

function formatCategory(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function ExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [exp, setExp]                       = useState<FeedExperience | null>(null);
  const [loading, setLoading]               = useState(true);
  const [notFound, setNotFound]             = useState(false);
  const [carrying, setCarrying]             = useState(false);
  const [carriedLocally, setCarriedLocally] = useState(false);

  useEffect(() => {
    if (!id) return;
    getExperienceById(id).then((data) => {
      if (!data) { setNotFound(true); setLoading(false); return; }
      setExp(data);
      setLoading(false);
    });
  }, [id]);

  const handleCarryForward = async () => {
    if (!exp || carrying || carriedLocally) return;
    setCarrying(true);
    const ok = await carryForward(exp.id);
    if (ok) {
      setExp({ ...exp, carried_forward_count: exp.carried_forward_count + 1 });
      setCarriedLocally(true);
    }
    setCarrying(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--permanent-ink)" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.4)" }}>Loading...</p>
      </div>
    );
  }

  if (notFound || !exp) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--permanent-ink)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 300, color: "var(--permanent-parchment)", marginBottom: "12px" }}>
          This experience is not here.
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.45)", marginBottom: "24px" }}>
          It may have been removed, or the link may not be correct.
        </p>
        <Link href="/" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--permanent-gold)", textDecoration: "none" }}>
          Back to Annie
        </Link>
      </div>
    );
  }

  const name        = exp.is_anonymous ? "Anonymous" : (exp.display_name || "Someone");
  const initial     = exp.is_anonymous ? "A" : (name.charAt(0).toUpperCase() || "?");
  const paragraphs  = exp.content.split(/\n+/).filter((p) => p.trim().length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--permanent-ink)" }}>

      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "56px", background: "var(--permanent-ink)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => router.back()} aria-label="Back" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-parchment)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 600, color: "var(--permanent-parchment)", textDecoration: "none" }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </Link>
        <div style={{ width: "30px" }} />
      </div>

      {/* Hero / pull quote — same dark block the card already uses, so the transition feels continuous */}
      <div style={{ padding: "32px 24px 28px", maxWidth: "680px", margin: "0 auto" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--permanent-gold)", marginBottom: "16px" }}>
          {formatCategory(exp.category)}
        </p>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(20px, 4vw, 26px)", color: "var(--permanent-parchment)", lineHeight: 1.5, marginBottom: "24px" }}>
          {exp.pull_quote || paragraphs[0]}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "rgba(191,155,78,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", color: "var(--permanent-gold)", flexShrink: 0 }}>
            {initial}
          </div>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--permanent-parchment)", margin: 0 }}>{name}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(246,241,234,0.45)", margin: 0 }}>{exp.read_time_minutes} min read</p>
          </div>
        </div>
      </div>

      {/* Body — switches to the readable surface for the actual writing */}
      <div style={{ background: "var(--surface-card)", padding: "36px 24px 28px", maxWidth: "680px", margin: "0 auto", borderRadius: "12px 12px 0 0" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.25, marginBottom: "26px" }}>
          {exp.title}
        </h1>

        {paragraphs.map((p, i) => (
          <p key={i} style={{ fontSize: "17px", color: "var(--text-soft)", lineHeight: 1.85, marginBottom: "20px", fontWeight: 300 }}>
            {p}
          </p>
        ))}

        {/* Footer — stats and the one action that is actually live */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "20px", marginTop: "12px", borderTop: "1px solid var(--border-default)", flexWrap: "wrap" as const, gap: "12px" }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>
            {exp.response_count} {exp.response_count === 1 ? "response" : "responses"}
          </span>
          <button
            onClick={handleCarryForward}
            disabled={carrying || carriedLocally}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: carriedLocally ? "rgba(191,155,78,0.12)" : "var(--permanent-gold)",
              color:      carriedLocally ? "var(--permanent-gold)" : "white",
              border:     carriedLocally ? "1px solid var(--permanent-gold)" : "none",
              borderRadius: "var(--radius-sm)",
              padding: "10px 18px",
              cursor: carriedLocally ? "default" : "pointer",
              fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600,
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={carriedLocally ? "var(--permanent-gold)" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {exp.carried_forward_count} carried this forward
          </button>
        </div>
      </div>
    </div>
  );
}