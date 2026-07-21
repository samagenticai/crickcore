import { useEffect, useRef } from "react";
import { Zap } from "lucide-react";
import DeliveryBallChip from "./DeliveryBallChip";
import { VIEWER_CARD } from "./viewerUi";

/**
 * Horizontal ball-by-ball strip — sits below the live score header on the viewer match page.
 */
export default function RecentDeliveriesStrip({ recentBalls, maxVisible = 12 }) {
  const scrollRef = useRef(null);
  const recent = recentBalls?.slice(-maxVisible) || [];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [recentBalls, recent.length]);

  if (!recent.length) return null;

  return (
    <div className={`${VIEWER_CARD} px-3 sm:px-4 py-2.5 sm:py-3 min-w-0 overflow-hidden viewer-fade-in`}>
      <div className="flex items-center gap-2 mb-2 min-w-0">
        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
        <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-secondary truncate">
          Recent Deliveries
        </h3>
      </div>

      <div
        ref={scrollRef}
        className="viewer-deliveries-scroll overflow-x-auto overflow-y-hidden -mx-1 px-1 min-h-[2rem] sm:min-h-[2.25rem]"
        aria-label="Recent deliveries"
      >
        <div className="flex flex-nowrap items-center gap-1.5 w-max pr-1">
          {recent.map((ball) => (
            <DeliveryBallChip key={ball._id || `${ball.sequence}-${ball.label}`} ball={ball} />
          ))}
        </div>
      </div>
    </div>
  );
}
