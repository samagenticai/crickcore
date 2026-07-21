import { useEffect, useState } from "react";
import {
  Users,
  Trophy,
  Swords,
  MapPin,
  Gavel,
  Handshake,
  UserCheck,
  CircleDot,
  Building2,
  Star,
  DollarSign,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "../../api/admin";
import {
  AdminStatCard,
  AdminLoading,
  AdminEmptyState,
  AdminPageIntro,
} from "../../components/admin/AdminUI";

const fmtMoney = (n) => {
  if (n == null || Number.isNaN(Number(n))) return null;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(Number(n) / 100);
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminAPI.getDashboard();
        setStats(data.data?.stats ?? null);
        setError(false);
      } catch (err) {
        setError(true);
        setStats(null);
        toast.error(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <AdminLoading />;

  if (error || !stats) {
    return (
      <AdminEmptyState
        icon={Activity}
        title="No data available"
        description="Dashboard statistics could not be loaded right now."
      />
    );
  }

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, tone: "blue" },
    { label: "Organizers", value: stats.totalOrganizers, icon: UserCheck, tone: "violet" },
    { label: "Tournaments", value: stats.totalTournaments, icon: Trophy, tone: "amber" },
    { label: "Teams", value: stats.totalTeams, icon: Building2, tone: "slate" },
    { label: "Players", value: stats.totalPlayers, icon: Users, tone: "slate" },
    { label: "Matches", value: stats.totalMatches, icon: Swords, tone: "slate" },
    { label: "Live Matches", value: stats.liveMatches, icon: CircleDot, tone: "red" },
    { label: "Venues", value: stats.totalVenues, icon: MapPin, tone: "emerald" },
    { label: "Umpires", value: stats.totalUmpires, icon: Gavel, tone: "emerald" },
    { label: "Sponsors", value: stats.totalSponsors, icon: Handshake, tone: "slate" },
    { label: "Pro Users", value: stats.totalProUsers, icon: Star, tone: "amber" },
    {
      label: "Total Revenue",
      value: fmtMoney(stats.totalRevenue) ?? "No data available",
      icon: DollarSign,
      tone: "emerald",
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0">
      <AdminPageIntro>Platform-wide overview from live data</AdminPageIntro>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
        {cards.map((c) => (
          <AdminStatCard key={c.label} {...c} />
        ))}
      </div>
    </div>
  );
}
