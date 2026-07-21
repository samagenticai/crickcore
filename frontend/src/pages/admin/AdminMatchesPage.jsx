import { useCallback, useEffect, useState } from "react";
import { Swords, Eye, Pencil, Trash2, MapPin, Calendar, CircleDot } from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "../../api/admin";
import { useAdminList, adminDelete } from "../../hooks/useAdminList";
import { mediaUrl } from "../../utils/media";
import {
  AdminToolbar,
  AdminFilterSelect,
  AdminPagination,
  AdminEmptyState,
  AdminSkeletonGrid,
  AdminPageIntro,
  AdminStatusBadge,
  AdminFormModal,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminButton,
  AdminActionBar,
  AdminGhostBtn,
  AdminDetailsModal,
  adminDisplay,
  formatAdminDate,
  formatAdminDateTime,
} from "../../components/admin/AdminUI";

const STATUSES = ["Scheduled", "Live", "Completed", "Cancelled"];

function TeamChip({ team }) {
  const logo = mediaUrl(team?.logo);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
        {logo ? (
          <img src={logo} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] font-bold text-slate-500">
            {(team?.shortName || team?.name || "?").slice(0, 3).toUpperCase()}
          </span>
        )}
      </div>
      <span className="text-sm font-bold text-slate-900 truncate">
        {adminDisplay(team?.name)}
      </span>
    </div>
  );
}

export default function AdminMatchesPage() {
  const fetcher = useCallback((params) => adminAPI.getMatches(params), []);
  const { items, pagination, loading, page: _page, setPage, search, setSearch, extra, setExtra, reload } =
    useAdminList(fetcher);

  const [tournaments, setTournaments] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [viewRows, setViewRows] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminAPI.getTournaments({ page: 1, limit: 100 });
        setTournaments(data.data.items || []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const openView = async (row) => {
    setBusyId(row._id);
    try {
      const { data } = await adminAPI.getMatch(row._id);
      const m = data.data;
      setViewRows({
        title: `${m.teamA?.name || "TBD"} vs ${m.teamB?.name || "TBD"}`,
        rows: [
          { label: "Tournament", value: m.tournament?.tournamentName },
          { label: "Date", value: m.scheduledDate ? formatAdminDateTime(m.scheduledDate) : null },
          { label: "Time", value: m.matchTime },
          { label: "Venue", value: m.venueName || m.venue?.venueName },
          {
            label: "Toss",
            value:
              m.tossWinner?.name && m.tossDecision
                ? `${m.tossWinner.name} chose to ${m.tossDecision}`
                : m.tossWinner?.name,
          },
          { label: "Status", value: m.status },
          { label: "Score", value: m.scoreLine },
          { label: "Result", value: m.resultSummary },
          { label: "Winner", value: m.winner?.name },
        ],
      });
    } catch (err) {
      toast.error(err.message || "Failed to load match.");
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (row) => {
    setEditItem(row);
    setEditForm({
      status: row.status || "Scheduled",
      matchTime: row.matchTime || "",
      scheduledDate: row.scheduledDate ? String(row.scheduledDate).slice(0, 16) : "",
      round: row.round || "",
      resultSummary: row.resultSummary || "",
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.updateMatch(editItem._id, {
        status: editForm.status,
        matchTime: editForm.matchTime,
        scheduledDate: editForm.scheduledDate || undefined,
        round: editForm.round,
        resultSummary: editForm.resultSummary,
      });
      toast.success("Match updated successfully.");
      setEditItem(null);
      await reload();
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 min-w-0">
      <AdminPageIntro>Match fixtures and results from live scoring data</AdminPageIntro>
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Filter by loading tournaments…">
        <AdminFilterSelect
          value={extra.status || "all"}
          onChange={(e) => setExtra((x) => ({ ...x, status: e.target.value }))}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </AdminFilterSelect>
        <AdminFilterSelect
          value={extra.tournament || "all"}
          onChange={(e) => setExtra((x) => ({ ...x, tournament: e.target.value }))}
        >
          <option value="all">All tournaments</option>
          {tournaments.map((t) => (
            <option key={t._id} value={t._id}>
              {t.tournamentName}
            </option>
          ))}
        </AdminFilterSelect>
      </AdminToolbar>

      {loading ? (
        <AdminSkeletonGrid count={6} />
      ) : !items.length ? (
        <AdminEmptyState
          icon={Swords}
          title="No matches available."
          description="No match records match your filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {items.map((m) => {
              const isLive = String(m.status).toLowerCase() === "live";
              return (
                <article
                  key={m._id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md min-w-0"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-xs font-semibold text-slate-500 truncate">
                      {adminDisplay(m.tournament?.tournamentName)}
                      {m.round ? ` · ${m.round}` : ""}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {isLive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                          <CircleDot className="w-3 h-3" /> Live
                        </span>
                      )}
                      <AdminStatusBadge status={m.status} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <TeamChip team={m.teamA} />
                    <span className="text-xs font-bold text-slate-400 shrink-0">VS</span>
                    <div className="flex justify-end min-w-0">
                      <TeamChip team={m.teamB} />
                    </div>
                  </div>

                  {(m.scoreLine || m.resultSummary) && (
                    <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
                      {m.scoreLine && (
                        <p className="text-sm font-bold text-slate-900 tabular-nums">{m.scoreLine}</p>
                      )}
                      {m.resultSummary && (
                        <p className="text-xs text-slate-600 mt-0.5">{m.resultSummary}</p>
                      )}
                    </div>
                  )}

                  <dl className="mt-3 space-y-1.5 text-sm text-slate-600">
                    <div className="flex gap-2 min-w-0">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">
                        {m.scheduledDate
                          ? formatAdminDate(m.scheduledDate)
                          : "No data available"}
                        {m.matchTime ? ` · ${m.matchTime}` : ""}
                      </span>
                    </div>
                    <div className="flex gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{adminDisplay(m.venueName || m.venue?.venueName)}</span>
                    </div>
                    {m.tossLabel && (
                      <p className="text-xs text-slate-500 pl-6 truncate">Toss: {m.tossLabel}</p>
                    )}
                  </dl>

                  <AdminActionBar>
                    <AdminGhostBtn disabled={busyId === m._id} onClick={() => openView(m)}>
                      <Eye className="w-3.5 h-3.5" /> View
                    </AdminGhostBtn>
                    <AdminGhostBtn disabled={busyId === m._id} onClick={() => openEdit(m)}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </AdminGhostBtn>
                    <AdminGhostBtn
                      danger
                      disabled={busyId === m._id}
                      onClick={() => {
                        if (window.confirm("Delete this match and its ball-by-ball data?")) {
                          setBusyId(m._id);
                          adminDelete(
                            () => adminAPI.deleteMatch(m._id),
                            reload,
                            "Match deleted successfully."
                          ).finally(() => setBusyId(null));
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </AdminGhostBtn>
                  </AdminActionBar>
                </article>
              );
            })}
          </div>
          <AdminPagination pagination={pagination} onPageChange={setPage} loading={loading} />
        </>
      )}

      <AdminDetailsModal
        open={!!viewRows}
        title={viewRows?.title}
        rows={viewRows?.rows || []}
        onClose={() => setViewRows(null)}
      />

      <AdminFormModal
        open={!!editItem}
        title="Edit match"
        onClose={() => setEditItem(null)}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setEditItem(null)} disabled={saving}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" form="admin-match-form" loading={saving} disabled={saving}>
              Save changes
            </AdminButton>
          </>
        }
      >
        <form id="admin-match-form" onSubmit={saveEdit} className="space-y-3">
          <AdminField label="Status">
            <AdminSelect
              value={editForm.status || "Scheduled"}
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminField label="Scheduled date">
              <AdminInput
                type="datetime-local"
                value={editForm.scheduledDate || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, scheduledDate: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Match time">
              <AdminInput
                value={editForm.matchTime || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, matchTime: e.target.value }))}
              />
            </AdminField>
          </div>
          <AdminField label="Round">
            <AdminInput
              value={editForm.round || ""}
              onChange={(e) => setEditForm((f) => ({ ...f, round: e.target.value }))}
            />
          </AdminField>
          <AdminField label="Result summary">
            <AdminInput
              value={editForm.resultSummary || ""}
              onChange={(e) => setEditForm((f) => ({ ...f, resultSummary: e.target.value }))}
            />
          </AdminField>
        </form>
      </AdminFormModal>
    </div>
  );
}
