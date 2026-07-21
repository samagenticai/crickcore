import { ExternalLink, Handshake } from "lucide-react";
import { mediaUrl } from "../../utils/media";

/** Active sponsors strip for public / live viewer surfaces */
export default function PublicSponsorsSection({ sponsors = [], title = "Sponsors" }) {
  const list = (sponsors || []).filter(
    (s) => s && (s.status == null || s.status === "Active")
  );
  if (!list.length) return null;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 min-w-0 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Handshake className="w-4 h-4 text-primary shrink-0" />
        <h3 className="text-sm font-bold text-secondary">{title}</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 min-w-0">
        {list.map((s) => {
          const logo = mediaUrl(s.logo);
          const href = s.website || null;
          const inner = (
            <>
              <div className="w-full aspect-[3/2] rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-2">
                {logo ? (
                  <img src={logo} alt="" className="max-h-full max-w-full object-contain p-2" />
                ) : (
                  <Handshake className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <p className="text-xs font-semibold text-secondary truncate">{s.sponsorName}</p>
              {s.sponsorType && (
                <p className="text-[10px] text-text-muted truncate mt-0.5">{s.sponsorType}</p>
              )}
            </>
          );

          if (href) {
            return (
              <a
                key={s._id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="block min-w-0 rounded-xl p-2 hover:bg-slate-50 transition-colors group"
              >
                {inner}
                <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Visit <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            );
          }

          return (
            <div key={s._id} className="min-w-0 rounded-xl p-2">
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
