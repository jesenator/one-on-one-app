"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import BrandMark from "../BrandMark";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const retreat = searchParams.get("retreat") || "";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), name: name.trim(), retreat }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Something went wrong. Check your email and try again.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex justify-center">
          <BrandMark size="lg" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Pairwise</h1>
        <p className="text-sm text-stone-500 mt-1">We&apos;ll email you a link to sign in</p>
      </div>
      <div className="bg-white rounded-lg border border-stone-200 shadow-sm p-8">
        {sent ? (
          <div className="text-center py-2">
            <h2 className="text-lg font-bold text-stone-900 mb-1.5">Check your email</h2>
            <p className="text-sm text-stone-500">
              Sign-in link sent to{" "}
              <span className="font-medium text-stone-700">{email}</span>.
            </p>
            <p className="text-xs text-stone-400 mt-3">
              Don&apos;t see it? Check your spam folder.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Full name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full border border-stone-200 rounded-md px-3.5 py-2.5 text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-500 text-white rounded-md py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-accent-600"
            >
              {loading ? "Sending email..." : "Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
