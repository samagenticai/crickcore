import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function PaymentCancelPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/#pricing", { replace: true }), 2500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen min-w-0 overflow-x-clip bg-surface">
      <Navbar />
      <main className="pt-24 pb-16 section-container max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
            <XCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-secondary">Payment canceled</h1>
          <p className="mt-2 text-sm text-text-muted">
            No charge was made and no Pro account was created. Returning you to Pricing…
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/#pricing"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Back to Pricing
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-secondary"
            >
              Continue with Free plan
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
