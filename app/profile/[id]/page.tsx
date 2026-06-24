"use client";
// app/profile/[id]/page.tsx
// Public profile page. Shows avatar, name, @username, bio, and all public experiences.
// Giants Way: Twitter/Instagram/Threads — author name click always lands here.
// Own profile shows an "Edit profile" link to /settings.
// All 8 statements applied. Zero hardcoded colors.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, AnnieUser } from "../../../lib/auth";
import { getProfileById, getExperiencesByProfile, FeedExperience, PublicProfile } from "../../../lib/experiences";
import ExperienceCard from "../../../components/ExperienceCard";

export default function ProfilePage() {
  const params = useParams();
  const profileId = params?.id as string;

  const [currentUser, setCurrentUser] = useState<AnnieUser | null>(null);
  const [profile, setProfile]         = useState<PublicProfile | null>(null);
  const [experiences, setExperiences] = useState<FeedExperience[]>([]);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);

  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);

  useEffect(() => {
    if (!profileId) return;
    (async () => {
      setLoading(true);
      const [prof, exps] = await Promise.all([
        getProfileById(profileId),
        getExperiencesByProfile(profileId, false), // false = no anonymous posts on public profile
      ]);
      if (!prof) { setNotFound(true); setLoading(false); return; }
      setProfile(prof);
      setExperiences(exps);
      setLoading(false);
    })();
  }, [profileId]);

  const isOwnProfile = currentUser?.id === profileId;
  const displayName  = profile?.full_name || "Someone";
  const initial      = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-bg)" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--surface-bg)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 300, color: "var(--text-primary)", marginBottom: "12px" }}>
          Profile not found.
        </p>
        <Link href="/" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--permanent-gold)", textDecoration: "none" }}>
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
        <Link href="/" aria-label="Back" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </Link>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </Link>
        <div style={{ width: "30px" }} />
      </div>

      {/* ── PROFILE HEADER ── */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>

          {/* Avatar */}
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "var(--gold-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 600,
              color: "var(--permanent-gold)", flexShrink: 0,
            }}>
              {initial}
            </div>
          )}

          {/* Name + username + bio */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif", fontSize: "24px",
                fontWeight: 600, color: "var(--text-primary)", margin: 0, lineHeight: 1.2,
              }}>
                {displayName}
              </h1>
              {profile?.is_verified && (
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--permanent-gold)", background: "var(--gold-soft)", borderRadius: "4px", padding: "2px 7px" }}>
                  Verified
                </span>
              )}
            </div>

            {profile?.username && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", margin: "3px 0 0 0" }}>
                @{profile.username}
              </p>
            )}

            {profile?.bio && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-soft)", margin: "10px 0 0 0", lineHeight: 1.6 }}>
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex", gap: "20px", alignItems: "center",
          padding: "14px 0",
          borderTop: "1px solid var(--border-default)",
          borderBottom: "1px solid var(--border-default)",
          marginBottom: "24px",
        }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              {experiences.length}
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              {experiences.length === 1 ? "Experience" : "Experiences"}
            </p>
          </div>
          <div style={{ width: "1px", height: "28px", background: "var(--border-default)" }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              {profile?.carried_forward_count || 0}
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
              Carried forward
            </p>
          </div>
          {isOwnProfile && (
            <>
              <div style={{ flex: 1 }} />
              <Link
                href="/settings"
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500,
                  color: "var(--text-muted)", textDecoration: "none",
                  border: "1px solid var(--border-default)", borderRadius: "8px",
                  padding: "7px 14px",
                }}>
                Edit profile
              </Link>
            </>
          )}
        </div>

        {/* ── EXPERIENCES ── */}
        {experiences.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 300, color: "var(--text-primary)", marginBottom: "8px" }}>
              Nothing shared yet.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>
              {isOwnProfile ? "Share your first experience." : "Check back later."}
            </p>
          </div>
        ) : (
          <div style={{ paddingBottom: "80px" }}>
            {experiences.map((exp) => {
              const raw     = exp.content.slice(0, 200);
              const excerpt = exp.content.length > 180
                ? raw.slice(0, raw.lastIndexOf(" ", 180)) + "…"
                : exp.content;
              const hasPhotos = !!exp.image_urls?.length;

              return (
                <Link
                  key={exp.id}
                  href={`/experience/${exp.id}`}
                  style={{ textDecoration: "none", color: "inherit", display: "block", marginBottom: "24px" }}>
                  <ExperienceCard
                    id={exp.id}
                    profileId={profileId}
                    pullQuote={exp.pull_quote || excerpt}
                    category={exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}
                    authorInitial={initial}
                    authorName={displayName}
                    authorUsername={profile?.username || null}
                    authorAvatar={profile?.avatar_url || null}
                    title={exp.title}
                    excerpt={excerpt}
                    carriedCount={exp.carried_forward_count}
                    responseCount={exp.response_count}
                    readTime={exp.read_time_minutes}
                    isLive={exp.is_live}
                    mediaType={hasPhotos ? "image" : (exp.video_url ? "video" : "none")}
                    mediaUrl={hasPhotos ? exp.image_urls[0] : (exp.video_url || undefined)}
                    imageUrls={exp.image_urls}
                    videoUrl={exp.video_url || undefined}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}