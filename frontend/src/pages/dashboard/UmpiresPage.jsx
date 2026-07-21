import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gavel, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { umpireAPI } from "../../api/umpires";
import { formToPayload } from "../../constants/umpires";
import UmpireFormModal from "../../components/dashboard/UmpireFormModal";
import UmpireCard from "../../components/dashboard/UmpireCard";
import ConfirmModal from "../../components/dashboard/ConfirmModal";
import EmptyState from "../../components/dashboard/EmptyState";

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
        <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export default function UmpiresPage() {
  const [umpires, setUmpires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUmpires = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await umpireAPI.getAll({
        search: debouncedSearch,
        limit: 100,
      });
      setUmpires(data.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load umpires");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchUmpires();
  }, [fetchUmpires]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (umpire) => {
    setEditing(umpire);
    setModalOpen(true);
  };

  const handleSubmit = async (form) => {
    const payload = formToPayload(form);
    setSubmitting(true);
    try {
      if (editing) {
        await umpireAPI.update(editing._id, payload);
        toast.success("Umpire updated successfully");
      } else {
        await umpireAPI.create(payload);
        toast.success("Umpire created successfully");
      }
      setModalOpen(false);
      setEditing(null);
      fetchUmpires();
    } catch (err) {
      if (err.errors?.length) {
        err.errors.forEach((e) => toast.error(e.message));
      } else {
        toast.error(err.message || "Failed to save umpire");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await umpireAPI.remove(confirmDelete._id);
      toast.success("Umpire deleted successfully");
      setConfirmDelete(null);
      fetchUmpires();
    } catch (err) {
      toast.error(err.message || "Failed to delete umpire");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-secondary tracking-tight">
            Umpire Management
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Register and manage umpires for your cricket events
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Umpire
        </button>
      </div>

      <div className="card-premium p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search umpires by name, phone, city, type, or status..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </motion.div>
        ) : umpires.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="card-premium">
              <EmptyState
                icon={Gavel}
                title={debouncedSearch ? "No umpires found" : "No umpires yet"}
                description={
                  debouncedSearch
                    ? "Try a different search term or clear the filter."
                    : "Add your first umpire to keep officiating staff organized."
                }
                action={
                  !debouncedSearch && (
                    <button
                      type="button"
                      onClick={openCreate}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Umpire
                    </button>
                  )
                }
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {umpires.map((umpire, index) => (
              <UmpireCard
                key={umpire._id}
                umpire={umpire}
                index={index}
                onEdit={openEdit}
                onDelete={setConfirmDelete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <UmpireFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        initial={editing}
        loading={submitting}
      />

      <ConfirmModal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Umpire?"
        description={`"${confirmDelete?.fullName}" will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete Umpire"
        variant="danger"
        loading={deleting}
      />
    </motion.div>
  );
}
