import { useCallback, useState } from "react";
import { MapPin, Gavel } from "lucide-react";
import { adminAPI } from "../../api/admin";
import { useAdminList, adminDelete } from "../../hooks/useAdminList";
import {
  AdminToolbar,
  AdminPagination,
  AdminEmptyState,
  AdminSkeletonGrid,
  AdminPageIntro,
  AdminActionBar,
  AdminGhostBtn,
  adminDisplay,
} from "../../components/admin/AdminUI";
import { Trash2 } from "lucide-react";

function SimpleCardList({
  fetcher,
  emptyTitle,
  emptyIcon: EmptyIcon,
  renderCard,
  confirmMsg,
  deleteFn,
}) {
  const { items, pagination, loading, page: _page, setPage, search, setSearch, reload } =
    useAdminList(fetcher);
  const [busyId, setBusyId] = useState(null);

  return (
    <div className="space-y-4 min-w-0">
      <AdminToolbar search={search} onSearch={setSearch} />
      {loading ? (
        <AdminSkeletonGrid count={4} />
      ) : !items.length ? (
        <AdminEmptyState icon={EmptyIcon} title={emptyTitle} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {items.map((row) => (
              <article
                key={row._id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md min-w-0"
              >
                {renderCard(row)}
                <AdminActionBar>
                  <AdminGhostBtn
                    danger
                    disabled={busyId === row._id}
                    onClick={() => {
                      if (window.confirm(confirmMsg(row))) {
                        setBusyId(row._id);
                        adminDelete(() => deleteFn(row._id), reload, "Deleted successfully.").finally(
                          () => setBusyId(null)
                        );
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </AdminGhostBtn>
                </AdminActionBar>
              </article>
            ))}
          </div>
          <AdminPagination pagination={pagination} onPageChange={setPage} loading={loading} />
        </>
      )}
    </div>
  );
}

export function AdminVenuesPage() {
  const fetcher = useCallback((p) => adminAPI.getVenues(p), []);
  return (
    <div className="space-y-4 min-w-0">
      <AdminPageIntro>Venues registered by organizers</AdminPageIntro>
      <SimpleCardList
        fetcher={fetcher}
        emptyTitle="No venues available."
        emptyIcon={MapPin}
        confirmMsg={(r) => `Delete venue "${r.venueName}"?`}
        deleteFn={(id) => adminAPI.deleteVenue(id)}
        renderCard={(r) => (
          <>
            <h3 className="font-bold text-slate-900 truncate">{adminDisplay(r.venueName)}</h3>
            <p className="text-sm text-slate-500 mt-1 truncate">
              {[r.city, r.country].filter(Boolean).join(", ") || "No data available"}
            </p>
            <p className="text-xs text-slate-400 mt-2 truncate">
              {adminDisplay(r.organizerId?.fullName)}
            </p>
          </>
        )}
      />
    </div>
  );
}

export function AdminUmpiresPage() {
  const fetcher = useCallback((p) => adminAPI.getUmpires(p), []);
  return (
    <div className="space-y-4 min-w-0">
      <AdminPageIntro>Umpires across the platform</AdminPageIntro>
      <SimpleCardList
        fetcher={fetcher}
        emptyTitle="No umpires available."
        emptyIcon={Gavel}
        confirmMsg={(r) => `Delete umpire "${r.fullName}"?`}
        deleteFn={(id) => adminAPI.deleteUmpire(id)}
        renderCard={(r) => (
          <>
            <h3 className="font-bold text-slate-900 truncate">{adminDisplay(r.fullName)}</h3>
            <p className="text-sm text-slate-500 mt-1 truncate">{adminDisplay(r.phoneNumber)}</p>
            <p className="text-xs text-slate-400 mt-2 truncate">
              {adminDisplay(r.city)} · {adminDisplay(r.organizerId?.fullName)}
            </p>
          </>
        )}
      />
    </div>
  );
}
