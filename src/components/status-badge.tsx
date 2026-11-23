import { STATUS_LABELS } from "@/lib/status";
import type { AppointmentStatus } from "@/lib/types";

const STYLES: Record<AppointmentStatus, string> = {
  pendiente: "border-[#b07a00] bg-[#fff4d6] text-[#6b4a00]",
  confirmada: "border-workwear bg-[#e3ecf5] text-workwear",
  completada: "border-[#1e6b3a] bg-[#e2f2e7] text-[#1e6b3a]",
  cancelada: "border-steel bg-concrete text-steel line-through",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-sm font-semibold ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
