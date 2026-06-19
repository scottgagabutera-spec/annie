"use client";
// components/ExperienceCard.tsx
// Handles card media: photo carousel (swipeable, multi-photo), video embed (live),
// and live-event state. The "Respond" control is visible but not yet wired —
// honest disabled state, matching the same treatment used in the editor.

import { useRef, useState } from "react";
import { parseVideoUrl } from "../lib/experiences";

type MediaType = "image" | "video" | "none";

type Props = {
  // Core content
  pullQuote:     string;
  category:      string;
  tag?:          string;
  authorInitial: string;
  authorName:    string;
  authorNote?:   string;
  title:         string;
  excerpt?:      string;

  // Media
  mediaType?:    MediaType;
  mediaUrl?:     string;      // image URL (first photo) or YouTube/Vimeo link
  imageUrls?:    string[];    // full set of photos, for the carousel
  mediaCount?:   number;      // deprecated in favor of imageUrls.length, kept for compatibility

  // Live state
  isLive?:       boolean;
  liveStarted?:  string;      // e.g. "12 min ago"

  // Stats
  carriedCount?:  string | number;
  responseCount?: string | number;
  readTime?:      string | number;

  // Feature gates
  isPlus?:       boolean;     // viewer has Annie Plus
};

// ─── Photo carousel — swipeable on touch, arrows on hover for desktop ──────

function PhotoCarousel({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const dragDelta = useRef(0);

  const goTo = (i: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIndex(Math.max(0, Math.min(urls.length - 1, i)));
  };

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; dragDelta.current = 0; };
  const onTouchMove  = (e: React.TouchEvent) => { dragDelta.current = e.touches[0].clientX - touchStartX.current; };
  const onTouchEnd   = () => {
    if (dragDelta.current < -40) goTo(index + 1);
    else if (dragDelta.current > 40) goTo(index - 1);
    dragDelta.current = 0;
  };

  if (urls.length <= 1) {
    return (
      <div style={{ position: "relative", width: "100%", height: "200px", overflow: "hidden" }}>
        {urls[0] ? (
          <img src={urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#1a1814", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(246,241,234,0.2)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ position: "relative", width: "100%", height: "200px", overflow: "hidden", touchAction: "pan-y" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        ref={trackRef}
        style={{ display: "flex", height: "100%", width: `${urls.length * 100}%`, transform: `translateX(-${index * (100 / urls.length)}%)`, transition: "transform 0.25s ease" }}
      >
        {urls.map((url, i) => (
          <div key={i} style={{ width: `${100 / urls.length}%`, flexShrink: 0, height: "100%" }}>
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        ))}
      </div>

      {/* Prev/next arrows — desktop hover convenience, harmless on touch */}
      {index > 0 && (
        <button onClick={(e) => goTo(index - 1, e)} aria-label="Previous photo"
          style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", background: "rgba(15,14,12,0.55)", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      )}
      {index < urls.length - 1 && (
        <button onClick={(e) => goTo(index + 1, e)} aria-label="Next photo"
          style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "rgba(15,14,12,0.55)", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}

      {/* Dot indicators */}
      <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "5px" }}>
        {urls.map((_, i) => (
          <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: i === index ? "white" : "rgba(255,255,255,0.4)" }} />
        ))}
      </div>

      <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(15,14,12,0.72)", border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: "4px", padding: "3px 8px", fontFamily: "'Inter', sans-serif", fontSize: "10px", color: "rgba(246,241,234,0.8)", fontWeight: 500 }}>
        {index + 1} of {urls.length}
      </div>
    </div>
  );
}

// ─── Video area — live, click to play inline ──────────────────────────────

function VideoArea({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const parsed = parseVideoUrl(url);

  if (!parsed) return null;

  if (playing) {
    return (
      <div style={{ position: "relative", width: "100%", height: "200px", background: "#000" }} onClick={(e) => e.stopPropagation()}>
        <iframe
          src={`${parsed.embedUrl}?autoplay=1`}
          style={{ width: "100%", height: "100%", border: "none" }}
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      style={{ position: "relative", width: "100%", height: "200px", background: "#0f0e0c", cursor: "pointer" }}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPlaying(true); }}
    >
      {parsed.thumbnailUrl && (
        <img src={parsed.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      )}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: parsed.thumbnailUrl ? "rgba(0,0,0,0.25)" : "transparent" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(191,155,78,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(15,14,12,0.8)", borderRadius: "4px", padding: "3px 8px", fontFamily: "'Inter', sans-serif", fontSize: "10px", color: "rgba(246,241,234,0.6)", textTransform: "capitalize" }}>
        {parsed.platform}
      </div>
    </div>
  );
}

// Live bar shown at top of live experiences
function LiveBar({ started }: { started?: string }) {
  return (
    <div style={{ background: "#c13a3a", padding: "7px 20px", display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "white", flexShrink: 0 }} />
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600, color: "white", letterSpacing: "1px", textTransform: "uppercase" }}>Live now</span>
      {started && (
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.65)", marginLeft: "auto" }}>
          Started {started}
        </span>
      )}
    </div>
  );
}

// ─── Disabled "Respond" control — same honest treatment as the editor icons ──

function RespondButton() {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <span
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShow((s) => !s); }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Respond
      </span>
      {show && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "0", background: "#1a1814", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", padding: "6px 10px", fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.7)", whiteSpace: "nowrap", zIndex: 10 }}>
          Coming soon
        </div>
      )}
    </div>
  );
}

export default function ExperienceCard({
  pullQuote, category, tag, authorInitial, authorName, authorNote,
  title, excerpt, mediaType = "none", mediaUrl, imageUrls, mediaCount,
  isLive = false, liveStarted, carriedCount = 0, responseCount = 0,
  readTime, isPlus = false,
}: Props) {
  const photos = imageUrls && imageUrls.length > 0 ? imageUrls : (mediaUrl && mediaType === "image" ? [mediaUrl] : []);

  return (
    <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", overflow: "hidden", cursor: "pointer" }}>

      {/* Live bar */}
      {isLive && <LiveBar started={liveStarted} />}

      {/* Media — photo carousel or video */}
      {mediaType === "image" && photos.length > 0 && <PhotoCarousel urls={photos} />}
      {mediaType === "video" && mediaUrl && <VideoArea url={mediaUrl} />}

      {/* Pull quote */}
      <div style={{ background: "var(--permanent-ink)", padding: "28px 24px 24px", position: "relative" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "72px", color: "var(--permanent-gold)", opacity: 0.2, position: "absolute", top: "-4px", left: "18px", lineHeight: 1, pointerEvents: "none" }}>"</div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(17px, 4vw, 22px)", fontStyle: "italic", fontWeight: 300, color: "var(--permanent-parchment)", lineHeight: 1.55, position: "relative", paddingTop: "16px" }}>
          {pullQuote}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--permanent-gold)", opacity: 0.8 }}>
            {category}{tag ? ` · ${tag}` : ""}
          </p>
          {isLive && (
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px", fontWeight: 600, color: "#c13a3a", letterSpacing: "1px", textTransform: "uppercase" }}>
              Updating
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px" }}>

        {/* Author */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: isLive ? "rgba(193,58,58,0.15)" : "var(--gold-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontWeight: 600, color: isLive ? "#c13a3a" : "var(--permanent-gold)", flexShrink: 0 }}>
            {authorInitial}
          </div>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{authorName}</p>
            {authorNote && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)" }}>{authorNote}</p>}
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.28, marginBottom: "10px" }}>
          {title}
        </h2>

        {/* Excerpt */}
        {excerpt && (
          <p style={{ fontSize: "15px", color: "var(--text-soft)", lineHeight: 1.72, marginBottom: "16px", fontWeight: 300 }}>
            {excerpt}
          </p>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "14px", borderTop: "1px solid var(--border-default)", flexWrap: "wrap" as const, gap: "8px" }}>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" as const, alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {carriedCount} carried this forward
            </span>
            <RespondButton />
            {readTime && (
              <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--text-muted)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {readTime} min read
              </span>
            )}
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: 600, color: isLive ? "#c13a3a" : "var(--permanent-gold)", cursor: "pointer" }}>
            {isLive ? "Follow" : "Read"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}