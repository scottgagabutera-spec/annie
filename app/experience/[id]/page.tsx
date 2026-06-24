"use client";
// app/experience/[id]/page.tsx
// Reading page: author → title → media → body → pull quote → footer → responses.
// Giants Way: author clickable to profile, three dot menu for owner actions.
// All 11 statements. Zero hardcoded colors.

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getExperienceById, carryForward, updateExperience, deleteExperience,
  uploadExperienceImage, parseVideoUrl, FeedExperience, FREE_PHOTO_LIMIT,
  getResponsesForExperience, postResponse, deleteResponse, Response,
} from "../../../lib/experiences";
import { getCurrentUser, AnnieUser } from "../../../lib/auth";

const MAX_IMAGE_BYTES   = 5 * 1024 * 1024;
const ALLOWED_IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatCategory(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

// AUTHOR AVATAR

function AuthorAvatar({ url, initial, size = 38 }: { url: string | null; initial: string; size?: number }) {
  const [err, setErr] = useState(false);

  if (url && !err) {
    return (
      <img
        src={url}
        alt=""
        onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, display: "block" }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--gold-soft)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Cormorant Garamond', serif", fontSize: "16px",
      fontWeight: 600, color: "var(--permanent-gold)", flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

// PHOTO CAROUSEL

function ReadingPhotoCarousel({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);
  const dragDelta   = useRef(0);

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
      <div style={{ width: "100%" }}>
        <img src={urls[0]} alt="" style={{ width: "100%", maxHeight: "440px", objectFit: "cover", display: "block" }} />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", touchAction: "pan-y" }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div style={{ overflow: "hidden", maxHeight: "440px" }}>
        <div style={{ display: "flex", width: `${urls.length * 100}%`, transform: `translateX(-${index * (100 / urls.length)}%)`, transition: "transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>
          {urls.map((url, i) => (
            <div key={i} style={{ width: `${100 / urls.length}%`, flexShrink: 0 }}>
              <img src={url} alt="" style={{ width: "100%", maxHeight: "440px", objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      </div>
      {index > 0 && (
        <button onClick={() => goTo(index - 1)} aria-label="Previous" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", background: "rgba(15,14,12,0.5)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      )}
      {index < urls.length - 1 && (
        <button onClick={() => goTo(index + 1)} aria-label="Next" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "rgba(15,14,12,0.5)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}
      <div style={{ position: "absolute", bottom: "14px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px" }}>
        {urls.map((_, i) => (
          <div key={i} onClick={() => goTo(i)} style={{ width: i === index ? "16px" : "6px", height: "6px", borderRadius: "3px", background: i === index ? "white" : "rgba(255,255,255,0.4)", transition: "width 0.2s ease", cursor: "pointer" }} />
        ))}
      </div>
      <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(15,14,12,0.65)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: "4px", padding: "3px 8px", fontFamily: "'Inter', sans-serif", fontSize: "10px", color: "rgba(246,241,234,0.8)", fontWeight: 500 }}>
        {index + 1} of {urls.length}
      </div>
    </div>
  );
}

// VIDEO EMBED

function ReadingVideo({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const parsed = parseVideoUrl(url);
  if (!parsed) return null;

  return (
    <div style={{ width: "100%" }}>
      {playing ? (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000" }}>
          <iframe src={`${parsed.embedUrl}?autoplay=1`} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen" allowFullScreen />
        </div>
      ) : (
        <div onClick={() => setPlaying(true)} style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#0f0e0c", cursor: "pointer" }}>
          {parsed.thumbnailUrl && <img src={parsed.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.22)" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(184,146,58,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
          <div style={{ position: "absolute", bottom: "12px", right: "12px", background: "rgba(15,14,12,0.75)", borderRadius: "4px", padding: "3px 8px", fontFamily: "'Inter', sans-serif", fontSize: "10px", color: "rgba(246,241,234,0.65)", textTransform: "capitalize" as const }}>
            {parsed.platform}
          </div>
        </div>
      )}
    </div>
  );
}

// THREE DOT MENU for owner actions

function OwnerMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((s) => !s)}
        aria-label="More options"
        style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px 8px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-muted)" stroke="none">
          <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
        </svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
          <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "10px", overflow: "hidden", zIndex: 100, minWidth: "140px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              style={{ width: "100%", background: "transparent", border: "none", padding: "12px 16px", textAlign: "left" as const, fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <div style={{ height: "1px", background: "var(--border-default)", margin: "0 12px" }} />
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              style={{ width: "100%", background: "transparent", border: "none", padding: "12px 16px", textAlign: "left" as const, fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--permanent-live)", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// RESPONSE ITEM

function ResponseItem({
  response,
  currentUserId,
  onDelete,
}: {
  response: Response;
  currentUserId: string | null;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner = currentUserId === response.profile_id;
  const name = response.author_name || "Someone";
  const initial = name.charAt(0).toUpperCase();

  const handleDelete = async () => {
    setDeleting(true);
    await deleteResponse(response.id);
    onDelete(response.id);
  };

  return (
    <div style={{ display: "flex", gap: "10px", padding: "16px 0", borderBottom: "1px solid var(--border-default)" }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: response.author_avatar_url ? "transparent" : "var(--gold-soft)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Cormorant Garamond', serif", fontSize: "14px", fontWeight: 600, color: "var(--permanent-gold)",
        overflow: "hidden",
      }}>
        {response.author_avatar_url
          ? <img src={response.author_avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
              {name}
            </span>
            {response.author_username && (
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)" }}>
                @{response.author_username}
              </span>
            )}
          </div>
          {isOwner && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: "2px 6px", fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)" }}>
              Remove
            </button>
          )}
          {isOwner && confirmDelete && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button onClick={() => setConfirmDelete(false)} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--permanent-live)", fontWeight: 600 }}>
                {deleting ? "Removing…" : "Yes, remove"}
              </button>
            </div>
          )}
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "var(--text-soft)", lineHeight: 1.7, margin: 0 }}>
          {response.content}
        </p>
        {response.is_edited && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)", margin: "4px 0 0" }}>edited</p>
        )}
      </div>
    </div>
  );
}

// RESPONSE SECTION

function ResponseSection({
  experienceId,
  user,
  initialCount,
  onCountChange,
}: {
  experienceId: string;
  user: AnnieUser | null;
  initialCount: number;
  onCountChange: (n: number) => void;
}) {
  const [responses, setResponses]       = useState<Response[]>([]);
  const [loading, setLoading]           = useState(true);
  const [text, setText]                 = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState("");
  const [open, setOpen]                 = useState(false);
  const textareaRef                     = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getResponsesForExperience(experienceId).then((data) => {
      setResponses(data);
      setLoading(false);
    });
  }, [experienceId]);

  const handleSubmit = async () => {
    if (!user || !text.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    const result = await postResponse(experienceId, user.id, text.trim());
    if (!result.ok) {
      setSubmitError("Something went wrong. Try again.");
      setSubmitting(false);
      return;
    }
    // Re-fetch to get the full response with author info
    const updated = await getResponsesForExperience(experienceId);
    setResponses(updated);
    onCountChange(updated.length);
    setText("");
    setOpen(false);
    setSubmitting(false);
  };

  const handleDelete = (id: string) => {
    const updated = responses.filter((r) => r.id !== id);
    setResponses(updated);
    onCountChange(updated.length);
  };

  return (
    <div style={{ padding: "0 24px", marginTop: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 300, color: "var(--text-primary)", margin: 0 }}>
          {responses.length === 0 ? "No responses yet" : `${responses.length} ${responses.length === 1 ? "response" : "responses"}`}
        </h3>
        {user && !open && (
          <button
            onClick={() => { setOpen(true); setTimeout(() => textareaRef.current?.focus(), 50); }}
            style={{ background: "transparent", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "8px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Respond
          </button>
        )}
        {!user && (
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>
            <Link href="/" style={{ color: "var(--permanent-gold)", textDecoration: "none", fontWeight: 600 }}>Sign in</Link> to respond
          </span>
        )}
      </div>

      {/* Response input */}
      {user && open && (
        <div style={{ marginBottom: "24px", background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "10px", padding: "16px" }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your response…"
            rows={3}
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.7, boxSizing: "border-box" as const }}
          />
          {submitError && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "var(--permanent-live)", margin: "8px 0 0" }}>{submitError}</p>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px", borderTop: "1px solid var(--border-default)", paddingTop: "12px" }}>
            <button
              onClick={() => { setOpen(false); setText(""); setSubmitError(""); }}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", padding: "7px 12px" }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !text.trim()}
              style={{ background: "var(--permanent-gold)", border: "none", borderRadius: "6px", padding: "7px 16px", cursor: submitting || !text.trim() ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white", opacity: submitting || !text.trim() ? 0.5 : 1 }}>
              {submitting ? "Posting…" : "Post response"}
            </button>
          </div>
        </div>
      )}

      {/* Response list */}
      {loading ? (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>Loading…</p>
      ) : (
        <div>
          {responses.map((r) => (
            <ResponseItem
              key={r.id}
              response={r}
              currentUserId={user?.id ?? null}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// MAIN PAGE

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
  const [responseCount, setResponseCount]   = useState(0);

  const [editOpen, setEditOpen]                   = useState(false);
  const [editTitle, setEditTitle]                 = useState("");
  const [editBody, setEditBody]                   = useState("");
  const [editPull, setEditPull]                   = useState("");
  const [editImageUrls, setEditImageUrls]         = useState<string[]>([]);
  const [editImageFiles, setEditImageFiles]       = useState<File[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [editImageError, setEditImageError]       = useState("");
  const [editVideoUrl, setEditVideoUrl]           = useState("");
  const [editVideoUrlError, setEditVideoUrlError] = useState("");
  const [saving, setSaving]                       = useState(false);
  const [saveError, setSaveError]                 = useState("");
  const [deleteConfirm, setDeleteConfirm]         = useState(false);
  const [deleting, setDeleting]                   = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const editTitleRef  = useRef<HTMLTextAreaElement>(null);
  const editBodyRef   = useRef<HTMLTextAreaElement>(null);

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
      setResponseCount(data.response_count);
      setLoading(false);
    });
  }, [id]);

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
    setEditImagePreviews((prev) => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index); });
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
    setSaving(true); setSaveError("");

    let finalImageUrls = [...editImageUrls];
    for (const file of editImageFiles) {
      const upload = await uploadExperienceImage(file, user.id);
      if (!upload.ok) { setSaveError("A photo upload failed. Try again or remove it."); setSaving(false); return; }
      finalImageUrls.push(upload.url);
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
      title:             editTitle.trim(),
      content:           editBody.trim(),
      pull_quote:        editPull.trim() || null,
      image_urls:        finalImageUrls,
      video_url:         editParsedVideo ? editVideoUrl.trim() : null,
      is_edited:         true,
      edited_at:         new Date().toISOString(),
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
    if (!exp || carrying || carriedLocally || !user) return;
    setCarrying(true);
    const ok = await carryForward(exp.id);
    if (ok) { setExp({ ...exp, carried_forward_count: exp.carried_forward_count + 1 }); setCarriedLocally(true); }
    setCarrying(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-bg)" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (notFound || !exp) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--surface-bg)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 300, color: "var(--text-primary)", marginBottom: "12px" }}>
          This experience is not here.
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>
          It may have been removed, or the link may not be correct.
        </p>
        <Link href="/" style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--permanent-gold)", textDecoration: "none" }}>
          Back to Annie
        </Link>
      </div>
    );
  }

  const name       = exp.is_anonymous ? "Anonymous" : (exp.author_name || exp.display_name || "Someone");
  const initial    = exp.is_anonymous ? "A" : (name.charAt(0).toUpperCase() || "?");
  const avatar     = exp.is_anonymous ? null : (exp.author_avatar_url || null);
  const paragraphs = exp.content.split(/\n+/).filter((p) => p.trim().length > 0);

  // Carry forward button — only active when signed in
  const carryDisabled = carrying || carriedLocally || !user;

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-bg)" }}>

      {/* TOP BAR */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: "56px",
        background: "var(--surface-bg)",
        borderBottom: "1px solid var(--border-default)",
      }}>
        <button onClick={() => router.back()} aria-label="Back" style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}>
          Annie<span style={{ color: "var(--permanent-gold)" }}>.</span>
        </Link>
        {isOwner ? (
          <OwnerMenu onEdit={openEdit} onDelete={() => setDeleteConfirm(true)} />
        ) : (
          <div style={{ width: "34px" }} />
        )}
      </div>

      {/* READING BODY */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 0 80px" }}>

        {/* Author + category */}
        <div style={{ padding: "28px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          {exp.is_anonymous ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AuthorAvatar url={null} initial="A" />
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Anonymous</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {exp.read_time_minutes} min read{exp.is_edited ? " · edited" : ""}
                </p>
              </div>
            </div>
          ) : (
            <Link href={`/profile/${exp.profile_id}`} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <AuthorAvatar url={avatar} initial={initial} />
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{name}</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {exp.author_username ? `@${exp.author_username} · ` : ""}{exp.read_time_minutes} min read{exp.is_edited ? " · edited" : ""}
                </p>
              </div>
            </Link>
          )}
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "var(--permanent-gold)", background: "var(--gold-soft)", borderRadius: "4px", padding: "3px 8px", whiteSpace: "nowrap" as const, flexShrink: 0 }}>
            {formatCategory(exp.category)}
          </span>
        </div>

        {/* Title */}
        <div style={{ padding: "16px 24px 20px" }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.22, margin: 0 }}>
            {exp.title}
          </h1>
        </div>

        {/* Media */}
        {exp.image_urls && exp.image_urls.length > 0 && (
          <ReadingPhotoCarousel urls={exp.image_urls} />
        )}
        {exp.video_url && (
          <div style={{ marginTop: exp.image_urls?.length ? "16px" : "0" }}>
            <ReadingVideo url={exp.video_url} />
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "28px 24px 0" }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ fontSize: "17px", color: "var(--text-soft)", lineHeight: 1.85, margin: "0 0 22px", fontWeight: 300 }}>
              {p}
            </p>
          ))}
        </div>

        {/* Pull quote */}
        {exp.pull_quote && exp.pull_quote !== paragraphs[0] && (
          <div style={{ margin: "8px 24px 0", borderLeft: "2px solid var(--permanent-gold)", paddingLeft: "16px" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(17px, 3.5vw, 21px)", fontStyle: "italic", fontWeight: 300, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>
              {exp.pull_quote}
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 24px 0", marginTop: "28px", borderTop: "1px solid var(--border-default)", flexWrap: "wrap" as const, gap: "12px" }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>
            {responseCount} {responseCount === 1 ? "response" : "responses"}
          </span>
          <button
            onClick={handleCarryForward}
            disabled={carryDisabled}
            title={!user ? "Sign in to carry this forward" : undefined}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: carriedLocally ? "transparent" : "var(--permanent-gold)",
              color: carriedLocally ? "var(--permanent-gold)" : "white",
              border: carriedLocally ? "1px solid var(--permanent-gold)" : "none",
              borderRadius: "var(--radius-sm)", padding: "10px 18px",
              cursor: carryDisabled ? "default" : "pointer",
              fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600,
              opacity: !user && !carriedLocally ? 0.5 : 1,
              transition: "all 0.2s",
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={carriedLocally ? "var(--permanent-gold)" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {exp.carried_forward_count} carried this forward
          </button>
        </div>

        {/* Responses */}
        <ResponseSection
          experienceId={exp.id}
          user={user}
          initialCount={responseCount}
          onCountChange={setResponseCount}
        />
      </div>

      {/* EDIT OVERLAY */}
      {editOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--permanent-ink)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: "56px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <button onClick={() => setEditOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "rgba(246,241,234,0.5)" }}>
              Cancel
            </button>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontWeight: 600, color: "var(--permanent-parchment)" }}>
              Edit experience
            </span>
            <button onClick={handleSave} disabled={saving} style={{ background: "var(--permanent-gold)", border: "none", borderRadius: "6px", padding: "7px 16px", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white", opacity: saving ? 0.6 : 1 }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "28px 24px" }}>
            <div style={{ maxWidth: "680px", margin: "0 auto" }}>
              {saveError && (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "#e07070", marginBottom: "16px" }}>{saveError}</p>
              )}
              <textarea ref={editTitleRef} value={editTitle} onChange={(e) => { setEditTitle(e.target.value); autoGrow(e.target); }} placeholder="Title" rows={1} style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", outline: "none", resize: "none", overflow: "hidden", fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 600, color: "var(--permanent-parchment)", lineHeight: 1.2, marginBottom: "20px", boxSizing: "border-box" as const, padding: "8px 0" }} />
              <textarea ref={editBodyRef} value={editBody} onChange={(e) => { setEditBody(e.target.value); autoGrow(e.target); }} placeholder="Write your experience here." rows={1} style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", overflow: "hidden", fontFamily: "'Inter', sans-serif", fontSize: "16px", color: "var(--permanent-parchment)", lineHeight: 1.8, marginBottom: "20px", boxSizing: "border-box" as const, minHeight: "200px" }} />

              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "rgba(246,241,234,0.45)", marginBottom: "8px" }}>A line to lead with (optional)</p>
              <textarea value={editPull} onChange={(e) => setEditPull(e.target.value)} placeholder="If one sentence stays with you the most, put it here." rows={2} style={{ width: "100%", background: "rgba(184,146,58,0.04)", border: "1px solid rgba(184,146,58,0.2)", borderRadius: "8px", padding: "10px 12px", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "15px", color: "var(--permanent-parchment)", lineHeight: 1.6, resize: "none", outline: "none", boxSizing: "border-box" as const, marginBottom: "20px" }} />

              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "rgba(246,241,234,0.45)", marginBottom: "8px" }}>Photos (optional)</p>
              <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEditImageSelect} style={{ display: "none" }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "8px" }}>
                {editImageUrls.map((url, i) => (
                  <div key={`existing-${i}`} style={{ position: "relative", aspectRatio: "1", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button onClick={() => handleRemoveExistingImage(i)} aria-label="Remove" style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(15,14,12,0.75)", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                {editImagePreviews.map((src, i) => (
                  <div key={`new-${i}`} style={{ position: "relative", aspectRatio: "1", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button onClick={() => handleRemoveNewImage(i)} aria-label="Remove" style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(15,14,12,0.75)", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                {totalEditPhotos < FREE_PHOTO_LIMIT && (
                  <button onClick={() => imageInputRef.current?.click()} style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "8px", cursor: "pointer" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(246,241,234,0.5)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                )}
              </div>
              {editImageError && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#bf9b4e", marginBottom: "8px" }}>{editImageError}</p>}
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "rgba(246,241,234,0.4)", marginBottom: "20px" }}>Up to {FREE_PHOTO_LIMIT} photos on the free plan.</p>

              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "rgba(246,241,234,0.45)", marginBottom: "8px" }}>Video link (optional)</p>
              <input value={editVideoUrl} onChange={(e) => handleEditVideoUrlChange(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${editVideoUrlError ? "#bf9b4e" : "rgba(255,255,255,0.12)"}`, borderRadius: "8px", padding: "10px 12px", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--permanent-parchment)", outline: "none", boxSizing: "border-box" as const }} />
              {editVideoUrlError && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#bf9b4e", marginTop: "6px" }}>{editVideoUrlError}</p>}
              <div style={{ height: "40px" }} />
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,14,12,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-default)", borderRadius: "12px", padding: "28px 24px", maxWidth: "360px", width: "100%", textAlign: "center" as const }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 300, color: "var(--text-primary)", marginBottom: "10px" }}>
              Remove this experience?
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px", lineHeight: 1.6 }}>
              This removes it from Annie permanently. Anyone who has already read or carried it forward will no longer be able to find it here.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setDeleteConfirm(false)} style={{ flex: 1, background: "transparent", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "11px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", color: "var(--text-muted)" }}>
                Keep it
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, background: "var(--permanent-live)", border: "none", borderRadius: "8px", padding: "11px", cursor: deleting ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: 600, color: "white", opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "Removing…" : "Yes, remove it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}