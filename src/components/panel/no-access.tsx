import { SignOutButton } from "@/components/auth/sign-out-button";

/** Usuario con sesión que no es personal del taller: no se le muestra ningún dato. */
export function NoAccess({ email }: { email: string | null }) {
  return (
    <section className="flex max-w-xl flex-col gap-3 rounded-lg border border-line bg-paper p-5 sm:p-6">
      <h1 className="font-display text-3xl font-bold">Sin acceso al panel</h1>
      <p>
        {email ? <>La cuenta {email} </> : <>Tu cuenta </>}
        no está dada de alta como personal del taller. Si crees que es un error, pide al responsable que te añada.
      </p>
      <SignOutButton tone="dark" />
    </section>
  );
}
