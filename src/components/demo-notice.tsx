/** Aviso visible de que la web es una demo (D7.7). */
export function DemoNotice() {
  return (
    <aside
      aria-label="Aviso de demostración"
      className="border-l-8 border-ink bg-signal px-4 py-3 text-ink"
    >
      <p className="font-semibold">Esto es una demo: no escribas datos reales.</p>
      <p className="text-sm">
        Usa un nombre, un teléfono y una matrícula inventados. Las citas no llegan a ningún taller y se pueden borrar
        en cualquier momento.
      </p>
    </aside>
  );
}
