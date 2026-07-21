import { Trophy } from "lucide-react";

export default function Logo({ className = "", light = false }) {
  return (
    <a href="/#home" className={`flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0 ${className}`}>
      <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary shadow-md shadow-primary/25 group-hover:shadow-primary/40 transition-shadow duration-300">
        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
      </div>
      <span
        className={`text-base sm:text-lg font-bold tracking-tight truncate ${
          light ? "text-white" : "text-secondary"
        }`}
      >
        Cricket<span className="text-primary">Tournament</span>
      </span>
    </a>
  );
}
