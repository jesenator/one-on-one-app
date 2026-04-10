import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-stone-50 text-stone-900">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
