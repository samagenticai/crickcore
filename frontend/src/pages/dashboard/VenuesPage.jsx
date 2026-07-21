import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { venueAPI } from "../../api/venues";
import VenueFormModal from "../../components/dashboard/VenueFormModal";
import VenueCard from "../../components/dashboard/VenueCard";
import ConfirmModal from "../../components/dashboard/ConfirmModal";
import EmptyState from "../../components/dashboard/EmptyState";

function CardSkeleton() {
  return (
    <div className="card-premium p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse" />
          <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" />
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

export default function VenuesPage() {
  const [venues, setVenues] = useState([]);
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

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await venueAPI.getAll({
        search: debouncedSearch,
        limit: 100,
      });
      setVenues(data.data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load venues");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (venue) => {
    setEditing(venue);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editing) {
        await venueAPI.update(editing._id, payload);
        toast.success("Venue updated successfully");
      } else {
        await venueAPI.create(payload);
        toast.success("Venue created successfully");
      }
      setModalOpen(false);
      setEditing(null);
      fetchVenues();
    } catch (err) {
      if (err.errors?.length) {
        err.errors.forEach((e) => toast.error(e.message));
      } else {
        toast.error(err.message || "Failed to save venue");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await venueAPI.remove(confirmDelete._id);
      toast.success("Venue deleted successfully");
      setConfirmDelete(null);
      fetchVenues();
    } catch (err) {
      toast.error(err.message || "Failed to delete venue");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-secondary tracking-tight">
            Venue Management
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Create and manage cricket grounds for your events
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Venue
        </button>
      </div>

      <div className="card-premium p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search venues by name, city, address, or country..."
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
        ) : venues.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="card-premium">
              <EmptyState
                icon={MapPin}
                title={debouncedSearch ? "No venues found" : "No venues yet"}
                description={
                  debouncedSearch
                    ? "Try a different search term or clear the filter."
                    : "Add your first cricket ground to keep venue details organized."
                }
                action={
                  !debouncedSearch && (
                    <button
                      type="button"
                      onClick={openCreate}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Venue
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
            {venues.map((venue, index) => (
              <VenueCard
                key={venue._id}
                venue={venue}
                index={index}
                onEdit={openEdit}
                onDelete={setConfirmDelete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <VenueFormModal
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
        title="Delete Venue?"
        description={`"${confirmDelete?.venueName}" will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete Venue"
        variant="danger"
        loading={deleting}
      />
    </motion.div>
  );
}
