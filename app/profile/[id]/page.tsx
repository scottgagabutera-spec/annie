"use client";
// app/profile/[id]/page.tsx
// Anyone's public profile — guests and other signed-in users can view this.
// Read only. No edit, no delete, no settings link. If the id belongs to the
// currently signed-in person, we redirect to /profile (the owner's view),
// so there is exactly one URL for "my own profile" and one shape for
// "someone else's profile" — Logical, Consistent.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, AnnieUser } from "../../../lib/auth";
import {
  getExperiencesByProfile,
  getProfileById,
  FeedExperience,
  PublicProfile,
} from "../../../lib/experiences";

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

// Local avatar render — profiles rows use full_name/avatar_url, which is a
// different shape from AnnieUser (name/avatar). Rather than change Avatar's
// prop contract used elsewhere (Settings, own Profile, feed), we render the
// same visual here directly so nothing else is put at risk.
function ProfileAvatar({ name, avatarUrl, size = 56 }: { name: string; avatarUrl: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--permanent-gold)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      fontSize: size * 0.37,
      fontWeight: 600, color: "white", flexShrink: 0,
    }}>
      {initials || "?"}
    </div>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params?.id as string;

  const [viewer, setViewer]           = useState<AnnieUser | null>(null);
  const [viewerChecked, setViewerChecked] = useState(false);
  const [profile, setProfile]         = useState<PublicProfile | null>(null);
  const [experiences, setExperiences] = useState<FeedExperience[]>([]);
  const [notFound, setNotFound]       = useState(false);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setViewer(u);
      setViewerChecked(true);
      // If you land on your own public URL, the owner view at /profile is
      // the correct page — same person, one canonical place to manage it.
      if (u && u.id === profileId) {
        router.replace("/profile");
      }
    });
  }, [profileId, router]);

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    Promise.all([getProfileById(profileId), getExperiencesByProfile(profileId)]).then(
      ([profileData, expData]) => {
        if (!profileData) {
          setNotFound(true);
        } else {
          setProfile(profileData);
          setExperiences(expData);
        }
        setLoading(false);
      }
    );
  }, [profileId]);

  // Avoid a flash of someone's public profile if we're about to redirect
  // them to their own owner view.
  if (viewerChecked && viewer && viewer.id === profileId) {
    return null;
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-bg)" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>
          Loading...
        </p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--surface-bg)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: 300, color: "var(--text-primary)", marginBottom: "12px" }}>
          This profile does not exist.
        </p>
        <Link href="/" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>
          Back to Annie
        </Link>
      </div>
    );
  }

  const displayName = profile.full_name || "Annie member";

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
        <button
          onClick={() => router.back()}
          aria-label="Back"
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            padding: "6px", display: "flex", alignItems: "center",
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="var(--text-primary)" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <Link href="/" style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "20px",
          fontWeight: 600, color: "var(--text-primary)", textDecoration: "none",
        }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </Link>
        <div style={{ width: "30px" }} />
      </div>

      {/* ── PROFILE HEADER ── */}
      <div style={{
        maxWidth: "680px", margin: "0 auto",
        padding: "40px 24px 28px",
        display: "flex", alignItems: "center", gap: "16px",
      }}>
        <ProfileAvatar name={displayName} avatarUrl={profile.avatar_url} size={56} />
        <div>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "24px",
            fontWeight: 600, color: "var(--text-primary)", margin: 0,
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            {displayName}
            {profile.is_verified && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--permanent-gold)" aria-label="Verified">
                <path d="M12 2l2.4 2.4 3.3-.6.6 3.3L21 9l-2.4 2.4.6 3.3-3.3.6L12 22l-2.4-2.4-3.3.6-.6-3.3L3 12l2.4-2.4-.6-3.3 3.3-.6L12 2z"/>
              </svg>
            )}
          </p>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: "13px",
            color: "var(--text-muted)", margin: "4px 0 0",
          }}>
            {profile.is_guide && "Guide · "}
            {experiences.length} {experiences.length === 1 ? "experience" : "experiences"} shared
          </p>
        </div>
      </div>

      {profile.bio && (
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 24px 24px" }}>
          <p style={{
            fontFamily: "'Source Serif 4', serif", fontSize: "15px",
            color: "var(--text-soft)", margin: 0, lineHeight: 1.6,
          }}>
            {profile.bio}
          </p>
        </div>
      )}

      {/* ── EXPERIENCE LIST ── */}
      <div style={{
        borderTop: "1px solid var(--border-default)",
        minHeight: "40vh", padding: "8px 24px 60px",
      }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>

          {experiences.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 300, color: "var(--text-primary)" }}>
                Nothing shared yet.
              </p>
            </div>
          )}

          {experiences.map((exp, i) => (
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
              </p>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: "12px",
                color: "var(--text-muted)", margin: 0,
              }}>
                {formatDate(exp.created_at)} · {exp.read_time_minutes} min read
                {exp.carried_forward_count > 0 && ` · carried forward ${exp.carried_forward_count}×`}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}