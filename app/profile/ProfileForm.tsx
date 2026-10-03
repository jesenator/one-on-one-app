"use client";

import { useState, useEffect, useRef } from "react";

type UserProfile = {
  name: string;
  email: string;
  tagline: string | null;
  careerStage: string | null;
  aboutMe: string | null;
  goals: string | null;
  canHelpWith: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  photoUrl: string | null;
};

export default function ProfileForm({ user }: { user: UserProfile }) {
  const [name, setName] = useState(user.name ?? "");
  const [tagline, setTagline] = useState(user.tagline ?? "");
  const [careerStage, setCareerStage] = useState(user.careerStage ?? "");
  const [aboutMe, setAboutMe] = useState(user.aboutMe ?? "");
  const [goals, setGoals] = useState(user.goals ?? "");
  const [canHelpWith, setCanHelpWith] = useState(user.canHelpWith ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(user.websiteUrl ?? "");
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl ?? "");

  const [photoInputUrl, setPhotoInputUrl] = useState(user.photoUrl ?? "");
  const [photoPreviewSrc, setPhotoPreviewSrc] = useState<string | null>(null);
  const [photoWarning, setPhotoWarning] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const lastFetchedUrl = useRef<string>("");

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-preview on load if there's an existing photo URL
  useEffect(() => {
    if (user.photoUrl) {
      fetchPreview(user.photoUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchPreview(url: string) {
    const trimmed = url.trim();
    if (!trimmed || trimmed === lastFetchedUrl.current) return;
    lastFetchedUrl.current = trimmed;
    setPhotoLoading(true);
    setPhotoWarning(null);
    setPhotoError(null);
    setPhotoPreviewSrc(null);

    try {
      const res = await fetch("/api/profile/photo-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPhotoError(data.error ?? "Failed to load image");
      } else {
        setPhotoPreviewSrc(data.displayUrl);
        setPhotoUrl(data.displayUrl);
        setPhotoInputUrl(data.displayUrl);
        if (data.warning) setPhotoWarning(data.warning);
      }
    } catch {
      setPhotoError("Failed to reach server");
    } finally {
      setPhotoLoading(false);
    }
  }

  function handlePhotoClear() {
    setPhotoInputUrl("");
    setPhotoUrl("");
    setPhotoPreviewSrc(null);
    setPhotoWarning(null);
    setPhotoError(null);
    lastFetchedUrl.current = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tagline,
          careerStage,
          aboutMe,
          goals,
          canHelpWith,
          linkedinUrl,
          websiteUrl,
          photoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setStatus("error");
        setErrorMsg(data.error ?? "Failed to save");
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error");
    }
  }

  const inputClass =
    "w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500";
  const labelClass = "block text-sm font-semibold text-stone-700 mb-1.5";
  const hintClass = "text-xs text-stone-400 mt-1";

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm p-6 space-y-5"
    >
      <h2 className="text-base font-semibold text-stone-800">Profile information</h2>

      {/* Name */}
      <div>
        <label className={labelClass}>Name <span className="text-red-400">*</span></label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      {/* Email (read-only) */}
      <div>
        <label className={labelClass}>Email</label>
        <input
          disabled
          value={user.email}
          className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm bg-stone-100/50 text-stone-400"
        />
      </div>

      {/* Tagline */}
      <div>
        <label className={labelClass}>Tagline</label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={100}
          placeholder="e.g. AI safety researcher at Anthropic"
          className={inputClass}
        />
        <p className={hintClass}>{tagline.length}/100 characters</p>
      </div>

      {/* Career Stage */}
      <div>
        <label className={labelClass}>Career Stage</label>
        <input
          type="text"
          value={careerStage}
          onChange={(e) => setCareerStage(e.target.value)}
          placeholder="e.g. PhD student, Early career researcher, Senior professional"
          className={inputClass}
        />
      </div>

      {/* About Me */}
      <div>
        <label className={labelClass}>About Me</label>
        <textarea
          value={aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          rows={5}
          className={inputClass}
        />
        <p className={hintClass}>Recommended: under 300 words</p>
      </div>

      {/* Goals */}
      <div>
        <label className={labelClass}>What are you hoping to get out of the event?</label>
        <textarea
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          rows={5}
          className={inputClass}
        />
        <p className={hintClass}>Recommended: under 300 words</p>
      </div>

      {/* Can Help With */}
      <div>
        <label className={labelClass}>How can you help others?</label>
        <textarea
          value={canHelpWith}
          onChange={(e) => setCanHelpWith(e.target.value)}
          rows={5}
          className={inputClass}
        />
        <p className={hintClass}>Recommended: under 300 words</p>
      </div>

      {/* LinkedIn URL */}
      <div>
        <label className={labelClass}>LinkedIn URL</label>
        <input
          type="text"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://linkedin.com/in/yourname"
          className={inputClass}
        />
      </div>

      {/* Website URL */}
      <div>
        <label className={labelClass}>Website URL</label>
        <input
          type="text"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://yourwebsite.com"
          className={inputClass}
        />
      </div>

      {/* Photo URL */}
      <div>
        <label className={labelClass}>Photo</label>
        <div className="flex gap-2 items-start">
          {/* Preview thumbnail beside the input */}
          <div className="shrink-0">
            {photoLoading ? (
              <div className="w-14 h-14 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-stone-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
              </div>
            ) : photoPreviewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreviewSrc}
                alt="Photo preview"
                className="w-14 h-14 rounded-full object-cover border border-stone-200"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-stone-100 border border-stone-200 border-dashed flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-stone-300">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={photoInputUrl}
                onChange={(e) => setPhotoInputUrl(e.target.value)}
                onBlur={(e) => fetchPreview(e.target.value)}
                placeholder="Paste image URL or Google Drive / Dropbox link"
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => fetchPreview(photoInputUrl)}
                disabled={photoLoading || !photoInputUrl.trim()}
                className="shrink-0 px-3 py-2 text-sm font-medium border border-stone-200 rounded-md bg-stone-50 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview
              </button>
              {(photoInputUrl || photoPreviewSrc) && (
                <button
                  type="button"
                  onClick={handlePhotoClear}
                  className="shrink-0 px-3 py-2 text-sm font-medium border border-stone-200 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-500"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-stone-400">Supports Google Drive share links and Dropbox links — they'll be converted to a direct image URL automatically.</p>
            {photoWarning && <p className="text-xs text-amber-600">{photoWarning}</p>}
            {photoError && <p className="text-xs text-red-500">{photoError}</p>}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={status === "saving"}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-accent-500 rounded-md hover:bg-accent-600 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "saving" ? "Saving…" : "Save profile"}
        </button>
        {status === "success" && (
          <span className="text-sm text-emerald-600 font-medium">Saved!</span>
        )}
        {status === "error" && (
          <span className="text-sm text-red-500">{errorMsg ?? "Something went wrong"}</span>
        )}
      </div>
    </form>
  );
}
