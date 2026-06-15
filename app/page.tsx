"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("individual");
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    const initAuth = async () => {
      const { supabase } = await import("../lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "You",
          email: session.user.email || "",
          avatar: session.user.user_metadata?.avatar_url || "",
        });
      }
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "You",
            email: session.user.email || "",
            avatar: session.user.user_metadata?.avatar_url || "",
          });
        } else {
          setUser(null);
        }
      });
    };
    initAuth();
  }, []);

  // Scroll lock — applied directly to html element for maximum browser compatibility
  useEffect(() => {
    const html = document.documentElement;
    if (menuOpen || modalOpen) {
      html.style.overflow = "hidden";
      html.style.position = "fixed";
      html.style.width = "100%";
    } else {
      html.style.overflow = "";
      html.style.position = "";
      html.style.width = "";
    }
    return () => {
      html.style.overflow = "";
      html.style.position = "";
      html.style.width = "";
    };
  }, [menuOpen, modalOpen]);

  const categories = [
    { key: "individual",   label: "Individual" },
    { key: "organization", label: "Company & Org" },
    { key: "nation",       label: "Nation" },
    { key: "community",    label: "Community" },
    { key: "historical",   label: "Historical" },
    { key: "live",         label: "Live" },
  ];

  const modalTypes = [
    { key: "individual",  label: "A person" },
    { key: "company",     label: "A company" },
    { key: "nonprofit",   label: "A nonprofit or NGO" },
    { key: "institution", label: "An institution" },
    { key: "government",  label: "A government or ministry" },
    { key: "nation",      label: "A nation" },
    { key: "community",   label: "A community" },
    { key: "movement",    label: "A movement" },
    { key: "faith",       label: "A faith community" },
    { key: "family",      label: "A family" },
    { key: "historical",  label: "A historical account" },
    { key: "live",        label: "Live — happening now" },
  ];

  const handleSignIn = async () => {
    const { supabase } = await import("../lib/supabase");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleSignOut = async () => {
    const { supabase } = await import("../lib/supabase");
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
  };

  const closeAll = () => {
    setMenuOpen(false);
    setModalOpen(false);
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "";

  const Avatar = ({ size = 30 }: { size?: number }) => (
    user?.avatar ? (
      <img src={user.avatar} alt={user.name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    ) : (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--permanent-gold)", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', sans-serif", fontSize: size * 0.37,
        fontWeight: 600, color: "white", flexShrink: 0,
      }}>{initials}</div>
    )
  );

  return (
    <>
      {/* BACKDROP — covers full screen, blocks all interaction behind overlays */}
      {(menuOpen || modalOpen) && (
        <div
          onClick={closeAll}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(15,14,12,0.7)",
            zIndex: 200,
            touchAction: "none",
          }}
        />
      )}

      {/* SLIDE MENU */}
      <div style={{
        position:      "fixed",
        top:           0,
        right:         menuOpen ? 0 : "-290px",
        width:         "270px",
        height:        "100%",
        background:    "var(--permanent-ink)",
        zIndex:        300,
        transition:    "right 0.25s ease",
        display:       "flex",
        flexDirection: "column",
        overflowY:     "auto",
        overscrollBehavior: "contain",
      }}>
        {/* Close row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 600, color: "var(--permanent-parchment)" }}>
            Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
          </span>
          <button onClick={closeAll} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", lineHeight: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-parchment)" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Nav links — compact, no large gaps */}
        <div style={{ padding: "4px 12px" }}>
          {[
            { label: "Read experiences", path: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" },
            { label: "My profile",       path: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
            { label: "Guides",           path: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
            { label: "Annie Plus",       path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 8px", cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(246,241,234,0.5)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.path}/>
              </svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 500, color: "rgba(246,241,234,0.75)" }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "4px 20px" }} />

        {/* Auth + theme — compact at bottom, no flex:1 spacer so no scroll needed */}
        <div style={{ padding: "8px 20px 36px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "9px 14px", cursor: "pointer", width: "100%" }}>
            {mounted && theme === "dark" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(246,241,234,0.6)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(246,241,234,0.6)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.6)" }}>
              {mounted && theme === "dark" ? "Light mode" : "Dark mode"}
            </span>
          </button>

          {/* User state */}
          {user ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 2px" }}>
                <Avatar size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--permanent-parchment)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                </div>
              </div>
              <button onClick={handleSignOut} style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "9px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.4)" }}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setModalOpen(true); setMenuOpen(false); }}
                style={{ width: "100%", background: "var(--permanent-gold)", border: "none", borderRadius: "8px", padding: "11px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white" }}>
                Share an experience
              </button>
              <button
                onClick={handleSignIn}
                style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "10px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.7)" }}>
                Sign in with Google
              </button>
            </>
          )}
        </div>
      </div>

      {/* NAV */}
      <nav style={{
        background: "var(--permanent-ink)",
        padding: "0 20px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
      }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: 600, color: "var(--permanent-parchment)", letterSpacing: "0.5px" }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </div>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "var(--radius-sm)", width: "34px", height: "34px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Toggle theme">
            {mounted && theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-parchment)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-parchment)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Avatar size={30} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500, color: "rgba(246,241,234,0.75)" }}>{user.name.split(" ")[0]}</span>
              <span onClick={handleSignOut} style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.35)", cursor: "pointer" }}>Sign out</span>
            </div>
          ) : (
            <span onClick={handleSignIn} style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500, color: "rgba(246,241,234,0.55)", cursor: "pointer" }}>Sign in</span>
          )}

          <button onClick={() => setModalOpen(true)} style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, background: "var(--permanent-gold)", color: "white", border: "none", padding: "8px 18px", borderRadius: "var(--radius-sm)", cursor: "pointer", whiteSpace: "nowrap" }}>
            Share an experience
          </button>
        </div>

        {/* Mobile nav */}
        <div className="mobile-nav" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user && <Avatar size={28} />}
          <button onClick={() => setMenuOpen(true)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-parchment)" strokeWidth="1.6" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ background: "var(--permanent-ink)", padding: "108px 20px 48px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px", fontWeight: 600, letterSpacing: "3px", textTransform: "uppercase", color: "var(--permanent-gold)", marginBottom: "24px" }}>
          Every experience worth carrying forward
        </p>

        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 7vw, 72px)", fontWeight: 300, lineHeight: 1.1, color: "var(--permanent-parchment)", marginBottom: "20px", letterSpacing: "-0.5px", maxWidth: "820px", marginLeft: "auto", marginRight: "auto" }}>
          Some experiences{" "}
          <em style={{ color: "var(--permanent-gold)", fontStyle: "italic" }}>change</em>{" "}
          the people who live them.
        </h1>

        <p style={{ fontSize: "15px", color: "rgba(246,241,234,0.52)", maxWidth: "480px", margin: "0 auto 36px", fontWeight: 300, lineHeight: 1.65 }}>
          People, companies, nations, communities, and history. All speaking. All being heard.
        </p>

        {/* CATEGORY SELECTOR */}
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any, scrollbarWidth: "none" as any, marginBottom: "32px", marginLeft: "-20px", marginRight: "-20px", paddingLeft: "20px", paddingRight: "20px" }}>
          <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", padding: "4px", gap: "2px", whiteSpace: "nowrap" }}>
            {categories.map((cat) => (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: activeCategory === cat.key ? 600 : 500, padding: "8px 14px", borderRadius: "var(--radius-sm)", cursor: "pointer", color: activeCategory === cat.key ? "white" : "rgba(246,241,234,0.55)", border: "none", background: activeCategory === cat.key ? (cat.key === "live" ? "var(--permanent-live)" : "var(--permanent-gold)") : "transparent", display: "inline-flex", alignItems: "center", gap: "6px", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                {cat.key === "live" && (
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: activeCategory === "live" ? "white" : "var(--permanent-live)", display: "inline-block", flexShrink: 0 }} />
                )}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", maxWidth: "320px", margin: "0 auto" }}>
          <button onClick={() => setModalOpen(true)} style={{ background: "var(--permanent-gold)", color: "white", border: "none", padding: "14px 30px", borderRadius: "var(--radius-sm)", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, cursor: "pointer", width: "100%" }}>
            Share an experience
          </button>
          <button style={{ background: "transparent", color: "rgba(246,241,234,0.7)", border: "1px solid rgba(255,255,255,0.18)", padding: "14px 30px", borderRadius: "var(--radius-sm)", fontFamily: "'Inter', sans-serif", fontSize: "13px", cursor: "pointer", width: "100%" }}>
            Read experiences
          </button>
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.28)", marginTop: "16px" }}>
          Free to read. Free to share. Annie Plus from $1.50/month.
        </p>
      </header>

      {/* FEATURED EXPERIENCE */}
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "36px 16px" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid var(--border-default)" }}>
          Featured experience
        </p>

        <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "hidden", cursor: "pointer" }}>
          <div style={{ background: "var(--permanent-ink)", padding: "28px 24px 24px", position: "relative" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "72px", color: "var(--permanent-gold)", opacity: 0.2, position: "absolute", top: "-4px", left: "18px", lineHeight: 1, pointerEvents: "none" }}>"</div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(17px, 4vw, 22px)", fontStyle: "italic", fontWeight: 300, color: "var(--permanent-parchment)", lineHeight: 1.55, position: "relative", paddingTop: "16px" }}>
              I left Rwanda at seventeen with one bag and a borrowed phone number. Twenty years later I walked back in as someone who helped rebuild it.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--permanent-gold)", marginTop: "16px", opacity: 0.8 }}>Individual · Migration</p>
          </div>

          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--gold-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontWeight: 600, color: "var(--permanent-gold)", flexShrink: 0 }}>A</div>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Amara K.</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)" }}>Shared anonymously. Kigali, Rwanda.</p>
              </div>
            </div>

            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.28, marginBottom: "10px" }}>
              I came back to the country that broke me. Here is what I found.
            </h2>

            <p style={{ fontSize: "15px", color: "var(--text-soft)", lineHeight: 1.72, marginBottom: "16px", fontWeight: 300 }}>
              The road from the airport looked the same. The trees I remembered were taller. The checkpoint was gone. I had rehearsed this moment for years and none of it prepared me for how ordinary it all felt.
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "14px", borderTop: "1px solid var(--border-default)", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  4.2k carried this forward
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  312 responses
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  8 min read
                </span>
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, color: "var(--permanent-gold)", cursor: "pointer" }}>
                Read
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL */}
      {modalOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            bottom: 0, left: 0, right: 0,
            zIndex: 300,
            background: "var(--surface-card)",
            borderRadius: "16px 16px 0 0",
            padding: "24px 20px 48px",
            maxHeight: "85dvh",
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}>
          <div style={{ width: "36px", height: "4px", background: "var(--border-default)", borderRadius: "2px", margin: "0 auto 20px" }} />
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>Share an experience</h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Who is sharing? No credentials required.</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
            {modalTypes.map((type) => (
              <div key={type.key} style={{ border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", padding: "12px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                {type.label}
              </div>
            ))}
          </div>

          <button style={{ width: "100%", background: "var(--permanent-gold)", color: "white", border: "none", padding: "15px", borderRadius: "var(--radius-md)", fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            Continue
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
        @media (min-width: 641px) {
          .desktop-nav { display: flex !important; }
          .mobile-nav { display: none !important; }
        }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}