"use client";
import { useState } from "react";

export default function LoginPage() {
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
      body: JSON.stringify({ email, name }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Something went wrong. Check your email and try again.");
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-1">EA Retreat 1:1s</h1>
        <p className="text-sm text-gray-600 mb-6">
          Sign in with a magic link.
        </p>
        {sent ? (
          <p className="text-sm">
            Check your email for a login link. You can close this tab.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-lg py-2 font-medium disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
