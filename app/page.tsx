"use client";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("individual");

  useEffect(() => setMounted(true), []);

  const categories = [
    { key: "individual",   label: t("categories.individual") },
    { key: "organization", label: t("categories.organization") },
    { key: "nation",       label: t("categories.nation") },
    { key: "community",    label: t("categories.community") },
    { key: "historical",   label: t("categories.historical") },
    { key: "live",         label: t("categories.live") },
  ];

  const modalTypes = [
    { key: "individual",   label: t("modal.types.individual") },
    { key: "organization", label: t("modal.types.organization") },
    { key: "nation",       label: t("modal.types.nation") },
    { key: "community",    label: t("modal.types.community") },
    { key: "live",         label: t("modal.types.live") },
    { key: "historical",   label: t("modal.types.historical") },
  ];

  return (
    <>
      {/* NAV — permanent ink, never changes with theme */}
      <nav style={{
        background:     "var(--permanent-ink)",
        padding:        "0 24px",
        height:         "58px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        position:       "sticky",
        top:            0,
        zIndex:         100,
      }}>
        <div style={{
          fontFamily:    "'Cormorant Garamond', serif",
          fontSize:      "26px",
          fontWeight:    600,
          color:         "var(--permanent-parchment)",
          letterSpacing: "0.5px",
        }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
              background:      "rgba(255,255,255,0.08)",
              border:          "1px solid rgba(255,255,255,0.12)",
              borderRadius:    "var(--radius-sm)",
              color:           "var(--permanent-parchment)",
              width:           "34px",
              height:          "34px",
              cursor:          "pointer",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              flexShrink:      0,
            }}
            aria-label={t("theme.toggle_label")}
          >
            {mounted && theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-parchment)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <line x1="12" y1="2" x2="12" y2="4"/>
                <line x1="12" y1="20" x2="12" y2="22"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="2" y1="12" x2="4" y2="12"/>
                <line x1="20" y1="12" x2="22" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-parchment)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   "12px",
            fontWeight: 500,
            color:      "rgba(246,241,234,0.55)",
            cursor:     "pointer",
          }}>
            {t("nav.signin")}
          </span>

          <button style={{
            fontFamily:   "'Inter', sans-serif",
            fontSize:     "12px",
            fontWeight:   600,
            background:   "var(--permanent-gold)",
            color:        "white",
            border:       "none",
            padding:      "8px 18px",
            borderRadius: "var(--radius-sm)",
            cursor:       "pointer",
          }}>
            {t("nav.cta")}
          </button>
        </div>
      </nav>

      {/* HERO — permanent ink, never changes with theme */}
      <header style={{
        background:  "var(--permanent-ink)",
        padding:     "72px 24px 64px",
        textAlign:   "center",
      }}>
        <p style={{
          fontFamily:      "'Inter', sans-serif",
          fontSize:        "10px",
          fontWeight:      600,
          letterSpacing:   "3px",
          textTransform:   "uppercase",
          color:           "var(--permanent-gold)",
          marginBottom:    "28px",
        }}>
          {t("hero.tagline")}
        </p>

        <h1 style={{
          fontFamily:   "'Cormorant Garamond', serif",
          fontSize:     "clamp(40px, 7vw, 72px)",
          fontWeight:   300,
          lineHeight:   1.1,
          color:        "var(--permanent-parchment)",
          marginBottom: "24px",
          letterSpacing:"-1px",
          maxWidth:     "820px",
          marginLeft:   "auto",
          marginRight:  "auto",
        }}>
          {t("hero.headline_start")}{" "}
          <em style={{ color: "var(--permanent-gold)", fontStyle: "italic" }}>
            {t("hero.headline_emphasis")}
          </em>{" "}
          {t("hero.headline_end")}
        </h1>

        <p style={{
          fontSize:     "16px",
          color:        "rgba(246,241,234,0.52)",
          maxWidth:     "520px",
          margin:       "0 auto 48px",
          fontWeight:   300,
          lineHeight:   1.7,
        }}>
          {t("hero.subheadline")}
        </p>

        {/* CATEGORY SELECTOR */}
        <div style={{
          display:         "inline-flex",
          background:      "rgba(255,255,255,0.06)",
          border:          "1px solid rgba(255,255,255,0.1)",
          borderRadius:    "var(--radius-md)",
          padding:         "4px",
          marginBottom:    "40px",
          gap:             "2px",
          flexWrap:        "wrap",
          justifyContent:  "center",
        }}>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                fontFamily:  "'Inter', sans-serif",
                fontSize:    "12px",
                fontWeight:  activeCategory === cat.key ? 600 : 500,
                padding:     "9px 16px",
                borderRadius:"var(--radius-sm)",
                cursor:      "pointer",
                color:       activeCategory === cat.key ? "white" : "rgba(246,241,234,0.55)",
                border:      "none",
                background:  activeCategory === cat.key
                  ? (cat.key === "live" ? "var(--permanent-live)" : "var(--permanent-gold)")
                  : "transparent",
                display:     "flex",
                alignItems:  "center",
                gap:         "6px",
                transition:  "all 0.2s",
              }}>
              {cat.key === "live" && (
                <span style={{
                  width:        "6px",
                  height:       "6px",
                  borderRadius: "50%",
                  background:   activeCategory === "live" ? "white" : "var(--permanent-live)",
                  display:      "inline-block",
                  flexShrink:   0,
                }} />
              )}
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              background:   "var(--permanent-gold)",
              color:        "white",
              border:       "none",
              padding:      "14px 30px",
              borderRadius: "var(--radius-sm)",
              fontFamily:   "'Inter', sans-serif",
              fontSize:     "13px",
              fontWeight:   600,
              cursor:       "pointer",
            }}>
            {t("hero.cta_primary")}
          </button>
          <button style={{
            background:   "transparent",
            color:        "rgba(246,241,234,0.7)",
            border:       "1px solid rgba(255,255,255,0.18)",
            padding:      "14px 30px",
            borderRadius: "var(--radius-sm)",
            fontFamily:   "'Inter', sans-serif",
            fontSize:     "13px",
            cursor:       "pointer",
          }}>
            {t("hero.cta_secondary")}
          </button>
        </div>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize:   "11px",
          color:      "rgba(246,241,234,0.3)",
          marginTop:  "18px",
        }}>
          {t("hero.footer_note")}
        </p>
      </header>

      {/* FEATURED EXPERIENCE */}
      <main style={{
        maxWidth: "800px",
        margin:   "0 auto",
        padding:  "48px 24px",
      }}>
        <p style={{
          fontFamily:    "'Inter', sans-serif",
          fontSize:      "10px",
          fontWeight:    700,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          color:         "var(--text-muted)",
          marginBottom:  "24px",
          paddingBottom: "12px",
          borderBottom:  "1px solid var(--border-default)",
        }}>
          {t("feed.featured_label")}
        </p>

        <div style={{
          background:   "var(--surface-card)",
          border:       "1px solid var(--border-default)",
          borderRadius: "var(--radius-sm)",
          overflow:     "hidden",
          cursor:       "pointer",
        }}>
          {/* Pull quote — permanent ink */}
          <div style={{
            background: "var(--permanent-ink)",
            padding:    "36px 40px 32px",
            position:   "relative",
          }}>
            <div style={{
              fontFamily:    "'Cormorant Garamond', serif",
              fontSize:      "90px",
              color:         "var(--permanent-gold)",
              opacity:       0.2,
              position:      "absolute",
              top:           "-8px",
              left:          "30px",
              lineHeight:    1,
              pointerEvents: "none",
            }}>"</div>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize:   "22px",
              fontStyle:  "italic",
              fontWeight: 300,
              color:      "var(--permanent-parchment)",
              lineHeight: 1.55,
              position:   "relative",
              paddingTop: "20px",
            }}>
              I left Rwanda at seventeen with one bag and a borrowed phone number. Twenty years later I walked back in as someone who helped rebuild it.
            </p>
            <p style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      "10px",
              fontWeight:    600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color:         "var(--permanent-gold)",
              marginTop:     "20px",
              opacity:       0.8,
            }}>Individual · Migration</p>
          </div>

          {/* Story body — theme responsive */}
          <div style={{ padding: "28px 36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width:          "38px",
                height:         "38px",
                borderRadius:   "50%",
                background:     "var(--gold-soft)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontFamily:     "'Cormorant Garamond', serif",
                fontSize:       "16px",
                fontWeight:     600,
                color:          "var(--permanent-gold)",
                flexShrink:     0,
              }}>A</div>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Amara K.</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)" }}>{t("story.anonymous")} · Kigali, Rwanda</p>
              </div>
            </div>

            <h2 style={{
              fontFamily:   "'Cormorant Garamond', serif",
              fontSize:     "24px",
              fontWeight:   600,
              color:        "var(--text-primary)",
              lineHeight:   1.28,
              marginBottom: "12px",
            }}>
              I came back to the country that broke me. Here is what I found.
            </h2>

            <p style={{
              fontSize:     "15px",
              color:        "var(--text-soft)",
              lineHeight:   1.72,
              marginBottom: "20px",
              fontWeight:   300,
            }}>
              The road from the airport looked the same. The trees I remembered were taller. The checkpoint was gone. I had rehearsed this moment for years and none of it prepared me for how ordinary it all felt — and how that ordinariness was the most extraordinary thing of all.
            </p>

            {/* STATS ROW */}
            <div style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              paddingTop:     "16px",
              borderTop:      "1px solid var(--border-default)",
            }}>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>

                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  4.2k {t("story.carried_forward")}
                </span>

                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  312 {t("story.responses")}
                </span>

                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  8 {t("story.read_time")}
                </span>

              </div>

              <span style={{
                display:    "flex",
                alignItems: "center",
                gap:        "4px",
                fontFamily: "'Inter', sans-serif",
                fontSize:   "12px",
                fontWeight: 600,
                color:      "var(--permanent-gold)",
                cursor:     "pointer",
              }}>
                {t("story.read_cta")}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL */}
      {modalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
          style={{
            position:       "fixed",
            inset:          0,
            background:     "rgba(15,14,12,0.7)",
            zIndex:         200,
            display:        "flex",
            alignItems:     "flex-end",
            justifyContent: "center",
          }}>
          <div style={{
            background:   "var(--surface-card)",
            borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
            padding:      "32px 24px 40px",
            width:        "100%",
            maxWidth:     "560px",
          }}>
            <div style={{
              width:        "40px",
              height:       "4px",
              background:   "var(--border-default)",
              borderRadius: "2px",
              margin:       "0 auto 24px",
            }} />
            <h3 style={{
              fontFamily:   "'Cormorant Garamond', serif",
              fontSize:     "24px",
              fontWeight:   600,
              color:        "var(--text-primary)",
              marginBottom: "8px",
            }}>{t("modal.title")}</h3>
            <p style={{
              fontFamily:   "'Inter', sans-serif",
              fontSize:     "13px",
              color:        "var(--text-muted)",
              marginBottom: "24px",
            }}>{t("modal.subtitle")}</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
              {modalTypes.map((type) => (
                <div key={type.key} style={{
                  border:       "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  padding:      "14px 16px",
                  cursor:       "pointer",
                  fontFamily:   "'Inter', sans-serif",
                  fontSize:     "13px",
                  fontWeight:   500,
                  color:        "var(--text-primary)",
                }}>
                  {type.label}
                </div>
              ))}
            </div>

            <button style={{
              width:        "100%",
              background:   "var(--permanent-gold)",
              color:        "white",
              border:       "none",
              padding:      "16px",
              borderRadius: "var(--radius-md)",
              fontFamily:   "'Inter', sans-serif",
              fontSize:     "14px",
              fontWeight:   600,
              cursor:       "pointer",
            }}>
              {t("modal.continue")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}