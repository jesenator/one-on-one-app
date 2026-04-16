"use client";

export default function DeleteButton({ action }: { action: () => Promise<void> }) {
  return (
    <button
      onClick={() => {
        if (window.confirm("Delete your account? This will cancel all your meetings and remove your data.")) {
          action();
        }
      }}
      className="text-sm text-red-500 font-medium border border-red-200 rounded-md px-4 py-2 hover:bg-red-50"
    >
      Delete account
    </button>
  );
}
