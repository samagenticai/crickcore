import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { authAPI } from "../api/auth";
import { isProMember } from "../utils/subscription";
import { SESSION_FORCE_LOGOUT_KEY, SESSION_LAST_ACTIVITY_KEY } from "../constants/session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data);
      return data.data;
    } catch (error) {
      setUser(null);
      if (!error?.status || error.status === 404 || error.status === 0) {
        toast.error(error?.message || "Unable to reach the server. Please try again.");
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    setUser(data.data);
    try {
      localStorage.removeItem(SESSION_FORCE_LOGOUT_KEY);
      localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    return data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      setUser(null);
    }
  };

  /** Re-fetch /auth/me so subscription badges update after Stripe checkout. */
  const refreshSubscription = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data);
      return data.data;
    } catch {
      return null;
    }
  }, []);

  const isPro = useMemo(() => isProMember(user), [user]);

  /** Merge fields into the logged-in user (e.g. after avatar upload). */
  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      if (partial?.avatar !== undefined && partial.profilePicture === undefined) {
        next.profilePicture = partial.avatar;
      }
      if (partial?.profilePicture !== undefined && partial.avatar === undefined) {
        next.avatar = partial.profilePicture;
      }
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        checkAuth,
        setUser,
        updateUser,
        refreshSubscription,
        isPro,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
