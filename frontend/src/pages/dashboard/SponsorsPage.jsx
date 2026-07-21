import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { sponsorAPI } from "../../api/sponsors";
import { formToFormData, SPONSOR_TYPES } from "../../constants/sponsors";
import SponsorFormModal from "../../components/dashboard/SponsorFormModal";
import SponsorCard from "../../components/dashboard/SponsorCard";
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
    </div>
  );
}

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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
  }, [statusFilter, typeFilter]);

  const fetchSponsors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await sponsorAPI.getAll({
        search: debouncedSearch,
        status: statusFilter,
        sponsorType: typeFilter,
        page,
        limit: 12,
      });
      setSponsors(data.data || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error(err.message || "Failed to load sponsors");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, typeFilter, page]);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (sponsor) => {
    setEditing(sponsor);
    setModalOpen(true);
  };

  const handleSubmit = async (form) => {
    const payload = formToFormData(form);
    setSubmitting(true);
    try {
      if (editing) {
        await sponsorAPI.update(editing._id, payload);
        toast.success("Sponsor updated successfully.");
      } else {
        await sponsorAPI.create(payload);
        toast.success("Sponsor created successfully.");
      }
      setModalOpen(false);
      setEditing(null);
      fetchSponsors();
    } catch (err) {
      if (err.errors?.length) {
        err.errors.forEach((e) => toast.error(e.message));
      } else {
        toast.error(err.message || "Failed to save sponsor");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await sponsorAPI.remove(confirmDelete._id);
      toast.success("Sponsor deleted successfully.");
      setConfirmDelete(null);
      fetchSponsors();
    } catch (err) {
      toast.error(err.message || "Failed to delete sponsor");
    } finally {
      setDeleting(false);
    }
  };

  const viewLogo = viewing ? mediaUrl(viewing.logo) : "";

  return (
    <div className="space-y-5 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-text-muted">
          Manage tournament sponsors and assign them when creating events.
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Sponsor
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sponsors…"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary"
        >
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary"
        >
          <option value="all">All types</option>
          {SPONSOR_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : sponsors.length === 0 ? (
        <div className="card-premium">
          <EmptyState
            icon={Handshake}
            title={debouncedSearch || statusFilter !== "all" || typeFilter !== "all" ? "No sponsors found" : "No sponsors yet"}
            description={
              debouncedSearch || statusFilter !== "all" || typeFilter !== "all"
                ? "Try a different search term or clear the filters."
                : "Add sponsors so you can assign them to tournaments."
            }
            action={
              !debouncedSearch &&
              statusFilter === "all" &&
              typeFilter === "all" && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Sponsor
                </button>
              )
            }
          />
        </div>
      ) : (
        <>
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {sponsors.map((sponsor, index) => (
                <SponsorCard
                  key={sponsor._id}
                  sponsor={sponsor}
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
                {pagination.total} sponsor{pagination.total !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-secondary disabled:opacity-40"
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
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-secondary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <SponsorFormModal
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
        title="Delete Sponsor?"
        description={
          confirmDelete
            ? `"${confirmDelete.sponsorName}" will be removed from your library and any assigned tournaments.`
            : ""
        }
        confirmLabel="Delete Sponsor"
        variant="danger"
        loading={deleting}
      />

      <DashboardFormModal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        maxWidthClass="max-w-md"
        header={
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-secondary truncate">{viewing?.sponsorName || "Sponsor"}</h2>
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
                {viewLogo ? (
                  <img src={viewLogo} alt="" className="w-full h-full object-contain bg-white p-1" />
                ) : (
                  <Handshake className="w-8 h-8 text-primary/50" />
                )}
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              {[
                ["Company", viewing.companyName || "—"],
                ["Type", viewing.sponsorType || "—"],
                ["Contact", viewing.contactPerson || "—"],
                ["Phone", viewing.phone || "—"],
                ["Email", viewing.email || "—"],
                ["Website", viewing.website || "—"],
                ["Address", viewing.address || "—"],
                [
                  "Amount",
                  viewing.sponsorshipAmount != null ? String(viewing.sponsorshipAmount) : "—",
                ],
                ["Status", viewing.status || "—"],
                ["Notes", viewing.notes || "—"],
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
