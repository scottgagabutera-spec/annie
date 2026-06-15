"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeType, setActiveType] = useState("Personal");

  useEffect(() => setMounted(true), []);

  const storyTypes = ["Personal", "Organization", "Nation", "History", "Live"];

  return (
    <>
      {/* NAV */}
      <nav style={{
        background: "#0F0E0C",
        padding: "0 24px",
        height: "58px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "26px",
          fontWeight: 600,
          color: "#F6F1EA",
          letterSpacing: "0.5px",
        }}>
          Annie<span style={{ color: "#B8923A" }}>.</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "6px",
              color: "#F6F1EA",
              width: "34px",
              height: "34px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F6F1EA" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F6F1EA" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            fontWeight: 500,
            color: "rgba(246,241,234,0.55)",
            cursor: "pointer",
          }}>
            Sign in
          </span>

          <button style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            background: "#B8923A",
            color: "white",
            border: "none",
            padding: "8px 18px",
            borderRadius: "4px",
            cursor: "pointer",
          }}>
            Start sharing
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header style={{
        background: "#0F0E0C",
        padding: "72px 24px 64px",
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "3px",
          textTransform: "uppercase",
          color: "#B8923A",
          marginBottom: "28px",
        }}>
          Every story that ever changed someone
        </p>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(40px, 7vw, 72px)",
          fontWeight: 300,
          lineHeight: 1.1,
          color: "#F6F1EA",
          marginBottom: "24px",
          letterSpacing: "-1px",
          maxWidth: "820px",
          marginLeft: "auto",
          marginRight: "auto",
        }}>
          Some stories <em style={{ color: "#B8923A", fontStyle: "italic" }}>change</em> the people who hear them.
        </h1>

        <p style={{
          fontSize: "16px",
          color: "rgba(246,241,234,0.52)",
          maxWidth: "520px",
          margin: "0 auto 48px",
          fontWeight: 300,
          lineHeight: 1.7,
        }}>
          Individuals, organizations, nations, and history — all speaking. All being heard.
        </p>

        {/* TYPE SELECTOR */}
        <div style={{
          display: "inline-flex",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px",
          padding: "4px",
          marginBottom: "40px",
          gap: "2px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}>
          {storyTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: activeType === type ? 600 : 500,
                padding: "9px 16px",
                borderRadius: "5px",
                cursor: "pointer",
                color: activeType === type ? "white" : "rgba(246,241,234,0.55)",
                border: "none",
                background: activeType === type
                  ? (type === "Live" ? "#C13A3A" : "#B8923A")
                  : "transparent",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}>
              {type === "Live" && (
                <span style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: activeType === "Live" ? "white" : "#C13A3A",
                  display: "inline-block",
                  flexShrink: 0,
                }} />
              )}
              {type}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              background: "#B8923A",
              color: "white",
              border: "none",
              padding: "14px 30px",
              borderRadius: "5px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}>
            Share your story
          </button>
          <button style={{
            background: "transparent",
            color: "rgba(246,241,234,0.7)",
            border: "1px solid rgba(255,255,255,0.18)",
            padding: "14px 30px",
            borderRadius: "5px",
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            cursor: "pointer",
          }}>
            Read stories
          </button>
        </div>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "11px",
          color: "rgba(246,241,234,0.3)",
          marginTop: "18px",
        }}>
          Free to read · Free to share · Annie Plus from $1.50/month
        </p>
      </header>

      {/* FEATURED STORY */}
      <main style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "48px 24px",
      }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "24px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border)",
        }}>
          Featured story
        </p>

        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          overflow: "hidden",
          cursor: "pointer",
        }}>
          {/* Pull quote — always dark */}
          <div style={{
            background: "#0F0E0C",
            padding: "36px 40px 32px",
            position: "relative",
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "90px",
              color: "#B8923A",
              opacity: 0.2,
              position: "absolute",
              top: "-8px",
              left: "30px",
              lineHeight: 1,
              pointerEvents: "none",
            }}>"</div>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "22px",
              fontStyle: "italic",
              fontWeight: 300,
              color: "#F6F1EA",
              lineHeight: 1.55,
              position: "relative",
              paddingTop: "20px",
            }}>
              I left Rwanda at seventeen with one bag and a borrowed phone number. Twenty years later I walked back in as someone who helped rebuild it.
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#B8923A",
              marginTop: "20px",
              opacity: 0.8,
            }}>Personal · Migration</p>
          </div>

          {/* Story body — responds to theme */}
          <div style={{ padding: "28px 36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "var(--gold-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "16px",
                fontWeight: 600,
                color: "#B8923A",
                flexShrink: 0,
              }}>A</div>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Amara K.</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)" }}>Shared anonymously · Kigali, Rwanda</p>
              </div>
            </div>

            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--text)",
              lineHeight: 1.28,
              marginBottom: "12px",
            }}>
              I came back to the country that broke me. Here is what I found.
            </h2>

            <p style={{
              fontSize: "15px",
              color: "var(--text-soft)",
              lineHeight: 1.72,
              marginBottom: "20px",
              fontWeight: 300,
            }}>
              The road from the airport looked the same. The trees I remembered were taller. The checkpoint was gone. I had rehearsed this moment for years and none of it prepared me for how ordinary it all felt — and how that ordinariness was the most extraordinary thing of all.
            </p>

            {/* STATS ROW — all SVG, no Unicode symbols */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "16px",
              borderTop: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>

                {/* Helped */}
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  4.2k helped
                </span>

                {/* Responses */}
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  312 responses
                </span>

                {/* Read time */}
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  8 min read
                </span>

              </div>

              {/* Read link — SVG arrow, no Unicode */}
              <span style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "#B8923A",
                cursor: "pointer",
              }}>
                Read
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B8923A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            position: "fixed",
            inset: 0,
            background: "rgba(15,14,12,0.7)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}>
          <div style={{
            background: "var(--surface)",
            borderRadius: "16px 16px 0 0",
            padding: "32px 24px 40px",
            width: "100%",
            maxWidth: "560px",
          }}>
            <div style={{
              width: "40px",
              height: "4px",
              background: "var(--border)",
              borderRadius: "2px",
              margin: "0 auto 24px",
            }} />
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "24px",
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: "8px",
            }}>Share your story</h3>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "13px",
              color: "var(--text-muted)",
              marginBottom: "24px",
            }}>Who is sharing? No credentials required.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
              {["A person", "An organization", "A nation", "Historical", "Go live", "Diary entry"].map((who) => (
                <div key={who} style={{
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "14px 16px",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text)",
                }}>
                  {who}
                </div>
              ))}
            </div>

            <button style={{
              width: "100%",
              background: "#B8923A",
              color: "white",
              border: "none",
              padding: "16px",
              borderRadius: "8px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}>
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
}