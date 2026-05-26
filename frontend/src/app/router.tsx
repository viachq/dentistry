import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import Shell from "../components/Shell";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import PatientPage from "../pages/PatientPage";
import DoctorPublicPage from "../pages/DoctorPublicPage";
import TeamPage from "../pages/TeamPage";
import PricesPage from "../pages/PricesPage";
import LoadingBlock from "../components/LoadingBlock";

export function AppRouter() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingBlock />;

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/doctors/:id" element={<DoctorPublicPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/prices" element={<PricesPage />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/patient" replace /> : <LoginPage />}
        />
        <Route
          path="/patient"
          element={user && user.role === "patient" ? <PatientPage /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
