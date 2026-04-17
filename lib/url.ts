export function appUrl(): string {
  const raw = (process.env.APP_URL || "http://localhost:3000").trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(raw)) return raw;
  const scheme = /^(localhost|127\.0\.0\.1)(:|$)/i.test(raw) ? "http" : "https";
  return `${scheme}://${raw}`;
}
