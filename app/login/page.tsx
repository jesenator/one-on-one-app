import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-zinc-50 text-zinc-900">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
