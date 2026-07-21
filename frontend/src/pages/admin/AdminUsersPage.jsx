import { useCallback, useState } from "react";
import { toast } from "sonner";
import { adminAPI } from "../../api/admin";
import { useAdminList, adminDelete } from "../../hooks/useAdminList";
import {
  AdminTable,
  AdminPagination,
  AdminToolbar,
  AdminFilterSelect,
  AdminLoading,
  AdminDetailsModal,
  AdminPageIntro,
  formatAdminDateTime,
} from "../../components/admin/AdminUI";

export default function AdminUsersPage() {
  const fetcher = useCallback((params) => adminAPI.getUsers(params), []);
  const { items, pagination, loading, page: _page, setPage, search, setSearch, extra, setExtra, reload } =
    useAdminList(fetcher);
  const [busyId, setBusyId] = useState(null);
  const [details, setDetails] = useState(null);

  const toggleActive = async (user) => {
    setBusyId(user._id);
    try {
      await adminAPI.updateUser(user._id, { isActive: !user.isActive });
      toast.success(user.isActive ? "User deactivated successfully." : "User activated successfully.");
      await reload();
    } catch (err) {
      toast.error(err.message || "Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  const viewDetails = async (user) => {
    setBusyId(user._id);
    try {
      const { data } = await adminAPI.getUser(user._id);
      const u = data.data;
      setDetails({
        title: u.fullName || "User details",
        rows: [
          { label: "Full name", value: u.fullName },
          { label: "Email", value: u.email },
          { label: "Phone", value: u.phone },
          { label: "Role", value: u.role },
          { label: "Status", value: u.isActive ? "Active" : "Inactive" },
          { label: "Plan", value: u.subscriptionPlan },
          { label: "Subscription", value: u.subscriptionStatus },
          { label: "City", value: u.city },
          { label: "Country", value: u.country },
          { label: "Joined", value: u.createdAt ? formatAdminDateTime(u.createdAt) : null },
          {
            label: "Last login",
            value: u.lastLoginAt ? formatAdminDateTime(u.lastLoginAt) : null,
          },
        ],
      });
    } catch (err) {
      toast.error(err.message || "Failed to load user details.");
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    { key: "name", label: "Name", render: (r) => r.fullName },
    { key: "email", label: "Email", render: (r) => r.email },
    { key: "role", label: "Role", render: (r) => r.role },
    { key: "plan", label: "Plan", render: (r) => r.subscriptionPlan },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span className={r.isActive ? "text-emerald-600 font-semibold" : "text-slate-500"}>
          {r.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex flex-wrap gap-2 justify-end md:justify-start">
          <button
            type="button"
            disabled={busyId === r._id}
            onClick={() => viewDetails(r)}
            className="text-xs font-bold text-slate-700 hover:underline disabled:opacity-50"
          >
            Details
          </button>
          <button
            type="button"
            disabled={busyId === r._id}
            onClick={() => toggleActive(r)}
            className="text-xs font-bold text-slate-700 hover:underline disabled:opacity-50"
          >
            {r.isActive ? "Deactivate" : "Activate"}
          </button>
          {r.role !== "admin" && (
            <button
              type="button"
              disabled={busyId === r._id}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete ${r.fullName} and all related tournaments, teams, and players?`
                  )
                ) {
                  setBusyId(r._id);
                  adminDelete(
                    () => adminAPI.deleteUser(r._id),
                    reload,
                    "User deleted successfully."
                  ).finally(() => setBusyId(null));
                }
              }}
              className="text-xs font-bold text-rose-600 hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 min-w-0">
      <AdminPageIntro>Manage every account on the platform</AdminPageIntro>
      <AdminToolbar search={search} onSearch={setSearch} placeholder="Search name, email, phone…">
        <AdminFilterSelect
          value={extra.role || "all"}
          onChange={(e) => setExtra((x) => ({ ...x, role: e.target.value }))}
        >
          <option value="all">All roles</option>
          <option value="organizer">Organizer</option>
          <option value="scorer">Scorer</option>
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </AdminFilterSelect>
        <AdminFilterSelect
          value={extra.status || "all"}
          onChange={(e) => setExtra((x) => ({ ...x, status: e.target.value }))}
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </AdminFilterSelect>
      </AdminToolbar>

      {loading ? (
        <AdminLoading />
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={items}
            empty="No data available"
            emptyDescription="No users match your search or filters."
          />
          <AdminPagination pagination={pagination} onPageChange={setPage} loading={loading} />
        </>
      )}

      <AdminDetailsModal
        open={!!details}
        title={details?.title}
        rows={details?.rows || []}
        onClose={() => setDetails(null)}
      />
    </div>
  );
}
