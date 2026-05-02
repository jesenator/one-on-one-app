"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Toast() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = params.get("toast");
  const name = params.get("name");
  const when = params.get("when");
  const msg = params.get("msg");
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!toast) return;
    setOpen(true);
    const t = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!open && toast) {
      const url = new URL(window.location.href);
      url.searchParams.delete("toast");
      url.searchParams.delete("name");
      url.searchParams.delete("when");
      url.searchParams.delete("msg");
      router.replace(url.pathname + (url.search ? url.search : ""));
    }
  }, [open, toast, router]);

  if (!toast || !open) return null;

  let title = "";
  let body = "";
  let tone: "success" | "error" | "neutral" = "neutral";
  if (toast === "accept") {
    title = "Meeting accepted";
    body = name && when ? `You accepted ${name}'s 1:1 on ${when}.` : "Your 1:1 is confirmed.";
    tone = "success";
  } else if (toast === "decline") {
    title = "Meeting declined";
    body = name && when ? `You declined ${name}'s 1:1 on ${when}.` : "Request declined.";
    tone = "neutral";
  } else if (toast === "error") {
    title = "Couldn't complete that";
    body = msg || "The request may have already been handled.";
    tone = "error";
  } else {
    return null;
  }

  const colors = {
    success: "bg-green-50 border-green-200 text-green-900",
    error: "bg-red-50 border-red-200 text-red-900",
    neutral: "bg-stone-50 border-stone-200 text-stone-900",
  }[tone];

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`border rounded-lg shadow-lg p-4 ${colors}`}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{title}</div>
            <div className="text-sm mt-0.5 opacity-90">{body}</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-current opacity-50 hover:opacity-100 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
