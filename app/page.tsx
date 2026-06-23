"use client";
// app/page.tsx

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnnieUser, getCurrentUser, onAuthChange, signInWithGoogle, signOut } from "../lib/auth";
import { FEED_CATEGORIES } from "../lib/categories";
import { getFeedExperiences, FeedExperience } from "../lib/experiences";
import Nav from "../components/Nav";
import SlideMenu from "../components/SlideMenu";
import ShareFlow, { PENDING_PUBLISH_KEY } from "../components/ShareFlow";
import ExperienceCard from "../components/ExperienceCard";
import ProfileSetupModal from "../components/ProfileSetupModal";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted]               = useState(false);
  const [user, setUser]                     = useState<AnnieUser | null>(null);
  const [menuOpen, setMenuOpen]             = useState(false);
  const [shareOpen, setShareOpen]           = useState(false);
  const [resumePublish, setResumePublish]   = useState(false);
  const [activeCategory, setActiveCategory] = useState("individual");
  const [experiences, setExperiences]       = useState<FeedExperience[]>([]);
  const [feedLoading, setFeedLoading]       = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const checkPendingPublish = (signedInUser: AnnieUser | null) => {
    if (!signedInUser) return;
    try {
      const pending = localStorage.getItem(PENDING_PUBLISH_KEY);
      if (pending === "true") {
        localStorage.removeItem(PENDING_PUBLISH_KEY);
        setResumePublish(true);
        setShareOpen(true);
      }
    } catch {}
  };

  useEffect(() => {
    setMounted(true);
    getCurrentUser().then((u) => {
      setUser(u);
      checkPendingPublish(u);
      if (u && !u.hasCompletedProfile) {
        setShowProfileSetup(true);
      }
    });
    const unsub = onAuthChange((u) => { setUser(u); checkPendingPublish(u); });
    return unsub;
  }, []);

  const loadFeed = async () => {
    setFeedLoading(true);
    const data = await getFeedExperiences(activeCategory);
    setExperiences(data);
    setFeedLoading(false);
  };

  useEffect(() => {
    loadFeed();
  }, [activeCategory]);

  useEffect(() => {
    const html = document.documentElement;
    if (menuOpen) {
      html.style.overflow = "hidden";
      html.style.position = "fixed";
      html.style.width    = "100%";
    } else {
      html.style.overflow = "";
      html.style.position = "";
      html.style.width    = "";
    }
    return () => {
      html.style.overflow = "";
      html.style.position = "";
      html.style.width    = "";
    };
  }, [menuOpen]);

  const handleSignIn      = () => signInWithGoogle(window.location.origin);
  const handleSignOut     = async () => { await signOut(); setUser(null); setMenuOpen(false); };
  const handleShare       = () => { setMenuOpen(false); setShareOpen(true); };
  const handleToggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const handleLogoClick   = () => {
    setShareOpen(false);
    setMenuOpen(false);
    setActiveCategory("individual");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Block UI until profile is set up
  if (showProfileSetup && user) {
    return (
      <ProfileSetupModal
        user={user}
        onDone={() => {
          setShowProfileSetup(false);
          getCurrentUser().then(setUser);
        }}
      />
    );
  }

  return (
    <>
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,14,12,0.7)", zIndex: 200, touchAction: "none" }}
        />
      )}

      <SlideMenu
        open={menuOpen}
        user={user}
        theme={theme}
        mounted={mounted}
        onClose={() => setMenuOpen(false)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onShare={handleShare}
        onToggleTheme={handleToggleTheme}
        onReadExperiences={() => {
          setMenuOpen(false);
          document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <Nav
        user={user}
        theme={theme}
        mounted={mounted}
        onMenuOpen={() => setMenuOpen(true)}
        onLogoClick={handleLogoClick}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onShare={handleShare}
        onToggleTheme={handleToggleTheme}
      />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <header style={{
        background: "var(--permanent-ink)",
        padding: "72px 24px 52px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
          width: "600px",
          height: "340px",
          background: "radial-gradient(ellipse at center, rgba(191,155,78,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "9px",
          fontWeight: 600,
          letterSpacing: "3.5px",
          textTransform: "uppercase",
          color: "var(--permanent-gold)",
          marginBottom: "18px",
          opacity: 0.85,
        }}>
          Real experiences. Real people.
        </p>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(36px, 7vw, 64px)",
          fontWeight: 300,
          color: "var(--permanent-parchment)",
          lineHeight: 1.18,
          maxWidth: "680px",
          margin: "0 auto 20px",
          letterSpacing: "-0.01em",
        }}>
          Something happened.<br />
          <em style={{ fontStyle: "italic", color: "rgba(246,241,234,0.6)" }}>Say it here.</em>
        </h1>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "14px",
          color: "rgba(246,241,234,0.42)",
          maxWidth: "340px",
          margin: "0 auto 32px",
          fontWeight: 300,
          lineHeight: 1.7,
        }}>
          People, companies, nations, and movements. Each one with something worth saying.
        </p>

        <button
          onClick={handleShare}
          style={{
            background: "var(--permanent-gold)",
            color: "white",
            border: "none",
            padding: "14px 36px",
            borderRadius: "var(--radius-sm)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.3px",
          }}>
          Share an experience
        </button>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "11px",
          color: "rgba(246,241,234,0.22)",
          marginTop: "14px",
        }}>
          Reading and sharing are free. Annie Plus starts at $1.50 a month.
        </p>
      </header>

      {/* ── FEED ──────────────────────────────────────────────────────────── */}
      <main id="feed" style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 16px" }}>

        <div style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch" as any,
          scrollbarWidth: "none" as any,
          marginBottom: "24px",
          marginLeft: "-16px",
          marginRight: "-16px",
          paddingLeft: "16px",
          paddingRight: "16px",
        }}>
          <div style={{
            display: "inline-flex",
            background: "var(--surface-card)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-md)",
            padding: "4px",
            gap: "2px",
            whiteSpace: "nowrap",
          }}>
            {FEED_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  fontFamily:   "'Inter', sans-serif",
                  fontSize:     "12px",
                  fontWeight:   activeCategory === cat.key ? 600 : 400,
                  padding:      "8px 14px",
                  borderRadius: "var(--radius-sm)",
                  cursor:       "pointer",
                  color:        activeCategory === cat.key ? "white" : "var(--text-muted)",
                  border:       "none",
                  background:   activeCategory === cat.key
                    ? (cat.isLive ? "var(--permanent-live)" : "var(--permanent-gold)")
                    : "transparent",
                  display:      "inline-flex",
                  alignItems:   "center",
                  gap:          "6px",
                  transition:   "all 0.18s",
                  whiteSpace:   "nowrap",
                }}>
                {cat.isLive && (
                  <span style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: activeCategory === "live" ? "white" : "var(--permanent-live)",
                    display: "inline-block", flexShrink: 0,
                  }} />
                )}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "20px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border-default)",
        }}>
          {feedLoading
            ? "Loading…"
            : experiences.length === 0
              ? "No experiences yet"
              : `${experiences.length} experience${experiences.length === 1 ? "" : "s"}`}
        </p>

        {feedLoading && (
          <div style={{ textAlign: "center", padding: "60px 0", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>
            Loading…
          </div>
        )}

        {!feedLoading && experiences.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, color: "var(--text-primary)", marginBottom: "10px" }}>
              Nothing here yet.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
              Be the first to share an experience in this category.
            </p>
            <button
              onClick={handleShare}
              style={{ background: "var(--permanent-gold)", color: "white", border: "none", padding: "12px 24px", borderRadius: "var(--radius-sm)", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              Share an experience
            </button>
          </div>
        )}

        {!feedLoading && experiences.map((exp) => {
          const raw     = exp.content.slice(0, 200);
          const excerpt = exp.content.length > 180
            ? raw.slice(0, raw.lastIndexOf(" ", 180)) + "…"
            : exp.content;
          const name    = exp.is_anonymous ? "Anonymous" : (exp.display_name || "Someone");
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
                authorUsername={exp.is_anonymous ? null : (exp.author_username || null)}
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
      </main>

      <ShareFlow
        open={shareOpen}
        user={user}
        onClose={() => { setShareOpen(false); setResumePublish(false); }}
        onSignIn={handleSignIn}
        onPublished={loadFeed}
        resumeDraft={resumePublish}
      />

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-nav  { display: flex !important; }
        }
        @media (min-width: 641px) {
          .desktop-nav { display: flex !important; }
          .mobile-nav  { display: none !important; }
        }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}