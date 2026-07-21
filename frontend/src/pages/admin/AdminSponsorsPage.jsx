import { useCallback, useState } from "react";
import { Handshake, Eye, Pencil, Trash2, Phone, Mail, User, Building2 } from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "../../api/admin";
import { useAdminList, adminDelete } from "../../hooks/useAdminList";
import { SPONSOR_STATUSES, SPONSOR_TYPES } from "../../constants/sponsors";
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

export default function AdminSponsorsPage() {
  const fetcher = useCallback((params) => adminAPI.getSponsors(params), []);
  const { items, pagination, loading, page: _page, setPage, search, setSearch, extra, setExtra, reload } =
    useAdminList(fetcher);

  const [busyId, setBusyId] = useState(null);
  const [viewRows, setViewRows] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const openView = (row) => {
    setViewRows({
      title: row.sponsorName,
      rows: [
        { label: "Organizer", value: row.organizerName || row.organizerId?.fullName },
        { label: "Company", value: row.companyName },
        { label: "Type", value: row.sponsorType },
        { label: "Contact", value: row.contactPerson },
        { label: "Phone", value: row.phone },
        { label: "Email", value: row.email },
        { label: "Website", value: row.website },
        { label: "Status", value: row.status },
        { label: "Tournaments", value: String(row.assignedTournaments ?? 0) },
        { label: "Notes", value: row.notes },
        { label: "Created", value: row.createdAt ? formatAdminDate(row.createdAt) : null },
      ],
    });
  };

  const openEdit = (row) => {
    setEditItem(row);
    setEditForm({
      sponsorName: row.sponsorName || "",
      companyName: row.companyName || "",
      sponsorType: row.sponsorType || "Other",
      contactPerson: row.contactPerson || "",
      phone: row.phone || "",
      email: row.email || "",
      website: row.website || "",
      address: row.address || "",
      sponsorshipAmount: row.sponsorshipAmount != null ? String(row.sponsorshipAmount) : "",
      status: row.status || "Active",
      notes: row.notes || "",
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    if (!editForm.sponsorName?.trim()) {
      toast.error("Sponsor name is required");
      return;
    }

    setSaving(true);
    try {
      await adminAPI.updateSponsor(editItem._id, {
        sponsorName: editForm.sponsorName.trim(),
        companyName: editForm.companyName.trim(),
        sponsorType: editForm.sponsorType,
        contactPerson: editForm.contactPerson.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        website: editForm.website.trim(),
        address: editForm.address.trim(),
        sponsorshipAmount:
          editForm.sponsorshipAmount === "" ? "" : Number(editForm.sponsorshipAmount),
        status: editForm.status,
        notes: editForm.notes.trim(),
      });
      toast.success("Sponsor updated successfully.");
      setEditItem(null);
      reload();
    } catch (err) {
      toast.error(err.message || "Failed to update sponsor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 min-w-0">
      <AdminPageIntro>
        Manage sponsors across all organizers. Deleting a sponsor removes it from assigned tournaments.
      </AdminPageIntro>

      <AdminToolbar search={search} onSearch={setSearch} placeholder="Search sponsors…">
        <AdminFilterSelect
          value={extra.status || "all"}
          onChange={(e) => setExtra((x) => ({ ...x, status: e.target.value }))}
        >
          <option value="all">All statuses</option>
          {SPONSOR_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </AdminFilterSelect>
        <AdminFilterSelect
          value={extra.sponsorType || "all"}
          onChange={(e) => setExtra((x) => ({ ...x, sponsorType: e.target.value }))}
        >
          <option value="all">All types</option>
          {SPONSOR_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </AdminFilterSelect>
      </AdminToolbar>

      {loading ? (
        <AdminSkeletonGrid count={6} />
      ) : !items.length ? (
        <AdminEmptyState
          icon={Handshake}
          title="No sponsors available."
          description="No sponsor records match your filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {items.map((row) => {
              const logo = mediaUrl(row.logo);
              return (
                <article
                  key={row._id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md min-w-0 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                      {logo ? (
                        <img src={logo} alt="" className="w-full h-full object-contain bg-white p-1" />
                      ) : (
                        <span className="text-xs font-bold text-slate-500">
                          {initials(row.sponsorName)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 truncate">
                        {adminDisplay(row.sponsorName)}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <AdminStatusBadge status={row.status} />
                        {row.sponsorType && (
                          <span className="text-[11px] font-semibold text-slate-500">
                            {row.sponsorType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-slate-500 min-w-0">
                    <p className="flex items-center gap-2 truncate">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      {adminDisplay(row.organizerName || row.organizerId?.fullName)}
                    </p>
                    {row.companyName && (
                      <p className="flex items-center gap-2 truncate">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        {row.companyName}
                      </p>
                    )}
                    {row.phone && (
                      <p className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {row.phone}
                      </p>
                    )}
                    {row.email && (
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        {row.email}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 pt-0.5">
                      Tournaments: {row.assignedTournaments ?? 0}
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
                            `Delete sponsor "${row.sponsorName}"? It will be removed from assigned tournaments.`
                          )
                        ) {
                          setBusyId(row._id);
                          adminDelete(
                            () => adminAPI.deleteSponsor(row._id),
                            reload,
                            "Sponsor deleted successfully."
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
        title="Edit sponsor"
        onClose={() => !saving && setEditItem(null)}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setEditItem(null)} disabled={saving}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" form="admin-sponsor-form" loading={saving} disabled={saving}>
              Save changes
            </AdminButton>
          </>
        }
      >
        <form id="admin-sponsor-form" onSubmit={saveEdit} className="space-y-3">
          <AdminField label="Sponsor name">
            <AdminInput
              value={editForm.sponsorName || ""}
              onChange={(e) => setEditForm((f) => ({ ...f, sponsorName: e.target.value }))}
            />
          </AdminField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminField label="Company">
              <AdminInput
                value={editForm.companyName || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Type">
              <AdminSelect
                value={editForm.sponsorType || "Other"}
                onChange={(e) => setEditForm((f) => ({ ...f, sponsorType: e.target.value }))}
              >
                {SPONSOR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminField label="Phone">
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
          <AdminField label="Website">
            <AdminInput
              value={editForm.website || ""}
              onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))}
            />
          </AdminField>
          <AdminField label="Status">
            <AdminSelect
              value={editForm.status || "Active"}
              onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
            >
              {SPONSOR_STATUSES.map((s) => (
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
