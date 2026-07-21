/** Shared delivery chip styling for viewer live score UI */
export function getDeliveryChipTone(ball) {
  if (ball.type === "wicket") return "bg-red-100 text-red-700 border-red-200";
  if (ball.runs === 4) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (ball.runs === 6) return "bg-amber-100 text-amber-700 border-amber-200";
  if (ball.type === "wide" || ball.type === "no_ball") {
    return "bg-purple-100 text-purple-700 border-purple-200";
  }
  return "bg-slate-50 text-secondary border-slate-200";
}

export default function DeliveryBallChip({ ball }) {
  return (
    <span
      className={`min-w-[1.75rem] h-7 sm:min-w-[2rem] sm:h-8 px-1.5 rounded-full inline-flex items-center justify-center text-[10px] sm:text-[11px] font-bold border shrink-0 ${getDeliveryChipTone(ball)}`}
    >
      {ball.label}
    </span>
  );
}
