"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

async function fetchPhotoPreview(url: string): Promise<{ displayUrl?: string; warning?: string; error?: string }> {
  try {
    const res = await fetch("/api/profile/photo-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });
    return await res.json();
  } catch {
    return { error: "Failed to reach server" };
  }
}

type ProfileData = {
  name: string;
  email: string;
  tagline?: string;
  careerStage?: string;
  aboutMe?: string;
  goals?: string;
  canHelpWith?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  photoUrl?: string;
};

type Props = {
  retreatId?: string;
  initialData: ProfileData;
};

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        current += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        result.push(current);
        current = "";
      } else {
        current += c;
      }
    }
  }
  result.push(current);
  return result;
}

export default function ImportProfileClient({ retreatId, initialData }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [parseError, setParseError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<ProfileData>(initialData);

  const [photoPreviewSrc, setPhotoPreviewSrc] = useState<string | null>(null);
  const [photoWarning, setPhotoWarning] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const lastFetchedPhotoUrl = useRef<string>("");

  async function handlePhotoPreview(url: string) {
    const trimmed = url.trim();
    if (!trimmed || trimmed === lastFetchedPhotoUrl.current) return;
    lastFetchedPhotoUrl.current = trimmed;
    setPhotoLoading(true);
    setPhotoWarning(null);
    setPhotoError(null);
    setPhotoPreviewSrc(null);
    const data = await fetchPhotoPreview(trimmed);
    setPhotoLoading(false);
    if (data.error) {
      setPhotoError(data.error);
    } else if (data.displayUrl) {
      setPhotoPreviewSrc(data.displayUrl);
      setForm((prev) => ({ ...prev, photoUrl: data.displayUrl }));
      if (data.warning) setPhotoWarning(data.warning);
    }
  }

  function handlePhotoClear() {
    setForm((prev) => ({ ...prev, photoUrl: "" }));
    setPhotoPreviewSrc(null);
    setPhotoWarning(null);
    setPhotoError(null);
    lastFetchedPhotoUrl.current = "";
  }

  const skipHref = retreatId ? "/schedule" : "/no-retreat";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== "string") {
        setParseError("Could not read file.");
        return;
      }
      let rows: Record<string, string>[];
      try {
        rows = parseCSV(text);
      } catch {
        setParseError("Failed to parse CSV.");
        return;
      }
      if (rows.length === 0) {
        setParseError("CSV has no data rows.");
        return;
      }
      const row = rows[0];
      setForm((prev) => ({
        ...prev,
        name: row["name"] !== undefined ? row["name"] : prev.name,
        // email is intentionally not overwritten
        tagline: row["tagline"] !== undefined ? row["tagline"] : prev.tagline,
        careerStage:
          row["careerstage"] !== undefined ? row["careerstage"] : prev.careerStage,
        aboutMe: row["aboutme"] !== undefined ? row["aboutme"] : prev.aboutMe,
        goals: row["goals"] !== undefined ? row["goals"] : prev.goals,
        canHelpWith:
          row["canhelpwith"] !== undefined ? row["canhelpwith"] : prev.canHelpWith,
        linkedinUrl:
          row["linkedinurl"] !== undefined ? row["linkedinurl"] : prev.linkedinUrl,
        websiteUrl:
          row["websiteurl"] !== undefined ? row["websiteurl"] : prev.websiteUrl,
        photoUrl: row["photourl"] !== undefined ? row["photourl"] : prev.photoUrl,
      }));
    };
    reader.onerror = () => {
      setParseError("Failed to read file.");
    };
    reader.readAsText(file);
  }

  function set(field: keyof ProfileData) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          tagline: form.tagline ?? "",
          careerStage: form.careerStage ?? "",
          aboutMe: form.aboutMe ?? "",
          goals: form.goals ?? "",
          canHelpWith: form.canHelpWith ?? "",
          linkedinUrl: form.linkedinUrl ?? "",
          websiteUrl: form.websiteUrl ?? "",
          photoUrl: form.photoUrl ?? "",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data?.error ?? "Failed to save profile.");
        setSubmitting(false);
        return;
      }

      router.push(retreatId ? "/schedule" : "/no-retreat");
    } catch {
      setSubmitError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500";
  const labelClass = "block text-sm font-semibold text-stone-700 mb-1.5";
  const textareaClass = inputClass + " resize-y min-h-[80px]";

  return (
    <div className="space-y-5">
      {/* CSV Upload Section */}
      <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-stone-700 mb-1">
            Import from CSV
          </h2>
          <p className="text-xs text-stone-500">
            Upload a CSV exported from a previous retreat to pre-fill your profile.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="text-sm text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
          />
          <a
            href={skipHref}
            className="text-sm text-stone-500 underline underline-offset-2 hover:text-stone-700 shrink-0"
          >
            Skip
          </a>
        </div>
        {parseError && (
          <p className="text-sm text-red-600">{parseError}</p>
        )}
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm p-6 space-y-4"
      >
        <div>
          <label className={labelClass}>Name *</label>
          <input
            name="name"
            required
            value={form.name}
            onChange={set("name")}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            disabled
            value={form.email}
            className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm bg-stone-100/50 text-stone-400"
          />
        </div>

        <div>
          <label className={labelClass}>Tagline</label>
          <input
            name="tagline"
            value={form.tagline ?? ""}
            onChange={set("tagline")}
            className={inputClass}
            placeholder="e.g. Building the future of X"
          />
        </div>

        <div>
          <label className={labelClass}>Career Stage</label>
          <input
            name="careerStage"
            value={form.careerStage ?? ""}
            onChange={set("careerStage")}
            className={inputClass}
            placeholder="e.g. Early-stage founder, Senior IC, …"
          />
        </div>

        <div>
          <label className={labelClass}>About Me</label>
          <textarea
            name="aboutMe"
            value={form.aboutMe ?? ""}
            onChange={set("aboutMe")}
            className={textareaClass}
            placeholder="A short bio about yourself"
          />
        </div>

        <div>
          <label className={labelClass}>Goals</label>
          <textarea
            name="goals"
            value={form.goals ?? ""}
            onChange={set("goals")}
            className={textareaClass}
            placeholder="What are you hoping to get out of this retreat?"
          />
        </div>

        <div>
          <label className={labelClass}>Can Help With</label>
          <textarea
            name="canHelpWith"
            value={form.canHelpWith ?? ""}
            onChange={set("canHelpWith")}
            className={textareaClass}
            placeholder="What can you offer to others at this retreat?"
          />
        </div>

        <div>
          <label className={labelClass}>LinkedIn URL</label>
          <input
            name="linkedinUrl"
            type="url"
            value={form.linkedinUrl ?? ""}
            onChange={set("linkedinUrl")}
            className={inputClass}
            placeholder="https://linkedin.com/in/yourhandle"
          />
        </div>

        <div>
          <label className={labelClass}>Website URL</label>
          <input
            name="websiteUrl"
            type="url"
            value={form.websiteUrl ?? ""}
            onChange={set("websiteUrl")}
            className={inputClass}
            placeholder="https://yoursite.com"
          />
        </div>

        <div>
          <label className={labelClass}>Photo</label>
          <div className="flex gap-2 items-start">
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
                <img src={photoPreviewSrc} alt="Photo preview" className="w-14 h-14 rounded-full object-cover border border-stone-200" />
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
                  name="photoUrl"
                  type="text"
                  value={form.photoUrl ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, photoUrl: e.target.value }))}
                  onBlur={(e) => handlePhotoPreview(e.target.value)}
                  className={`${inputClass} flex-1`}
                  placeholder="Paste image URL or Google Drive / Dropbox link"
                />
                <button
                  type="button"
                  onClick={() => handlePhotoPreview(form.photoUrl ?? "")}
                  disabled={photoLoading || !form.photoUrl?.trim()}
                  className="shrink-0 px-3 py-2 text-sm font-medium border border-stone-200 rounded-md bg-stone-50 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview
                </button>
                {(form.photoUrl || photoPreviewSrc) && (
                  <button type="button" onClick={handlePhotoClear} className="shrink-0 px-3 py-2 text-sm font-medium border border-stone-200 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-500">
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-stone-400">Supports Google Drive share links and Dropbox links — converted to a direct image URL automatically.</p>
              {photoWarning && <p className="text-xs text-amber-600">{photoWarning}</p>}
              {photoError && <p className="text-xs text-red-500">{photoError}</p>}
            </div>
          </div>
        </div>

        {submitError && (
          <p className="text-sm text-red-600">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving…" : "Save and continue"}
        </button>
      </form>
    </div>
  );
}
