"use client";
// components/SlideMenu.tsx
// Mobile slide-in menu. Receives user + handlers as props — no auth logic inside.

import Link from "next/link";
import { AnnieUser } from "../lib/auth";
import Avatar from "./Avatar";

type Props = {
  open: boolean;
  user: AnnieUser | null;
  theme: string | undefined;
  mounted: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onShare: () => void;
  onToggleTheme: () => void;
  onReadExperiences: () => void;
};

const NAV_LINKS = [
  {
    label: "Read experiences",
    type:  "scroll" as const,
    path:  "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
  },
  {
    label: "My profile",
    type:  "link" as const,
    href:  "/profile",
    path:  "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  },
  {
    label: "Settings",
    type:  "link" as const,
    href:  "/settings",
    path:  "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z",
  },
  {
    label: "Annie Plus",
    type:  "link" as const,
    href:  "/plus",
    path:  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
];

export default function SlideMenu({ open, user, theme, mounted, onClose, onSignIn, onSignOut, onShare, onToggleTheme, onReadExperiences }: Props) {
  return (
    <div style={{
      position:      "fixed",
      top:           0,
      right:         open ? 0 : "-290px",
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
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 600, color: "var(--permanent-parchment)" }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", lineHeight: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-parchment)" strokeWidth="1.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Nav links — every item here actually goes somewhere */}
      <div style={{ padding: "4px 12px" }}>
        {NAV_LINKS.map((item) => {
          const inner = (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(246,241,234,0.5)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.path}/>
              </svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: 500, color: "rgba(246,241,234,0.75)" }}>{item.label}</span>
            </>
          );

          if (item.type === "link") {
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 8px", cursor: "pointer", textDecoration: "none" }}>
                {inner}
              </Link>
            );
          }

          return (
            <div
              key={item.label}
              onClick={() => { onReadExperiences(); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 8px", cursor: "pointer" }}>
              {inner}
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "4px 20px" }} />

      {/* Bottom section */}
      <div style={{ padding: "8px 20px 36px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Theme toggle */}
        <button onClick={onToggleTheme} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "9px 14px", cursor: "pointer", width: "100%" }}>
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

        {/* Auth */}
        {user ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 2px" }}>
              <Avatar user={user} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--permanent-parchment)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
              </div>
            </div>
            <button onClick={onSignOut} style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "9px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.4)" }}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <button onClick={onShare} style={{ width: "100%", background: "var(--permanent-gold)", border: "none", borderRadius: "8px", padding: "11px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white" }}>
              Share an experience
            </button>
            <button onClick={onSignIn} style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "10px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.7)" }}>
              Sign in with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}