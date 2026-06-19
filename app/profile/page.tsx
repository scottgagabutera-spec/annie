"use client";
// app/profile/page.tsx
// A signed-in person's own experiences — a table of contents, not a feed.
// Public profile pages for other people live at /profile/[id].
// Mobile First, Premium, Modern, Giants Way, User Friendly, Logical,
// Long Term, Unique, Consistent. Zero hardcoded colors.

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnnieUser, getCurrentUser, onAuthChange, signInWithGoogle } from "../../lib/auth";
import { getExperiencesByProfile, FeedExperience } from "../../lib/experiences";
import Avatar from "../../components/Avatar";

const CATEGORY_LABELS: Record<string, string> = {
  individual: "Individual",
  organization: "Organization",
  nation: "Nation",
  historical: "Historical",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const [user, setUser]               = useState<AnnieUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [experiences, setExperiences] = useState<FeedExperience[]>([]);
  const [loading, setLoading]         = useState(true);

  const loadExperiences = async (profileId: string) => {
    setLoading(true);
    const data = await getExperiencesByProfile(profileId, true);
    setExperiences(data);
    setLoading(false);
  };

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u); setAuthChecked(true);
      if (u) loadExperiences(u.id);
      else setLoading(false);
    });
    const unsub = onAuthChange((u) => {
      setUser(u); setAuthChecked(true);
      if (u) loadExperiences(u.id);
    });
    return unsub;
  }, []);

  const handleSignIn = () => signInWithGoogle(window.location.origin);

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-bg)" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>
          Loading...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--surface-bg)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 300, color: "var(--text-primary)", marginBottom: "12px" }}>
          Sign in to see your profile.
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
          Your shared experiences live here once you are signed in.
        </p>
        <button
          onClick={handleSignIn}
          style={{ background: "var(--permanent-gold)", color: "white", border: "none", padding: "13px 28px", borderRadius: "var(--radius-sm)", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginBottom: "16px" }}>
          Continue with Google
        </button>
        <Link href="/" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>
          Back to Annie
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-bg)" }}>

      {/* ── TOP BAR ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: "56px",
        background: "var(--surface-bg)",
        borderBottom: "1px solid var(--border-default)",
      }}>
        <Link href="/" aria-label="Back to Annie" style={{
          background: "transparent", border: "none", cursor: "pointer",
          padding: "6px", display: "flex", alignItems: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--text-primary)" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </Link>
        <Link href="/" style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "20px",
          fontWeight: 600, color: "var(--text-primary)", textDecoration: "none",
        }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </Link>
        <Link href="/settings" aria-label="Settings" style={{
          background: "transparent", border: "none", cursor: "pointer",
          padding: "6px", display: "flex", alignItems: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--text-primary)" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </Link>
      </div>

      {/* ── PROFILE HEADER ── */}
      <div style={{
        maxWidth: "680px", margin: "0 auto",
        padding: "40px 24px 28px",
        display: "flex", alignItems: "center", gap: "16px",
      }}>
        <Avatar user={user} size={56} />
        <div>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "24px",
            fontWeight: 600, color: "var(--text-primary)", margin: 0,
          }}>
            {user.name}
          </p>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: "13px",
            color: "var(--text-muted)", margin: "4px 0 0",
          }}>
            {experiences.length} {experiences.length === 1 ? "experience" : "experiences"} shared
          </p>
        </div>
      </div>

      {/* ── EXPERIENCE LIST ── */}
      <div style={{
        borderTop: "1px solid var(--border-default)",
        minHeight: "40vh", padding: "8px 24px 60px",
      }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>

          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>
              Loading your experiences...
            </div>
          )}

          {!loading && experiences.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, color: "var(--text-primary)", marginBottom: "10px" }}>
                You have not shared anything yet.
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
                Whatever you have lived is worth telling.
              </p>
              <Link href="/" style={{ background: "var(--permanent-gold)", color: "white", border: "none", padding: "12px 24px", borderRadius: "var(--radius-sm)", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
                Share an experience
              </Link>
            </div>
          )}

          {!loading && experiences.map((exp, i) => {
            const isAnon = exp.is_anonymous;
            return (
              <Link
                key={exp.id}
                href={`/experience/${exp.id}`}
                style={{
                  textDecoration: "none", color: "inherit", display: "block",
                  padding: "18px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--border-default)",
                }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600,
                    letterSpacing: "0.04em", textTransform: "uppercase",
                    color: "var(--permanent-gold)",
                  }}>
                    {CATEGORY_LABELS[exp.category] || exp.category}
                  </span>
                  {exp.is_live && (
                    <span style={{
                      fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 700,
                      letterSpacing: "0.04em", textTransform: "uppercase",
                      color: "var(--permanent-live)",
                    }}>
                      ● Live
                    </span>
                  )}
                </div>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif", fontSize: "19px",
                  fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px",
                  lineHeight: 1.3,
                }}>
                  {exp.title}
                  {isAnon && (
                    <span style={{
                      fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 400,
                      color: "var(--text-muted)", marginLeft: "8px",
                    }}>
                      (posted anonymously)
                    </span>
                  )}
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontSize: "12px",
                  color: "var(--text-muted)", margin: 0,
                }}>
                  {formatDate(exp.created_at)} · {exp.read_time_minutes} min read
                  {exp.carried_forward_count > 0 && ` · carried forward ${exp.carried_forward_count}×`}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}