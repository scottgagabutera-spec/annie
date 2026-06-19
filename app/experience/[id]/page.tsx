"use client";
// app/experience/[id]/page.tsx

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getExperienceById, carryForward, updateExperience, deleteExperience,
  uploadExperienceImage, parseVideoUrl, FeedExperience, FREE_PHOTO_LIMIT,
} from "../../../lib/experiences";
import { getCurrentUser, AnnieUser } from "../../../lib/auth";

const MAX_IMAGE_BYTES   = 5 * 1024 * 1024;
const ALLOWED_IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatCategory(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

// ─── Reading-page photo carousel — same swipe pattern as the card ─────────

function ReadingPhotoCarousel({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);
  const dragDelta = useRef(0);

  const goTo = (i: number) => setIndex(Math.max(0, Math.min(urls.length - 1, i)));
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; dragDelta.current = 0; };
  const onTouchMove  = (e: React.TouchEvent) => { dragDelta.current = e.touches[0].clientX - touchStartX.current; };
  const onTouchEnd   = () => {
    if (dragDelta.current < -40) goTo(index + 1);
    else if (dragDelta.current > 40) goTo(index - 1);
    dragDelta.current = 0;
  };

  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <img src={urls[0]} alt="" style={{ width: "100%", maxHeight: "420px", objectFit: "cover", display: "block" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", touchAction: "pan-y" }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div style={{ overflow: "hidden", maxHeight: "420px" }}>
        <div style={{ display: "flex", width: `${urls.length * 100}%`, transform: `translateX(-${index * (100 / urls.length)}%)`, transition: "transform 0.25s ease" }}>
          {urls.map((url, i) => (
            <div key={i} style={{ width: `${100 / urls.length}%`, flexShrink: 0 }}>
              <img src={url} alt="" style={{ width: "100%", maxHeight: "420px", objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      </div>

      {index > 0 && (
        <button onClick={() => goTo(index - 1)} aria-label="Previous photo"
          style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", background: "rgba(15,14,12,0.55)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      )}
      {index < urls.length - 1 && (
        <button onClick={() => goTo(index + 1)} aria-label="Next photo"
          style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "rgba(15,14,12,0.55)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}

      <div style={{ position: "absolute", bottom: "14px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px" }}>
        {urls.map((_, i) => (
          <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i === index ? "white" : "rgba(255,255,255,0.4)" }} />
        ))}
      </div>
    </div>
  );
}

// ─── Reading-page video embed — live, click to play ────────────────────────

function ReadingVideo({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const parsed = parseVideoUrl(url);
  if (!parsed) return null;

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      {playing ? (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000" }}>
          <iframe src={`${parsed.embedUrl}?autoplay=1`} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen" allowFullScreen />
        </div>
      ) : (
        <div onClick={() => setPlaying(true)} style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#0f0e0c", cursor: "pointer" }}>
          {parsed.thumbnailUrl && <img src={parsed.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: parsed.thumbnailUrl ? "rgba(0,0,0,0.25)" : "transparent" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(191,155,78,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Disabled "Respond" control — same honest treatment used elsewhere ─────

function RespondButton() {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={() => setShow((s) => !s)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ background: "transparent", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "var(--radius-sm)", padding: "10px 16px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Respond
      </button>
      {show && (
        <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "0", background: "#1a1814", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px", padding: "6px 10px", fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.7)", whiteSpace: "nowrap", zIndex: 10 }}>
          Coming soon
        </div>
      )}
    </div>
  );
}

export default function ExperiencePage() {
  const params = useParams();
  const router = useRouter();
  const id     = params?.id as string;

  const [exp, setExp]                       = useState<FeedExperience | null>(null);
  const [user, setUser]                     = useState<AnnieUser | null>(null);
  const [loading, setLoading]               = useState(true);
  const [notFound, setNotFound]             = useState(false);
  const [carrying, setCarrying]             = useState(false);
  const [carriedLocally, setCarriedLocally] = useState(false);

  // Edit state
  const [editOpen, setEditOpen]     = useState(false);
  const [editTitle, setEditTitle]   = useState("");
  const [editBody, setEditBody]     = useState("");
  const [editPull, setEditPull]     = useState("");
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [editImageError, setEditImageError]     = useState("");
  const [editVideoUrl, setEditVideoUrl]         = useState("");
  const [editVideoUrlError, setEditVideoUrlError] = useState("");
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState("");

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-grow refs — title and body resize to content, no inner scrollbar ever.
  const editTitleRef = useRef<HTMLTextAreaElement>(null);
  const editBodyRef  = useRef<HTMLTextAreaElement>(null);

  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([getExperienceById(id), getCurrentUser()]).then(([data, u]) => {
      if (!data) { setNotFound(true); setLoading(false); return; }
      setExp(data);
      setUser(u);
      setLoading(false);
    });
  }, [id]);

  // Re-measure both fields the moment the overlay opens, since browsers
  // report scrollHeight as 0 for elements that were just mounted as display:none.
  useEffect(() => {
    if (!editOpen) return;
    requestAnimationFrame(() => {
      autoGrow(editTitleRef.current);
      autoGrow(editBodyRef.current);
    });
  }, [editOpen]);

  const isOwner = !!(user && exp && user.id === exp.profile_id);

  const openEdit = () => {
    if (!exp) return;
    setEditTitle(exp.title);
    setEditBody(exp.content);
    setEditPull(exp.pull_quote || "");
    setEditImageUrls(exp.image_urls || []);
    setEditImageFiles([]);
    setEditImagePreviews([]);
    setEditImageError("");
    setEditVideoUrl(exp.video_url || "");
    setEditVideoUrlError("");
    setSaveError("");
    setEditOpen(true);
  };

  const totalEditPhotos = editImageUrls.length + editImagePreviews.length;

  const handleEditImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (totalEditPhotos >= FREE_PHOTO_LIMIT) return;
    if (!ALLOWED_IMG_TYPES.includes(file.type)) { setEditImageError("Use a JPG, PNG, or WEBP."); return; }
    if (file.size > MAX_IMAGE_BYTES)             { setEditImageError("Keep it under 5MB."); return; }
    setEditImageError("");
    setEditImageFiles((prev) => [...prev, file]);
    setEditImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
  };

  const handleRemoveExistingImage = (index: number) => {
    setEditImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index: number) => {
    setEditImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setEditImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditVideoUrlChange = (value: string) => {
    setEditVideoUrl(value);
    if (!value.trim()) { setEditVideoUrlError(""); return; }
    setEditVideoUrlError(parseVideoUrl(value) ? "" : "Paste a YouTube or Vimeo link.");
  };

  const editParsedVideo = editVideoUrl.trim() ? parseVideoUrl(editVideoUrl) : null;

  const handleSave = async () => {
    if (!exp || !user) return;
    if (!editTitle.trim() || !editBody.trim()) { setSaveError("Title and body are required."); return; }
    if (editVideoUrlError) { setSaveError("Fix the video link before saving."); return; }
    setSaving(true);
    setSaveError("");

    let finalImageUrls = [...editImageUrls];
    if (editImageFiles.length > 0) {
      for (const file of editImageFiles) {
        const upload = await uploadExperienceImage(file, user.id);
        if (!upload.ok) { setSaveError("A photo upload failed. Try again or remove it."); setSaving(false); return; }
        finalImageUrls.push(upload.url);
      }
    }

    const result = await updateExperience(exp.id, {
      title:      editTitle.trim(),
      content:    editBody.trim(),
      pull_quote: editPull.trim() || null,
      image_urls: finalImageUrls,
      video_url:  editParsedVideo ? editVideoUrl.trim() : null,
    });

    if (!result.ok) { setSaveError("Something went wrong. Try again."); setSaving(false); return; }

    setExp({
      ...exp,
      title:      editTitle.trim(),
      content:    editBody.trim(),
      pull_quote: editPull.trim() || null,
      image_urls: finalImageUrls,
      video_url:  editParsedVideo ? editVideoUrl.trim() : null,
      is_edited:  true,
      edited_at:  new Date().toISOString(),
      read_time_minutes: Math.max(1, Math.ceil(editBody.trim().split(/\s+/).length / 200)),
    });
    editImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSaving(false);
    setEditOpen(false);
  };

  const handleDelete = async () => {
    if (!exp) return;
    setDeleting(true);
    const result = await deleteExperience(exp.id, exp.image_urls || []);
    if (!result.ok) { setDeleting(false); return; }
    router.replace("/");
  };

  const handleCarryForward = async () => {
    if (!exp || carrying || carriedLocally) return;
    setCarrying(true);
    const ok = await carryForward(exp.id);
    if (ok) {
      setExp({ ...exp, carried_forward_count: exp.carried_forward_count + 1 });
      setCarriedLocally(true);
    }
    setCarrying(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--permanent-ink)" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.4)" }}>Loading...</p>
      </div>
    );
  }

  if (notFound || !exp) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--permanent-ink)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 300, color: "var(--permanent-parchment)", marginBottom: "12px" }}>
          This experience is not here.
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.45)", marginBottom: "24px" }}>
          It may have been removed, or the link may not be correct.
        </p>
        <Link href="/" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--permanent-gold)", textDecoration: "none" }}>
          Back to Annie
        </Link>
      </div>
    );
  }

  const name       = exp.is_anonymous ? "Anonymous" : (exp.display_name || "Someone");
  const initial    = exp.is_anonymous ? "A" : (name.charAt(0).toUpperCase() || "?");
  const paragraphs = exp.content.split(/\n+/).filter((p) => p.trim().length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--permanent-ink)" }}>

      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "56px", background: "var(--permanent-ink)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => router.back()} aria-label="Back" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-parchment)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 600, color: "var(--permanent-parchment)", textDecoration: "none" }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </Link>
        {/* Owner actions — invisible to everyone else */}
        {isOwner ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={openEdit} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(246,241,234,0.65)" }}>
              Edit
            </button>
            <button onClick={() => setDeleteConfirm(true)} style={{ background: "transparent", border: "1px solid rgba(193,58,58,0.35)", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(193,58,58,0.75)" }}>
              Delete
            </button>
          </div>
        ) : (
          <div style={{ width: "80px" }} />
        )}
      </div>

      {/* Hero */}
      <div style={{ padding: "32px 24px 28px", maxWidth: "680px", margin: "0 auto" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "var(--permanent-gold)", marginBottom: "16px" }}>
          {formatCategory(exp.category)}
        </p>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(20px, 4vw, 26px)", color: "var(--permanent-parchment)", lineHeight: 1.5, marginBottom: "24px" }}>
          {exp.pull_quote || paragraphs[0]}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "rgba(191,155,78,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", color: "var(--permanent-gold)", flexShrink: 0 }}>
            {initial}
          </div>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--permanent-parchment)", margin: 0 }}>{name}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "rgba(246,241,234,0.45)", margin: 0 }}>
              {exp.read_time_minutes} min read
              {exp.is_edited && " · edited"}
            </p>
          </div>
        </div>
      </div>

      {/* Lead photo(s) — carousel if more than one */}
      {exp.image_urls && exp.image_urls.length > 0 && <ReadingPhotoCarousel urls={exp.image_urls} />}

      {/* Video — live embed, click to play */}
      {exp.video_url && <ReadingVideo url={exp.video_url} />}

      {/* Body */}
      <div style={{ background: "var(--surface-card)", padding: "36px 24px 28px", maxWidth: "680px", margin: "0 auto", borderRadius: "12px 12px 0 0" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.25, marginBottom: "26px" }}>
          {exp.title}
        </h1>

        {paragraphs.map((p, i) => (
          <p key={i} style={{ fontSize: "17px", color: "var(--text-soft)", lineHeight: 1.85, marginBottom: "20px", fontWeight: 300 }}>
            {p}
          </p>
        ))}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "20px", marginTop: "12px", borderTop: "1px solid var(--border-default)", flexWrap: "wrap" as const, gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>
              {exp.response_count} {exp.response_count === 1 ? "response" : "responses"}
            </span>
            <RespondButton />
          </div>
          <button
            onClick={handleCarryForward}
            disabled={carrying || carriedLocally}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: carriedLocally ? "rgba(191,155,78,0.12)" : "var(--permanent-gold)", color: carriedLocally ? "var(--permanent-gold)" : "white", border: carriedLocally ? "1px solid var(--permanent-gold)" : "none", borderRadius: "var(--radius-sm)", padding: "10px 18px", cursor: carriedLocally ? "default" : "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={carriedLocally ? "var(--permanent-gold)" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {exp.carried_forward_count} carried this forward
          </button>
        </div>
      </div>

      {/* ── EDIT OVERLAY ────────────────────────────────────────────────── */}
      {editOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--permanent-ink)", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "56px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <button onClick={() => setEditOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.5)" }}>
              Cancel
            </button>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontWeight: 600, color: "var(--permanent-parchment)" }}>
              Edit experience
            </span>
            <button onClick={handleSave} disabled={saving} style={{ background: "var(--permanent-gold)", border: "none", borderRadius: "6px", padding: "7px 16px", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          {/* Single outer scroll for the whole panel — nothing inside ever scrolls on its own */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 24px" }}>
            <div style={{ maxWidth: "680px", margin: "0 auto" }}>
              {saveError && (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#e07070", marginBottom: "16px" }}>{saveError}</p>
              )}

              {/* Title — auto-grows, never scrolls internally */}
              <textarea
                ref={editTitleRef}
                value={editTitle}
                onChange={(e) => { setEditTitle(e.target.value); autoGrow(e.target); }}
                placeholder="Title"
                rows={1}
                style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", outline: "none", resize: "none", overflow: "hidden", fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 600, color: "var(--permanent-parchment)", lineHeight: 1.2, marginBottom: "20px", boxSizing: "border-box", padding: "8px 0" }}
              />

              {/* Body — auto-grows with content, same pattern as the main ShareFlow editor */}
              <textarea
                ref={editBodyRef}
                value={editBody}
                onChange={(e) => { setEditBody(e.target.value); autoGrow(e.target); }}
                placeholder="Write your experience here."
                rows={1}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", overflow: "hidden", fontFamily: "'Inter', sans-serif", fontSize: "16px", color: "var(--permanent-parchment)", lineHeight: 1.8, marginBottom: "20px", boxSizing: "border-box", minHeight: "200px" }}
              />

              {/* Pull quote */}
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(246,241,234,0.45)", marginBottom: "8px" }}>
                A line to lead with (optional)
              </p>
              <textarea
                value={editPull}
                onChange={(e) => setEditPull(e.target.value)}
                placeholder="If one sentence stays with you the most, put it here."
                rows={2}
                style={{ width: "100%", background: "rgba(191,155,78,0.04)", border: "1px solid rgba(191,155,78,0.2)", borderRadius: "8px", padding: "10px 12px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "15px", color: "var(--permanent-parchment)", lineHeight: 1.6, resize: "none", outline: "none", boxSizing: "border-box", marginBottom: "20px" }}
              />

              {/* Photos — multi, up to FREE_PHOTO_LIMIT total between existing + new */}
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(246,241,234,0.45)", marginBottom: "8px" }}>
                Photos (optional)
              </p>
              <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEditImageSelect} style={{ display: "none" }} />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "8px" }}>
                {editImageUrls.map((url, i) => (
                  <div key={`existing-${i}`} style={{ position: "relative", aspectRatio: "1", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button onClick={() => handleRemoveExistingImage(i)} aria-label="Remove photo" style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(15,14,12,0.75)", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                {editImagePreviews.map((src, i) => (
                  <div key={`new-${i}`} style={{ position: "relative", aspectRatio: "1", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button onClick={() => handleRemoveNewImage(i)} aria-label="Remove photo" style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(15,14,12,0.75)", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                {totalEditPhotos < FREE_PHOTO_LIMIT && (
                  <button onClick={() => imageInputRef.current?.click()} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "8px", cursor: "pointer" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(246,241,234,0.5)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                )}
                {totalEditPhotos >= FREE_PHOTO_LIMIT && (
                  <div style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", background: "rgba(191,155,78,0.06)", border: "1px solid rgba(191,155,78,0.2)", borderRadius: "8px" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--permanent-gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "9px", fontWeight: 600, color: "var(--permanent-gold)" }}>Plus</span>
                  </div>
                )}
              </div>
              {editImageError && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#bf9b4e", marginBottom: "8px" }}>{editImageError}</p>}
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.4)", marginBottom: "20px" }}>
                Up to {FREE_PHOTO_LIMIT} photos on the free plan.
              </p>

              {/* Video link */}
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(246,241,234,0.45)", marginBottom: "8px" }}>
                Video link (optional)
              </p>
              <input
                value={editVideoUrl}
                onChange={(e) => handleEditVideoUrlChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${editVideoUrlError ? "#bf9b4e" : "rgba(255,255,255,0.12)"}`, borderRadius: "8px", padding: "10px 12px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--permanent-parchment)", outline: "none", boxSizing: "border-box" }}
              />
              {editVideoUrlError && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#bf9b4e", marginTop: "6px" }}>{editVideoUrlError}</p>}

              <div style={{ height: "40px" }} />
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ───────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,14,12,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ background: "#1a1814", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "28px 24px", maxWidth: "360px", width: "100%", textAlign: "center" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, color: "var(--permanent-parchment)", marginBottom: "10px" }}>
              Remove this experience?
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.5)", marginBottom: "24px", lineHeight: 1.6 }}>
              This removes it from Annie permanently. Anyone who has already read or carried it forward will no longer be able to find it here.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setDeleteConfirm(false)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "11px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.6)" }}>
                Keep it
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, background: "#c13a3a", border: "none", borderRadius: "8px", padding: "11px", cursor: deleting ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white", opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "Removing..." : "Yes, remove it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}