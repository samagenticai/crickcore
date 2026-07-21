import { Link } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";

export default function PublicViewerHeader({ title, subtitle, backTo, backLabel = "Back", ticker = null }) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="section-container py-3 sm:py-4">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </Link>
        )}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 shrink-0">
            <Trophy className="w-[18px] h-[18px] text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-secondary truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-text-muted truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      {ticker}
    </header>
  );
}
