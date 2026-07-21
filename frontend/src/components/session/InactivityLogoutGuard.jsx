import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import useInactivityLogout from "../../hooks/useInactivityLogout";
import { SESSION_EXPIRED_MESSAGE } from "../../constants/session";

/**
 * Mount inside Organizer / Admin dashboard layouts only.
 * Logs out after 15 minutes of inactivity and redirects to login.
 */
export default function InactivityLogoutGuard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleInactivityLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      /* cookie may already be cleared */
    }
    navigate("/login", {
      replace: true,
      state: {
        sessionExpired: true,
        message: SESSION_EXPIRED_MESSAGE,
      },
    });
  }, [logout, navigate]);

  useInactivityLogout({
    enabled: Boolean(user),
    onLogout: handleInactivityLogout,
  });

  return null;
}
