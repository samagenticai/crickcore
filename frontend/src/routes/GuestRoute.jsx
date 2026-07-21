import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPostLoginPath } from "../utils/roles";

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const stripeReturn = new URLSearchParams(location.search).has("session_id");

  if (loading && stripeReturn) {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // After Stripe payment, always show Login/Register (Pro UI) — even if a session cookie exists
  if (user && stripeReturn) {
    return children;
  }

  if (user) return <Navigate to={getPostLoginPath(user)} replace />;
  return children;
}
