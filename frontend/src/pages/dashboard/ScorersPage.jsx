import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { scorerAPI } from "../../api/scorers";
import { formToFormData } from "../../constants/scorers";
import ScorerFormModal from "../../components/dashboard/ScorerFormModal";
import ScorerCard from "../../components/dashboard/ScorerCard";
import ConfirmModal from "../../components/dashboard/ConfirmModal";
import EmptyState from "../../components/dashboard/EmptyState";
import DashboardFormModal from "../../components/dashboard/DashboardFormModal";
import { mediaUrl } from "../../utils/media";

function CardSkeleton() {
  return (
    <div className="card-premium p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />
          <div className="h-6 w-24 bg-slate-100 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-100 rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export default function ScorersPage() {
  const [scorers, setScorers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const fetchScorers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await scorerAPI.getAll({
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit: 12,
      });
      setScorers(data.data || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error(err.message || "Failed to load scorers");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    fetchScorers();
  }, [fetchScorers]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (scorer) => {
    setEditing(scorer);
    setModalOpen(true);
  };

  const handleSubmit = async (form) => {
    const payload = formToFormData(form);
    setSubmitting(true);
    try {
      if (editing) {
        await scorerAPI.update(editing._id, payload);
        toast.success("Scorer updated successfully.");
      } else {
        await scorerAPI.create(payload);
        toast.success("Scorer created successfully.");
      }
      setModalOpen(false);
      setEditing(null);
      fetchScorers();
    } catch (err) {
      if (err.errors?.length) {
        err.errors.forEach((e) => toast.error(e.message));
      } else {
        toast.error(err.message || "Failed to save scorer");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await scorerAPI.remove(confirmDelete._id);
      toast.success("Scorer deleted successfully.");
      setConfirmDelete(null);
      fetchScorers();
    } catch (err) {
      toast.error(err.message || "Failed to delete scorer");
    } finally {
      setDeleting(false);
    }
  };

  const viewPhoto = viewing ? mediaUrl(viewing.profilePhoto) : "";

  return (
    <div className="space-y-5 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-text-muted">
          Manage official scorers for your tournaments and live matches.
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Scorer
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scorers…"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
        >
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : scorers.length === 0 ? (
        <div className="card-premium">
          <EmptyState
            icon={ClipboardList}
            title={debouncedSearch || statusFilter !== "all" ? "No scorers found" : "No scorers yet"}
            description={
              debouncedSearch || statusFilter !== "all"
                ? "Try a different search term or clear the filter."
                : "Add scorers so you can assign them when starting a match."
            }
            action={
              !debouncedSearch &&
              statusFilter === "all" && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Scorer
                </button>
              )
            }
          />
        </div>
      ) : (
        <>
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {scorers.map((scorer, index) => (
                <ScorerCard
                  key={scorer._id}
                  scorer={scorer}
                  index={index}
                  onView={setViewing}
                  onEdit={openEdit}
                  onDelete={setConfirmDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <p className="text-xs text-text-muted">
                {pagination.total} scorer{pagination.total !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold ${
                      p === page
                        ? "bg-primary text-white"
                        : "border border-slate-200 text-text-muted hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ScorerFormModal
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        loading={submitting}
      />

      <ConfirmModal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Scorer?"
        description={
          confirmDelete
            ? `"${confirmDelete.fullName}" will be removed. Past scorecards will still show their name.`
            : ""
        }
        confirmLabel="Delete Scorer"
        variant="danger"
        loading={deleting}
      />

      <DashboardFormModal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        maxWidthClass="max-w-md"
        header={
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-secondary truncate">{viewing?.fullName || "Scorer"}</h2>
            <button
              type="button"
              onClick={() => setViewing(null)}
              className="text-sm font-semibold text-text-muted hover:text-secondary"
            >
              Close
            </button>
          </div>
        }
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 overflow-hidden flex items-center justify-center">
                {viewPhoto ? (
                  <img src={viewPhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ClipboardList className="w-8 h-8 text-primary/50" />
                )}
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              {[
                ["Phone", viewing.phone],
                ["Email", viewing.email || "—"],
                ["City", viewing.city || "—"],
                ["Status", viewing.status || "—"],
                [
                  "Experience",
                  viewing.experience != null ? `${viewing.experience} years` : "—",
                ],
                ["Notes", viewing.notes || "—"],
                [
                  "Created",
                  viewing.createdAt
                    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                        new Date(viewing.createdAt)
                      )
                    : "—",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <dt className="text-text-muted shrink-0">{label}</dt>
                  <dd className="font-semibold text-secondary text-right break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </DashboardFormModal>
    </div>
  );
}
