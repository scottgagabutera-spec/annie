"use client";
// app/page.tsx
// Clean orchestration — ShareFlow overlay replaces modal + /share page navigation.
// No page transition, no flash, instant open.

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
    getCurrentUser().then((u) => { setUser(u); checkPendingPublish(u); });
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

  // Slide menu scroll lock
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
  const handleReadExperiences = () => {
    setMenuOpen(false);
    document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Slide menu backdrop */}
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
        onReadExperiences={handleReadExperiences}
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

      {/* HERO */}
      <header style={{ background: "var(--permanent-ink)", padding: "108px 20px 48px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "var(--permanent-gold)", marginBottom: "24px" }}>
          A place for real experiences
        </p>

        <p style={{ fontSize: "15px", color: "rgba(246,241,234,0.52)", maxWidth: "480px", margin: "0 auto 36px", fontWeight: 300, lineHeight: 1.65 }}>
          People, companies, nations, communities, and movements. Each one with something that happened and something worth saying about it.
        </p>

        {/* Category selector */}
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any, scrollbarWidth: "none" as any, marginBottom: "32px", marginLeft: "-20px", marginRight: "-20px", paddingLeft: "20px", paddingRight: "20px" }}>
          <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", padding: "4px", gap: "2px", whiteSpace: "nowrap" }}>
            {FEED_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  fontFamily:  "'Inter', sans-serif",
                  fontSize:    "12px",
                  fontWeight:  activeCategory === cat.key ? 600 : 500,
                  padding:     "8px 14px",
                  borderRadius: "var(--radius-sm)",
                  cursor:      "pointer",
                  color:       activeCategory === cat.key ? "white" : "rgba(246,241,234,0.55)",
                  border:      "none",
                  background:  activeCategory === cat.key
                    ? (cat.isLive ? "var(--permanent-live)" : "var(--permanent-gold)")
                    : "transparent",
                  display:     "inline-flex",
                  alignItems:  "center",
                  gap:         "6px",
                  transition:  "all 0.2s",
                  whiteSpace:  "nowrap",
                }}>
                {cat.isLive && (
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: activeCategory === "live" ? "white" : "var(--permanent-live)", display: "inline-block", flexShrink: 0 }} />
                )}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", maxWidth: "320px", margin: "0 auto" }}>
          <button
            onClick={handleShare}
            style={{ background: "var(--permanent-gold)", color: "white", border: "none", padding: "14px 30px", borderRadius: "var(--radius-sm)", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, cursor: "pointer", width: "100%" }}>
            Share an experience
          </button>
          <button
            onClick={handleReadExperiences}
            style={{ background: "transparent", color: "rgba(246,241,234,0.7)", border: "1px solid rgba(255,255,255,0.18)", padding: "14px 30px", borderRadius: "var(--radius-sm)", fontFamily: "'Inter', sans-serif", fontSize: "13px", cursor: "pointer", width: "100%" }}>
            Read experiences
          </button>
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.28)", marginTop: "16px" }}>
          Reading and sharing are free. Annie Plus starts at $1.50 a month.
        </p>
      </header>

      {/* FEED */}
      <main id="feed" style={{ maxWidth: "800px", margin: "0 auto", padding: "36px 16px" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid var(--border-default)" }}>
          {feedLoading ? "Loading..." : experiences.length === 0 ? "No experiences yet" : `${experiences.length} experience${experiences.length === 1 ? "" : "s"}`}
        </p>

        {feedLoading && (
          <div style={{ textAlign: "center", padding: "60px 0", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>
            Loading experiences...
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
          const excerpt = exp.content.slice(0, 180).trim() + (exp.content.length > 180 ? "..." : "");
          const name    = exp.is_anonymous ? "Anonymous" : (exp.display_name || "Someone");
          const initial = exp.is_anonymous ? "A" : (name.charAt(0).toUpperCase() || "?");
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
              />
            </Link>
          );
        })}
      </main>

      {/* SHARE FLOW OVERLAY — no page navigation, instant */}
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