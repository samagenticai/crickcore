import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import OrganizerRoute from "./routes/OrganizerRoute";
import AdminRoute from "./routes/AdminRoute";
import GuestRoute from "./routes/GuestRoute";
import RoleSelectionModal from "./components/RoleSelectionModal";
import CheckoutResume from "./components/CheckoutResume";

const PageLoader = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const DashboardLayout = lazy(() => import("./components/dashboard/DashboardLayout"));
const DashboardHome = lazy(() => import("./pages/dashboard/DashboardHome"));
const TournamentsPage = lazy(() => import("./pages/dashboard/TournamentsPage"));
const ProfilePage = lazy(() => import("./pages/dashboard/ProfilePage"));
const FixturesPage = lazy(() => import("./pages/dashboard/FixturesPage"));
const VenuesPage = lazy(() => import("./pages/dashboard/VenuesPage"));
const UmpiresPage = lazy(() => import("./pages/dashboard/UmpiresPage"));
const ScorersPage = lazy(() => import("./pages/dashboard/ScorersPage"));
const SponsorsPage = lazy(() => import("./pages/dashboard/SponsorsPage"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const NotificationsPage = lazy(() => import("./pages/dashboard/NotificationsPage"));
const TeamsPage = lazy(() => import("./pages/dashboard/TeamsPage"));
const PlayersPage = lazy(() => import("./pages/dashboard/PlayersPage"));
const MatchesPage = lazy(() => import("./pages/dashboard/MatchesPage"));
const LiveScoringPage = lazy(() => import("./pages/dashboard/LiveScoringPage"));
const PointsTablePage = lazy(() => import("./pages/dashboard/PointsTablePage"));
const PublicViewerPage = lazy(() => import("./pages/PublicViewerPage"));
const PublicTournamentDetailsPage = lazy(() => import("./pages/PublicTournamentDetailsPage"));
const PublicPointsTablePage = lazy(() => import("./pages/PublicPointsTablePage"));
const PublicMatchDetailsPage = lazy(() => import("./pages/PublicMatchDetailsPage"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage"));
const PaymentCancelPage = lazy(() => import("./pages/PaymentCancelPage"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminTournamentsPage = lazy(() => import("./pages/admin/AdminTournamentsPage"));
const AdminTeamsPage = lazy(() => import("./pages/admin/AdminTeamsPage"));
const AdminPlayersPage = lazy(() => import("./pages/admin/AdminPlayersPage"));
const AdminMatchesPage = lazy(() => import("./pages/admin/AdminMatchesPage"));
const AdminVenuesPage = lazy(() =>
  import("./pages/admin/AdminResourcePages").then((m) => ({ default: m.AdminVenuesPage }))
);
const AdminUmpiresPage = lazy(() =>
  import("./pages/admin/AdminResourcePages").then((m) => ({ default: m.AdminUmpiresPage }))
);
const AdminScorersPage = lazy(() => import("./pages/admin/AdminScorersPage"));
const AdminSponsorsPage = lazy(() => import("./pages/admin/AdminSponsorsPage"));
const AdminPaymentsPage = lazy(() => import("./pages/admin/AdminPaymentsPage"));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));
const AdminProfilePage = lazy(() => import("./pages/admin/AdminProfilePage"));

function Lazy({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RoleSelectionModal />
        <CheckoutResume />
        <Lazy>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/free-trial" element={<Navigate to="/#pricing" replace />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/cancel" element={<PaymentCancelPage />} />
            <Route path="/viewer" element={<PublicViewerPage />} />
            <Route path="/viewer/:tournamentId/match/:matchId" element={<PublicMatchDetailsPage />} />
            <Route path="/viewer/:id/points" element={<PublicPointsTablePage />} />
            <Route path="/viewer/:id" element={<PublicTournamentDetailsPage />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/public" element={<Navigate to="/viewer" replace />} />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="tournaments" element={<AdminTournamentsPage />} />
              <Route path="teams" element={<AdminTeamsPage />} />
              <Route path="players" element={<AdminPlayersPage />} />
              <Route path="matches" element={<AdminMatchesPage />} />
              <Route path="venues" element={<AdminVenuesPage />} />
              <Route path="umpires" element={<AdminUmpiresPage />} />
              <Route path="scorers" element={<AdminScorersPage />} />
              <Route path="sponsors" element={<AdminSponsorsPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="profile" element={<AdminProfilePage />} />
            </Route>

            <Route
              path="/dashboard"
              element={
                <OrganizerRoute>
                  <DashboardLayout />
                </OrganizerRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="tournaments" element={<TournamentsPage />} />
              <Route path="teams" element={<TeamsPage />} />
              <Route path="players" element={<PlayersPage />} />
              <Route path="matches" element={<MatchesPage />} />
              <Route path="live-scoring" element={<LiveScoringPage />} />
              <Route path="fixtures" element={<FixturesPage />} />
              <Route path="points-table" element={<PointsTablePage />} />
              <Route path="public" element={<Navigate to="/viewer" replace />} />
              <Route path="venues" element={<VenuesPage />} />
              <Route path="umpires" element={<UmpiresPage />} />
              <Route path="scorers" element={<ScorersPage />} />
              <Route path="sponsors" element={<SponsorsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Lazy>
        <Toaster position="top-center" richColors closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}
