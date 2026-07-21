import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Trophy } from "lucide-react";
import PremiumCard from "../ui/PremiumCard";
import { mediaUrl } from "../../utils/media";
import { cardHover } from "../../utils/animations";
import { getEffectiveTournamentStatus } from "../../utils/tournamentViewer";

const STATUS_CONFIG = {
  Draft: { color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  Upcoming: { color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  Live: { color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", pulse: true },
  Cancelled: { color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-400" },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD";

export default function PublicTournamentCard({ tournament, index = 0 }) {
  const { tournamentName, tournamentLogo, bannerImage, startDate, endDate, hasLiveMatch } = tournament;
  const tournamentId = tournament?._id?.toString?.() ?? tournament?._id;
  const displayStatus = getEffectiveTournamentStatus(tournament, { hasLiveMatch });
  const banner = mediaUrl(bannerImage);
  const logo = mediaUrl(tournamentLogo);
  const statusStyle = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.Upcoming;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      variants={cardHover}
      whileHover="hover"
      className="h-full"
    >
      <Link to={tournamentId ? `/viewer/${tournamentId}` : "/viewer"} className="block h-full group">
        <PremiumCard interactive={false} padding="none" className="h-full overflow-hidden rounded-[14px] group-hover:border-primary/20 transition-all duration-300 group-hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
        <div className="relative h-36 sm:h-40 bg-slate-100">
          {banner ? (
            <img
              src={banner}
              alt={`${tournamentName} banner`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-primary/80 via-primary to-accent/60" />
          )}
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/45" />

          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusStyle.color}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} ${statusStyle.pulse ? "animate-pulse" : ""}`}
              />
              {displayStatus}
            </span>
          </div>

          <div className="absolute -bottom-7 left-4 sm:left-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
              {logo ? (
                <img src={logo} alt={`${tournamentName} logo`} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              )}
            </div>
          </div>
        </div>

        <div className="pt-9 sm:pt-10 px-4 sm:px-5 pb-4 sm:pb-5">
          <h3 className="text-base sm:text-lg font-bold text-secondary leading-snug line-clamp-2">
            {tournamentName}
          </h3>

          <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-text-muted">
            <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
            <span>
              {fmtDate(startDate)} – {fmtDate(endDate)}
            </span>
          </div>
        </div>
      </PremiumCard>
      </Link>
    </motion.div>
  );
}
