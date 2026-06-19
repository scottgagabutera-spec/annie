"use client";
// app/profile/page.tsx
// A signed-in person's own experiences, all in one place.
// Public profile pages for other people are a separate, later piece of scope.

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnnieUser, getCurrentUser, onAuthChange, signInWithGoogle } from "../../lib/auth";
import { getExperiencesByProfile, FeedExperience } from "../../lib/experiences";
import ExperienceCard from "../../components/ExperienceCard";
import Avatar from "../../components/Avatar";

export default function ProfilePage() {
  const [user, setUser]               = useState<AnnieUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [experiences, setExperiences] = useState<FeedExperience[]>([]);
  const [loading, setLoading]         = useState(true);

  const loadExperiences = async (profileId: string) => {
    setLoading(true);
    const data = await getExperiencesByProfile(profileId);
    setExperiences(data);
    setLoading(false);
  };

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setAuthChecked(true);
      if (u) loadExperiences(u.id);
      else setLoading(false);
    });
    const unsub = onAuthChange((u) => {
      setUser(u);
      setAuthChecked(true);
      if (u) loadExperiences(u.id);
    });
    return unsub;
  }, []);

  const handleSignIn = () => signInWithGoogle(window.location.origin);

  if (!authChecked) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--permanent-ink)" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.4)" }}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--permanent-ink)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 300, color: "var(--permanent-parchment)", marginBottom: "12px" }}>
          Sign in to see your profile.
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.45)", marginBottom: "24px" }}>
          Your shared experiences live here once you're signed in.
        </p>
        <button
          onClick={handleSignIn}
          style={{ background: "var(--permanent-gold)", color: "white", border: "none", padding: "13px 28px", borderRadius: "var(--radius-sm)", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginBottom: "16px" }}>
          Continue with Google
        </button>
        <Link href="/" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.4)", textDecoration: "none" }}>
          Back to Annie
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--permanent-ink)" }}>

      {/* Top bar — same pattern as the reading page, so navigation feels consistent everywhere */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "56px", background: "var(--permanent-ink)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" aria-label="Back to Annie" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-parchment)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </Link>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 600, color: "var(--permanent-parchment)", textDecoration: "none" }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </Link>
        <div style={{ width: "30px" }} />
      </div>

      {/* Header */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 24px 28px", display: "flex", alignItems: "center", gap: "16px" }}>
        <Avatar user={user} size={56} />
        <div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: 600, color: "var(--permanent-parchment)", margin: 0 }}>
            {user.name}
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.45)", margin: "4px 0 0" }}>
            {experiences.length} {experiences.length === 1 ? "experience" : "experiences"} shared
          </p>
        </div>
      </div>

      {/* List */}
      <div style={{ background: "var(--surface-card)", minHeight: "40vh", padding: "8px 16px 60px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", paddingTop: "24px" }}>

          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>
              Loading your experiences...
            </div>
          )}

          {!loading && experiences.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, color: "var(--text-primary)", marginBottom: "10px" }}>
                You haven't shared anything yet.
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
                Whatever you have lived is worth telling.
              </p>
              <Link href="/" style={{ background: "var(--permanent-gold)", color: "white", border: "none", padding: "12px 24px", borderRadius: "var(--radius-sm)", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, textDecoration: "none", display: "inline-block" }}>
                Share an experience
              </Link>
            </div>
          )}

          {!loading && experiences.map((exp) => {
            const excerpt = exp.content.slice(0, 180).trim() + (exp.content.length > 180 ? "..." : "");
            const name    = exp.is_anonymous ? "Anonymous" : (exp.display_name || user.name);
            const initial = exp.is_anonymous ? "A" : (name.charAt(0).toUpperCase() || "?");
            const hasPhotos = !!exp.image_urls?.length;
            return (
              <Link
                key={exp.id}
                href={`/experience/${exp.id}`}
                style={{ textDecoration: "none", color: "inherit", display: "block", marginBottom: "24px" }}>
                <ExperienceCard
                  pullQuote={exp.pull_quote || excerpt}
                  category={exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}
                  authorInitial={initial}
                  authorName={name}
                  title={exp.title}
                  excerpt={excerpt}
                  carriedCount={exp.carried_forward_count}
                  responseCount={exp.response_count}
                  readTime={exp.read_time_minutes}
                  isLive={exp.is_live}
                  mediaType={hasPhotos ? "image" : (exp.video_url ? "video" : "none")}
                  mediaUrl={hasPhotos ? exp.image_urls[0] : (exp.video_url || undefined)}
                  imageUrls={exp.image_urls}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}