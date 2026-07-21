import { useCallback, useState } from "react";
import { ClipboardList, Eye, Pencil, Trash2, Phone, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "../../api/admin";
import { useAdminList, adminDelete } from "../../hooks/useAdminList";
import { SCORER_STATUSES } from "../../constants/scorers";
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
} from "../../components/admin/AdminUI";

function initials(name = "") {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase() || "?"
  );
}

export default function AdminScorersPage() {
  const fetcher = useCallback((params) => adminAPI.getScorers(params), []);
  const { items, pagination, loading, page: _page, setPage, search, setSearch, extra, setExtra, reload } =
    useAdminList(fetcher);

  const [busyId, setBusyId] = useState(null);
  const [viewRows, setViewRows] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const openView = (row) => {
    setViewRows({
      title: row.fullName,
      rows: [
        { label: "Organizer", value: row.organizerName || row.organizerId?.fullName },
        { label: "Phone", value: row.phone },
        { label: "Email", value: row.email },
        { label: "City", value: row.city },
        { label: "Experience", value: row.experience != null ? `${row.experience} years` : null },
        { label: "Status", value: row.status },
        { label: "Assigned Matches", value: String(row.assignedMatches ?? 0) },
        { label: "Notes", value: row.notes },
        { label: "Created", value: row.createdAt ? formatAdminDate(row.createdAt) : null },
      ],
    });
  };

  const openEdit = (row) => {
    setEditItem(row);
    setEditForm({
      fullName: row.fullName || "",
      phone: row.phone || "",
      email: row.email || "",
      city: row.city || "",
      experience: row.experience != null ? String(row.experience) : "",
      status: row.status || "Active",
      notes: row.notes || "",
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    if (!editForm.fullName?.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!editForm.phone?.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setSaving(true);
    try {
      await adminAPI.updateScorer(editItem._id, {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        city: editForm.city.trim(),
        experience: editForm.experience === "" ? "" : Number(editForm.experience),
        status: editForm.status,
        notes: editForm.notes.trim(),
      });
      toast.success("Scorer updated successfully.");
      setEditItem(null);
      reload();
    } catch (err) {
      toast.error(err.message || "Failed to update scorer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 min-w-0">
      <AdminPageIntro>
        Manage scorers across all organizers. Deleting a scorer keeps historical scorecard names.
      </AdminPageIntro>

      <AdminToolbar search={search} onSearch={setSearch} placeholder="Search scorers…">
        <AdminFilterSelect
          value={extra.status || "all"}
          onChange={(e) => setExtra((x) => ({ ...x, status: e.target.value }))}
        >
          <option value="all">All statuses</option>
          {SCORER_STATUSES.map((s) => (
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
          icon={ClipboardList}
          title="No scorers available."
          description="No scorer records match your filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {items.map((row) => {
              const photo = mediaUrl(row.profilePhoto);
              return (
                <article
                  key={row._id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md min-w-0 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                      {photo ? (
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-slate-500">{initials(row.fullName)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 truncate">{adminDisplay(row.fullName)}</h3>
                      <div className="mt-1.5">
                        <AdminStatusBadge status={row.status} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-slate-500 min-w-0">
                    <p className="flex items-center gap-2 truncate">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      {adminDisplay(row.organizerName || row.organizerId?.fullName)}
                    </p>
                    <p className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      {adminDisplay(row.phone)}
                    </p>
                    {row.email && (
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        {row.email}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 pt-0.5">
                      Matches: {row.assignedMatches ?? 0}
                      {row.createdAt ? ` · ${formatAdminDate(row.createdAt)}` : ""}
                    </p>
                  </div>

                  <AdminActionBar>
                    <AdminGhostBtn onClick={() => openView(row)}>
                      <Eye className="w-3.5 h-3.5" /> View
                    </AdminGhostBtn>
                    <AdminGhostBtn onClick={() => openEdit(row)}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </AdminGhostBtn>
                    <AdminGhostBtn
                      danger
                      disabled={busyId === row._id}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete scorer "${row.fullName}"? Past scorecards will still show their name.`
                          )
                        ) {
                          setBusyId(row._id);
                          adminDelete(
                            () => adminAPI.deleteScorer(row._id),
                            reload,
                            "Scorer deleted successfully."
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
        title="Edit scorer"
        onClose={() => !saving && setEditItem(null)}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setEditItem(null)} disabled={saving}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" form="admin-scorer-form" loading={saving} disabled={saving}>
              Save changes
            </AdminButton>
          </>
        }
      >
        <form id="admin-scorer-form" onSubmit={saveEdit} className="space-y-3">
          <AdminField label="Full name" required>
            <AdminInput
              value={editForm.fullName || ""}
              onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </AdminField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminField label="Phone" required>
              <AdminInput
                value={editForm.phone || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Email">
              <AdminInput
                type="email"
                value={editForm.email || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </AdminField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminField label="City">
              <AdminInput
                value={editForm.city || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Experience (years)">
              <AdminInput
                type="number"
                min={0}
                value={editForm.experience || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, experience: e.target.value }))}
              />
            </AdminField>
          </div>
          <AdminField label="Status">
            <AdminSelect
              value={editForm.status || "Active"}
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
            >
              {SCORER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Notes">
            <AdminInput
              value={editForm.notes || ""}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </AdminField>
        </form>
      </AdminFormModal>
    </div>
  );
}
