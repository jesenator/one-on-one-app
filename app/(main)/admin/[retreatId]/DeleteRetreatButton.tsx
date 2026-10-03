"use client"

import { useState } from "react"

type State = "idle" | "confirm" | "loading" | "done"

export default function DeleteRetreatButton({ retreatId, isSuperAdmin }: { retreatId: string; isSuperAdmin: boolean }) {
  const [state, setState] = useState<State>("idle")
  const [error, setError] = useState<string | null>(null)

  if (!isSuperAdmin) return null

  if (state === "done") {
    return <p className="text-sm text-stone-500">Deleted.</p>
  }

  if (state === "loading") {
    return <p className="text-sm text-stone-500">Deleting…</p>
  }

  if (state === "confirm") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-700">
          Are you sure? This will permanently delete all profiles, availability, and meetings for this retreat.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setState("loading")
              setError(null)
              try {
                const res = await fetch(`/api/admin/retreats/${retreatId}/delete-data`, { method: "POST" })
                const data = await res.json()
                if (!res.ok) {
                  setError(data.error || "Something went wrong.")
                  setState("confirm")
                  return
                }
                setState("done")
                window.location.href = "/admin"
              } catch {
                setError("Network error. Please try again.")
                setState("confirm")
              }
            }}
            className="text-sm font-semibold text-white bg-red-600 rounded-md px-3 py-1.5 hover:bg-red-700 transition"
          >
            Yes, delete everything
          </button>
          <button
            onClick={() => { setState("idle"); setError(null) }}
            className="text-sm text-stone-500 hover:text-stone-700"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setState("confirm")}
      className="text-sm font-semibold text-white bg-red-500 rounded-md px-3 py-1.5 hover:bg-red-600 transition"
    >
      Delete all retreat data
    </button>
  )
}
