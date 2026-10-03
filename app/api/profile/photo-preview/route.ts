import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

function extractGoogleDriveId(url: string): string | null {
  // drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (fileMatch) return fileMatch[1];

  // drive.google.com/open?id=FILE_ID or drive.google.com/uc?id=FILE_ID
  const paramMatch = url.match(/drive\.google\.com\/(?:open|uc)\?.*id=([^&]+)/);
  if (paramMatch) return paramMatch[1];

  return null;
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s.userId) return NextResponse.json({ error: "unauth" }, { status: 401 });

  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const url = body.url;
  if (typeof url !== "string" || url.trim() === "") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const trimmedUrl = url.trim();

  // 1. Google Drive detection
  const driveId = extractGoogleDriveId(trimmedUrl);
  if (driveId) {
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w300`;
    let warning: string | undefined;
    try {
      const headRes = await fetch(thumbnailUrl, { method: "HEAD" });
      const ct = headRes.headers.get("content-type") ?? "";
      if (!ct.startsWith("image/")) {
        warning = "Image may not be publicly shared";
      }
    } catch {
      warning = "Image may not be publicly shared";
    }
    const result: { displayUrl: string; warning?: string } = { displayUrl: thumbnailUrl };
    if (warning) result.warning = warning;
    return NextResponse.json(result);
  }

  // 2. Dropbox
  if (trimmedUrl.includes("dropbox.com")) {
    const displayUrl = trimmedUrl.replace(/\?dl=0$/, "?raw=1");
    return NextResponse.json({ displayUrl });
  }

  // 3. All other URLs
  try {
    const headRes = await fetch(trimmedUrl, { method: "HEAD" });
    const ct = headRes.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) {
      return NextResponse.json({ error: "URL does not point to an image" }, { status: 400 });
    }
    const cl = headRes.headers.get("content-length");
    const sizeBytes = cl ? parseInt(cl, 10) : 0;
    const FIVE_MB = 5 * 1024 * 1024;
    if (!isNaN(sizeBytes) && sizeBytes > FIVE_MB) {
      return NextResponse.json({
        displayUrl: trimmedUrl,
        warning: "Image is large and may load slowly",
      });
    }
    return NextResponse.json({ displayUrl: trimmedUrl });
  } catch {
    return NextResponse.json({ error: "Failed to reach URL" }, { status: 400 });
  }
}
