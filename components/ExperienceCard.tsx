"use client";
// components/ExperienceCard.tsx
// Card layout order: author → title → media → excerpt → pull quote → footer
// One unified surface. No dark/light split. Pull quote as closing hook, not entry point.
// All 8 statements: mobile first, user friendly, modern, premium, giants way, long term, consistent, unique.

import { useRef, useState } from "react";
import { parseVideoUrl } from "../lib/experiences";

type MediaType = "image" | "video" | "none";

type Props = {
  pullQuote:       string;
  category:        string;
  tag?:            string;
  authorInitial:   string;
  authorName:      string;
  authorUsername?: string | null;
  authorAvatar?:   string | null; // real photo from profiles.avatar_url
  authorNote?:     string;
  title:           string;
  excerpt?:        string;
  mediaType?:      MediaType;
  mediaUrl?:       string;
  imageUrls?:      string[];
  videoUrl?:       string;
  mediaCount?:     number;
  isLive?:         boolean;
  liveStarted?:    string;
  carriedCount?:   string | number;
  responseCount?:  string | number;
  readTime?:       string | number;
  isPlus?:         boolean;
};

// ─── Photo carousel ───────────────────────────────────────────────────────────

function PhotoCarousel({ urls, hasVideo = false }: { urls: string[]; hasVideo?: boolean }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);
  const dragDelta   = useRef(0);

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

  const VideoBadge = () => (
    <div style={{
      position: "absolute", top: "10px", left: "10px",
      background: "rgba(15,14,12,0.72)", border: "0.5px solid rgba(255,255,255,0.15)",
      borderRadius: "4px", padding: "3px 8px",
      display: "flex", alignItems: "center", gap: "5px",
      fontFamily: "'Inter', sans-serif", fontSize: "10px",
      color: "rgba(246,241,234,0.85)", fontWeight: 500,
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      Video
    </div>
  );

  if (urls.length <= 1) {
    return (
      <div style={{ position: "relative", width: "100%", height: "220px", overflow: "hidden" }}>
        {urls[0] ? (
          <img src={urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "var(--surface-sunken, #1a1814)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(246,241,234,0.15)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
        {hasVideo && <VideoBadge />}
      </div>
    );
  }

  return (
    <div
      style={{ position: "relative", width: "100%", height: "220px", overflow: "hidden", touchAction: "pan-y" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div style={{
        display: "flex", height: "100%",
        width: `${urls.length * 100}%`,
        transform: `translateX(-${index * (100 / urls.length)}%)`,
        transition: "transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      }}>
        {urls.map((url, i) => (
          <div key={i} style={{ width: `${100 / urls.length}%`, flexShrink: 0, height: "100%" }}>
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        ))}
      </div>

      {index > 0 && (
        <button onClick={(e) => goTo(index - 1, e)} aria-label="Previous photo"
          style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(15,14,12,0.5)", backdropFilter: "blur(4px)", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      )}
      {index < urls.length - 1 && (
        <button onClick={(e) => goTo(index + 1, e)} aria-label="Next photo"
          style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(15,14,12,0.5)", backdropFilter: "blur(4px)", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}

      <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px" }}>
        {urls.map((_, i) => (
          <div key={i} onClick={(e) => goTo(i, e)} style={{
            width: i === index ? "16px" : "5px", height: "5px",
            borderRadius: "3px",
            background: i === index ? "white" : "rgba(255,255,255,0.45)",
            transition: "width 0.2s ease",
            cursor: "pointer",
          }} />
        ))}
      </div>

      <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(15,14,12,0.65)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: "4px", padding: "3px 8px", fontFamily: "'Inter', sans-serif", fontSize: "10px", color: "rgba(246,241,234,0.8)", fontWeight: 500 }}>
        {index + 1} of {urls.length}
      </div>

      {hasVideo && <VideoBadge />}
    </div>
  );
}

// ─── Video area ───────────────────────────────────────────────────────────────

function VideoArea({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const parsed = parseVideoUrl(url);
  if (!parsed) return null;

  if (playing) {
    return (
      <div style={{ position: "relative", width: "100%", height: "220px", background: "#000" }} onClick={(e) => e.stopPropagation()}>
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
      style={{ position: "relative", width: "100%", height: "220px", background: "#0f0e0c", cursor: "pointer" }}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPlaying(true); }}
    >
      {parsed.thumbnailUrl && (
        <img src={parsed.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      )}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.22)" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(191,155,78,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(15,14,12,0.75)", borderRadius: "4px", padding: "3px 8px", fontFamily: "'Inter', sans-serif", fontSize: "10px", color: "rgba(246,241,234,0.65)", textTransform: "capitalize" }}>
        {parsed.platform}
      </div>
    </div>
  );
}

// ─── Live bar ─────────────────────────────────────────────────────────────────

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

// ─── Respond button ───────────────────────────────────────────────────────────

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
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "0", background: "var(--permanent-ink, #0f0e0c)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "6px 10px", fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.7)", whiteSpace: "nowrap", zIndex: 10 }}>
          Coming soon
        </div>
      )}
    </div>
  );
}

// ─── Author avatar ────────────────────────────────────────────────────────────
// Shows real photo when available, falls back to initial.
// Giants Way: Twitter/Instagram/Threads always show the author's current avatar.

function AuthorAvatar({
  avatar, initial, isLive,
}: {
  avatar?: string | null;
  initial: string;
  isLive: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  if (avatar && !imgError) {
    return (
      <img
        src={avatar}
        alt=""
        onError={() => setImgError(true)}
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          display: "block",
        }}
      />
    );
  }

  // Fallback: initial circle
  return (
    <div style={{
      width: "34px", height: "34px", borderRadius: "50%",
      background: isLive ? "rgba(193,58,58,0.12)" : "var(--gold-soft)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Cormorant Garamond', serif", fontSize: "15px", fontWeight: 600,
      color: isLive ? "#c13a3a" : "var(--permanent-gold)", flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

export default function ExperienceCard({
  pullQuote, category, tag, authorInitial, authorName, authorUsername,
  authorAvatar, authorNote, title, excerpt, mediaType = "none", mediaUrl,
  imageUrls, videoUrl, mediaCount, isLive = false, liveStarted,
  carriedCount = 0, responseCount = 0, readTime, isPlus = false,
}: Props) {
  const photos = imageUrls && imageUrls.length > 0
    ? imageUrls
    : (mediaUrl && mediaType === "image" ? [mediaUrl] : []);

  return (
    <div style={{
      background: "var(--surface-card)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md, 12px)",
      overflow: "hidden",
      cursor: "pointer",
      transition: "border-color 0.18s ease",
    }}>

      {isLive && <LiveBar started={liveStarted} />}

      {/* ── TOP: Author + category pill ─────────────────────────────────── */}
      <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <AuthorAvatar avatar={authorAvatar} initial={authorInitial} isLive={isLive} />
          <div>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600,
              color: "var(--text-primary)", lineHeight: 1.2, margin: 0,
            }}>
              {authorName}
            </p>
            {authorUsername && !isLive && (
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: "11px",
                color: "var(--text-muted)", margin: "1px 0 0 0", lineHeight: 1,
              }}>
                @{authorUsername}
              </p>
            )}
            {authorNote && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                {authorNote}
              </p>
            )}
          </div>
        </div>

        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600,
          letterSpacing: "1.5px", textTransform: "uppercase",
          color: isLive ? "#c13a3a" : "var(--permanent-gold)",
          background: isLive ? "rgba(193,58,58,0.08)" : "var(--gold-soft)",
          borderRadius: "4px", padding: "3px 8px", whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {isLive && <span style={{ marginRight: "5px" }}>●</span>}
          {category}{tag ? ` · ${tag}` : ""}
        </span>
      </div>

      {/* ── TITLE ───────────────────────────────────────────────────────── */}
      <div style={{ padding: "12px 20px 14px" }}>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(19px, 5vw, 23px)",
          fontWeight: 600, color: "var(--text-primary)",
          lineHeight: 1.3, margin: 0,
        }}>
          {title}
        </h2>
      </div>

      {/* ── MEDIA ───────────────────────────────────────────────────────── */}
      {mediaType === "image" && photos.length > 0 && (
        <PhotoCarousel urls={photos} hasVideo={!!videoUrl} />
      )}
      {mediaType === "video" && mediaUrl && <VideoArea url={mediaUrl} />}

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px 0" }}>
        {excerpt && excerpt !== pullQuote && (
          <p style={{
            fontSize: "14px", color: "var(--text-soft)",
            lineHeight: 1.7, fontWeight: 300, margin: 0,
          }}>
            {excerpt}
          </p>
        )}
      </div>

      {/* ── PULL QUOTE ──────────────────────────────────────────────────── */}
      <div style={{ margin: "16px 20px 0", borderLeft: "2px solid var(--permanent-gold)", paddingLeft: "14px" }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(15px, 3.8vw, 18px)",
          fontStyle: "italic", fontWeight: 300,
          color: "var(--text-soft)", lineHeight: 1.6, margin: 0,
        }}>
          {pullQuote}
        </p>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px 16px", marginTop: "14px",
        borderTop: "1px solid var(--border-default)",
        flexWrap: "wrap" as const, gap: "8px",
      }}>
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
  );
}