import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import AdminShell from "../components/AdminShell";
import LoginPage from "../pages/LoginPage";
import AdminPage from "../pages/AdminPage";
import DoctorPage from "../pages/DoctorPage";
import DoctorIncomePage from "../pages/DoctorIncomePage";
import DoctorProfilePage from "../pages/DoctorProfilePage";
import DoctorReviewsPage from "../pages/DoctorReviewsPage";
import LoadingBlock from "../components/LoadingBlock";

export function AppRouter() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingBlock />;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AdminShell />}>
        {user.role === "admin" && (
          <Route path="/" element={<AdminPage />} />
        )}
        {user.role === "doctor" && (
          <>
            <Route path="/" element={<DoctorPage />} />
            <Route path="/income" element={<DoctorIncomePage />} />
            <Route path="/profile" element={<DoctorProfilePage />} />
            <Route path="/reviews" element={<DoctorReviewsPage />} />
          </>
        )}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
