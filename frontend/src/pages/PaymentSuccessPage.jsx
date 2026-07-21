import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/** Legacy route — all checkout success URLs point to /login directly. */
export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionId) {
      navigate(`/login?session_id=${encodeURIComponent(sessionId)}&plan=pro`, { replace: true });
    } else {
      navigate("/#pricing", { replace: true });
    }
  }, [sessionId, navigate]);

  return null;
}
