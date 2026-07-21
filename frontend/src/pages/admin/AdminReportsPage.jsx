import { useEffect, useState } from "react";
import { TrendingUp, Users, Trophy, Swords, DollarSign, Star, UserPlus, BarChart3 } from "lucide-react";
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

export default function AdminReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminAPI.getReports();
        setReport(data.data);
      } catch (err) {
        toast.error(err.message || "Failed to load reports");
        setReport(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <AdminLoading />;

  if (!report) {
    return (
      <AdminEmptyState
        icon={BarChart3}
        title="No data available"
        description="Report metrics could not be loaded."
      />
    );
  }

  const s = report.summary || report;
  const growth = s.monthlyGrowthPercent ?? report.monthlyGrowthPercent ?? report.monthlyGrowth;

  const cards = [
    {
      label: "Total Revenue",
      value: fmtMoney(s.totalRevenue) ?? "No data available",
      icon: DollarSign,
      tone: "emerald",
    },
    { label: "Pro Users", value: s.totalProUsers, icon: Star, tone: "amber" },
    { label: "New Users (this month)", value: s.newUsers, icon: UserPlus, tone: "blue" },
    { label: "Active Users", value: s.activeUsers, icon: Users, tone: "violet" },
    { label: "Total Matches", value: s.totalMatches, icon: Swords, tone: "slate" },
    { label: "Total Tournaments", value: s.totalTournaments, icon: Trophy, tone: "amber" },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0">
      <AdminPageIntro>Platform analytics from live records</AdminPageIntro>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
        {cards.map((c) => (
          <AdminStatCard key={c.label} {...c} />
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm transition hover:shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Monthly Growth</h2>
        </div>
        {growth == null || Number.isNaN(Number(growth)) ? (
          <p className="text-sm text-slate-500">No data available</p>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
            <p className="text-4xl font-extrabold text-slate-900 tabular-nums tracking-tight">
              {Number(growth) > 0 ? "+" : ""}
              {growth}%
            </p>
            <p className="text-sm text-slate-500 pb-1 leading-relaxed">
              New users vs previous month
              {report.usersThisMonth != null && report.usersPrevMonth != null
                ? ` (${report.usersThisMonth} this month · ${report.usersPrevMonth} last month)`
                : ""}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
