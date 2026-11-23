import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Acceso del taller",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10 sm:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-bold">Acceso del taller</h1>
        <p className="text-steel">Solo para el personal: aquí se gestionan las citas.</p>
      </div>
      <div className="rounded-lg border border-line bg-paper p-5 sm:p-6">
        <LoginForm />
      </div>
    </div>
  );
}
