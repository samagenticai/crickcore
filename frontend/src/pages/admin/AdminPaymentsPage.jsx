import { useCallback } from "react";
import { adminAPI } from "../../api/admin";
import { useAdminList } from "../../hooks/useAdminList";
import {
  AdminTable,
  AdminPagination,
  AdminToolbar,
  AdminFilterSelect,
  AdminLoading,
  AdminPageIntro,
} from "../../components/admin/AdminUI";

const fmtMoney = (amount, currency = "usd") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format(Number(amount || 0) / 100);

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : null);

export default function AdminPaymentsPage() {
  const fetcher = useCallback((params) => adminAPI.getPayments(params), []);
  const { items, pagination, loading, page: _page, setPage, search, setSearch, extra, setExtra } =
    useAdminList(fetcher);

  const columns = [
    { key: "user", label: "User Name", render: (r) => r.userName },
    { key: "email", label: "Email", render: (r) => r.email },
    {
      key: "customer",
      label: "Stripe Customer ID",
      render: (r) => (
        <span className="font-mono text-[11px] break-all">{r.stripeCustomerId}</span>
      ),
    },
    {
      key: "pi",
      label: "Payment Intent ID",
      render: (r) => (
        <span className="font-mono text-[11px] break-all">{r.stripePaymentIntentId}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (r) => fmtMoney(r.amount, r.currency),
    },
    {
      key: "currency",
      label: "Currency",
      render: (r) => (r.currency ? String(r.currency).toUpperCase() : null),
    },
    { key: "plan", label: "Plan", render: (r) => r.plan },
    {
      key: "status",
      label: "Payment Status",
      render: (r) => (
        <span
          className={
            r.paymentStatus === "succeeded"
              ? "text-emerald-600 font-semibold"
              : r.paymentStatus === "failed"
                ? "text-rose-600 font-semibold"
                : r.paymentStatus === "refunded"
                  ? "text-slate-600 font-semibold"
                  : "text-amber-600 font-semibold"
          }
        >
          {r.paymentStatus}
        </span>
      ),
    },
    { key: "date", label: "Payment Date", render: (r) => fmtDate(r.paymentDate) },
    { key: "sub", label: "Subscription Status", render: (r) => r.subscriptionStatus },
    {
      key: "txn",
      label: "Transaction ID",
      render: (r) => (
        <span className="font-mono text-[11px] break-all">{r.transactionId}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4 min-w-0">
      <AdminPageIntro>Stripe payment activity across the platform</AdminPageIntro>
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Name, email, or transaction ID"
      >
        <AdminFilterSelect
          value={extra.status || "all"}
          onChange={(e) => setExtra((x) => ({ ...x, status: e.target.value }))}
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </AdminFilterSelect>
      </AdminToolbar>

      {loading ? (
        <AdminLoading />
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={items}
            empty="No payment history available."
            emptyDescription="No transactions match your search or filters."
          />
          <AdminPagination pagination={pagination} onPageChange={setPage} loading={loading} />
        </>
      )}
    </div>
  );
}
