import { useCallback, useEffect, useState } from "react";
import {
  Trophy,
  MapPin,
  Calendar,
  Users,
  Swords,
  Eye,
  Pencil,
  Trash2,
  CircleDot,
} from "lucide-react";
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
  AdminConfirmModal,
  adminDisplay,
  formatAdminDate,
} from "../../components/admin/AdminUI";

const STATUS_OPTIONS = ["Draft", "Upcoming", "Live", "Completed", "Cancelled"];

/** Never send "" as a Mongo ObjectId — empty means null (no venue). */
const venuePayload = (value) => {
  if (value == null || value === "") return null;
  return value;
};

export default function AdminTournamentsPage() {
  const fetcher = useCallback((params) => adminAPI.getTournaments(params), []);
  const { items, pagination, loading, page: _page, setPage, search, setSearch, extra, setExtra, reload } =
    useAdminList(fetcher);
  const [venues, setVenues] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [viewRows, setViewRows] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminAPI.getVenues({ page: 1, limit: 200 });
        setVenues(data.data.items || []);
      } catch {
        setVenues([]);
      }
    })();
  }, []);

  const openView = async (row) => {
    setBusyId(row._id);
    try {
      const { data } = await adminAPI.getTournament(row._id);
      const t = data.data;
      setViewRows({
        title: t.tournamentName || "Tournament",
        rows: [
          { label: "Name", value: t.tournamentName },
          { label: "Type", value: t.tournamentType || t.matchFormat },
          { label: "Organizer", value: t.organizerName || t.createdBy?.fullName },
          { label: "Venue", value: t.venueName || t.venue?.venueName || t.groundName || t.city },
          { label: "Start", value: t.startDate ? formatAdminDate(t.startDate) : null },
          { label: "End", value: t.endDate ? formatAdminDate(t.endDate) : null },
          { label: "Status", value: t.status },
          { label: "Teams", value: t.teamsCount },
          { label: "Matches", value: t.matchesCount },
        ],
      });
    } catch (err) {
      toast.error(err.message || "Failed to load tournament.");
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = async (row) => {
    setBusyId(row._id);
    try {
      const { data } = await adminAPI.getTournament(row._id);
      const t = data.data;
      const venueId = t.venue?._id || t.venue || "";
      setEditItem(t);
      setEditForm({
        tournamentName: t.tournamentName || "",
        status: t.status || "Draft",
        city: t.city || "",
        startDate: t.startDate ? String(t.startDate).slice(0, 10) : "",
        endDate: t.endDate ? String(t.endDate).slice(0, 10) : "",
        tournamentType: t.tournamentType || "",
        matchFormat: t.matchFormat || "",
        venue: venueId && String(venueId).length === 24 ? String(venueId) : "",
      });
    } catch (err) {
      toast.error(err.message || "Failed to load tournament.");
    } finally {
      setBusyId(null);
    }
  };

  const saveEdit = async (e) => {
    e?.preventDefault?.();
    if (!editForm.tournamentName?.trim()) {
      toast.error("Tournament name is required.");
      return;
    }
    setSaving(true);
    try {
      await adminAPI.updateTournament(editItem._id, {
        tournamentName: editForm.tournamentName.trim(),
        status: editForm.status,
        city: editForm.city.trim(),
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
        tournamentType: editForm.tournamentType || undefined,
        matchFormat: editForm.matchFormat || undefined,
        venue: venuePayload(editForm.venue),
      });
      toast.success("Tournament updated successfully.");
      setEditItem(null);
      await reload();
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDelete(
        () => adminAPI.deleteTournament(deleteTarget._id),
        reload,
        "Tournament deleted successfully."
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 min-w-0">
      <AdminPageIntro>Manage every tournament from live MongoDB records</AdminPageIntro>
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Search tournaments…">
        <AdminFilterSelect
          value={extra.status || "all"}
          onChange={(e) => setExtra((x) => ({ ...x, status: e.target.value }))}
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </AdminFilterSelect>
      </AdminToolbar>

      {loading ? (
        <AdminSkeletonGrid count={6} />
      ) : !items.length ? (
        <AdminEmptyState
          icon={Trophy}
          title="No tournaments available."
          description="No tournament records match your search or filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {items.map((t) => {
              const logo = mediaUrl(t.tournamentLogo);
              const isLive = String(t.status).toLowerCase() === "live";
              return (
                <article
                  key={t._id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 min-w-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {logo ? (
                        <img src={logo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Trophy className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 truncate">{adminDisplay(t.tournamentName)}</h3>
                        {isLive && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                            <CircleDot className="w-3 h-3" /> Live
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {adminDisplay(t.typeLabel || t.tournamentType || t.matchFormat)}
                      </p>
                      <div className="mt-2">
                        <AdminStatusBadge status={t.status} />
                      </div>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex gap-2 min-w-0">
                      <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-slate-600 truncate">
                        {adminDisplay(t.organizerName || t.createdBy?.fullName)}
                      </span>
                    </div>
                    <div className="flex gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-slate-600 truncate">{adminDisplay(t.venueName)}</span>
                    </div>
                    <div className="flex gap-2 min-w-0">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-slate-600 truncate">
                        {t.startDate || t.endDate
                          ? `${formatAdminDate(t.startDate)} → ${formatAdminDate(t.endDate)}`
                          : "No data available"}
                      </span>
                    </div>
                  </dl>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Teams</p>
                      <p className="text-sm font-bold text-slate-900">{t.teamsCount ?? 0}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Swords className="w-3 h-3" /> Matches
                      </p>
                      <p className="text-sm font-bold text-slate-900">{t.matchesCount ?? 0}</p>
                    </div>
                  </div>

                  <AdminActionBar>
                    <AdminGhostBtn disabled={busyId === t._id} onClick={() => openView(t)}>
                      <Eye className="w-3.5 h-3.5" /> View
                    </AdminGhostBtn>
                    <AdminGhostBtn disabled={busyId === t._id} onClick={() => openEdit(t)}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </AdminGhostBtn>
                    <AdminGhostBtn
                      danger
                      disabled={busyId === t._id}
                      onClick={() => setDeleteTarget(t)}
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
        title="Edit tournament"
        onClose={() => setEditItem(null)}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setEditItem(null)} disabled={saving}>
              Cancel
            </AdminButton>
            <AdminButton loading={saving} disabled={saving} onClick={saveEdit}>
              Save changes
            </AdminButton>
          </>
        }
      >
        <form
          id="admin-tournament-edit"
          onSubmit={saveEdit}
          className="space-y-3"
        >
          <AdminField label="Tournament name">
            <AdminInput
              value={editForm.tournamentName || ""}
              onChange={(e) => setEditForm((f) => ({ ...f, tournamentName: e.target.value }))}
              required
            />
          </AdminField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminField label="Status">
              <AdminSelect
                value={editForm.status || "Draft"}
                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="City">
              <AdminInput
                value={editForm.city || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Venue" className="sm:col-span-2">
              <AdminSelect
                value={editForm.venue || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, venue: e.target.value }))}
              >
                <option value="">No venue</option>
                {venues.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.venueName}
                    {v.city ? ` · ${v.city}` : ""}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Start date">
              <AdminInput
                type="date"
                value={editForm.startDate || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </AdminField>
            <AdminField label="End date">
              <AdminInput
                type="date"
                value={editForm.endDate || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </AdminField>
          </div>
        </form>
      </AdminFormModal>

      <AdminConfirmModal
        open={!!deleteTarget}
        title="Delete tournament?"
        message={
          deleteTarget
            ? `Permanently delete "${deleteTarget.tournamentName}" and all related matches, teams, players, and scores?`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
