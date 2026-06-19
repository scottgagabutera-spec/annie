"use client";
// components/Nav.tsx

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnnieUser } from "../lib/auth";
import Avatar from "./Avatar";

type Props = {
  user: AnnieUser | null;
  theme: string | undefined;
  mounted: boolean;
  onMenuOpen: () => void;
  onLogoClick: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onShare: () => void;
  onToggleTheme: () => void;
};

export default function Nav({ user, theme, mounted, onMenuOpen, onLogoClick, onSignIn, onSignOut, onShare, onToggleTheme }: Props) {
  const [visible, setVisible]           = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const ticking    = useRef(false);
  const menuRef    = useRef<HTMLDivElement>(null);

  // Smart scroll hide/show
  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastScrollY.current;
        if (diff < -4 || currentY < 80) setVisible(true);
        else if (diff > 6 && currentY > 80) setVisible(false);
        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside to dismiss — standard on every premium product
  useEffect(() => {
    if (!accountMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [accountMenuOpen]);

  const closeMenu = () => setAccountMenuOpen(false);

  return (
    <nav style={{
      position:       "fixed",
      top:            0,
      left:           0,
      right:          0,
      height:         "56px",
      background:     "var(--permanent-ink)",
      borderBottom:   "1px solid rgba(255,255,255,0.06)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      padding:        "0 20px",
      zIndex:         100,
      transform:      visible ? "translateY(0)" : "translateY(-100%)",
      transition:     "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      willChange:     "transform",
    }}>

      {/* Logo */}
      <button
        onClick={onLogoClick}
        aria-label="Annie — go to homepage"
        style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: 600, color: "var(--permanent-parchment)", letterSpacing: "0.5px", lineHeight: 1 }}>
        Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
      </button>

      {/* ── DESKTOP ── */}
      <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "16px" }}>

        {/* Theme toggle */}
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
          <div ref={menuRef} style={{ position: "relative" }}>
            {/* Avatar trigger */}
            <button
              onClick={() => setAccountMenuOpen((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
              <Avatar user={user} size={30} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500, color: "rgba(246,241,234,0.75)" }}>
                {user.name.split(" ")[0]}
              </span>
              {/* Chevron — signals it's a menu */}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(246,241,234,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: accountMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s ease" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Dropdown — click outside closes it */}
            {accountMenuOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, background: "#16140f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", minWidth: "210px", overflow: "hidden", zIndex: 160, boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}>

                {/* User identity at top */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--permanent-parchment)", margin: 0 }}>{user.name}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.35)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
                </div>

                {/* Navigation items */}
                {[
                  { label: "My profile",     href: "/profile" },
                  { label: "My experiences", href: "/profile" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={closeMenu}
                    style={{ display: "block", padding: "11px 16px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.8)", textDecoration: "none" }}>
                    {item.label}
                  </Link>
                ))}

                {/* Annie Plus — investor-visible monetisation surface */}
                <Link
                  href="/plus"
                  onClick={closeMenu}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.8)", textDecoration: "none", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  Annie Plus
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--permanent-gold)", background: "rgba(191,155,78,0.12)", border: "1px solid rgba(191,155,78,0.25)", borderRadius: "4px", padding: "2px 6px" }}>
                    Soon
                  </span>
                </Link>

                {/* Notifications — shows the social layer is planned */}
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.45)", cursor: "default", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  Notifications
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(246,241,234,0.3)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", padding: "2px 6px" }}>
                    Soon
                  </span>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />

                {/* Settings */}
                <Link
                  href="/settings"
                  onClick={closeMenu}
                  style={{ display: "block", padding: "11px 16px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.8)", textDecoration: "none" }}>
                  Settings
                </Link>

                {/* Sign out */}
                <button
                  onClick={() => { closeMenu(); onSignOut(); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 16px", background: "transparent", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.4)" }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <span onClick={onSignIn} style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 500, color: "rgba(246,241,234,0.55)", cursor: "pointer" }}>
            Sign in
          </span>
        )}

        <button
          onClick={onShare}
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, background: "var(--permanent-gold)", color: "white", border: "none", padding: "8px 18px", borderRadius: "var(--radius-sm)", cursor: "pointer", whiteSpace: "nowrap" }}>
          Share an experience
        </button>
      </div>

      {/* ── MOBILE ── */}
      <div className="mobile-nav" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {user && (
          <Link href="/profile" aria-label="Your profile" style={{ display: "flex", alignItems: "center" }}>
            <Avatar user={user} size={28} />
          </Link>
        )}
        <button
          onClick={onMenuOpen}
          aria-label="Open menu"
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center" }}>
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