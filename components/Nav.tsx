"use client";
// components/Nav.tsx
// Smart scroll nav — hides on scroll down, reappears on scroll up.
// Giants Way standard: never jumps, never pulls, always intentional.

import { useEffect, useRef, useState } from "react";
import { AnnieUser } from "../lib/auth";
import Avatar from "./Avatar";

type Props = {
  user: AnnieUser | null;
  theme: string | undefined;
  mounted: boolean;
  onMenuOpen: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onShare: () => void;
  onToggleTheme: () => void;
};

export default function Nav({ user, theme, mounted, onMenuOpen, onSignIn, onSignOut, onShare, onToggleTheme }: Props) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastScrollY.current;

        // Show nav when: scrolling up, or near the top (within 80px)
        if (diff < -4 || currentY < 80) {
          setVisible(true);
        }
        // Hide nav when: scrolling down more than 6px and not near top
        else if (diff > 6 && currentY > 80) {
          setVisible(false);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav style={{
      position:   "fixed",
      top:        0,
      left:       0,
      right:      0,
      height:     "56px",
      background: "var(--permanent-ink)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      display:    "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding:    "0 20px",
      zIndex:     100,
      // Smooth slide up/down — no jarring jump
      transform:  visible ? "translateY(0)" : "translateY(-100%)",
      transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      willChange: "transform",
    }}>
      {/* Logo */}
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: 600, color: "var(--permanent-parchment)", letterSpacing: "0.5px" }}>
        Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
      </div>

      {/* Desktop nav */}
      <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "var(--radius-sm)", width: "34px", height: "34px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {mounted && theme === "dark" ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-parchment)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
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
            <Avatar user={user} size={30} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500, color: "rgba(246,241,234,0.75)" }}>
              {user.name.split(" ")[0]}
            </span>
            <span onClick={onSignOut} style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.35)", cursor: "pointer" }}>
              Sign out
            </span>
          </div>
        ) : (
          <span onClick={onSignIn} style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500, color: "rgba(246,241,234,0.55)", cursor: "pointer" }}>
            Sign in
          </span>
        )}

        <button onClick={onShare} style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, background: "var(--permanent-gold)", color: "white", border: "none", padding: "8px 18px", borderRadius: "var(--radius-sm)", cursor: "pointer", whiteSpace: "nowrap" }}>
          Share an experience
        </button>
      </div>

      {/* Mobile nav */}
      <div className="mobile-nav" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {user && <Avatar user={user} size={28} />}
        <button onClick={onMenuOpen} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-parchment)" strokeWidth="1.6" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    </nav>
  );
}