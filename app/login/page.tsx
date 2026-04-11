import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>
      <footer className="py-4 text-center text-xs text-stone-400">
        Found a bug? Contact{" "}
        <a href="mailto:jessewgilbert@gmail.com" className="underline hover:text-stone-600">
          jessewgilbert@gmail.com
        </a>
      </footer>
    </div>
  );
}
