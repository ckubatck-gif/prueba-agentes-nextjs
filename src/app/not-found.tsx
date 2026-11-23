import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-bold">Esta página no existe</h1>
      <p>Puede que el enlace esté mal escrito o que la página se haya movido.</p>
      <Link href="/" className="self-start rounded-md bg-workwear px-5 py-3 font-semibold text-paper hover:bg-workwear-dark">
        Ir a la portada
      </Link>
    </div>
  );
}
