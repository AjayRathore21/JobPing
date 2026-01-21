import "./App.css";
import LoginPage from "./components/LoginPage";
import { Route, Routes, Navigate } from "react-router";
import SignupPage from "./components/SignupPage";
import DashboardPage from "./components/DashboardPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import OAuthCallback from "./components/OAuthCallback";
import AppLayout from "./components/layout/AppLayout";
import { useEffect } from "react";
import axios from "./configs/axiosConfig";
import { useUserStore } from "./store/userStore";

function App() {
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await axios.get("/auth/me");
          if (response.data?.user) {
            setUser(response.data.user);
          }
        } catch (error) {
          console.error("Session validation failed:", error);
          // Only clear if it's an auth error (401/403)
          localStorage.removeItem("token");
          clearUser();
        }
      }
    };

    validateSession();
  }, [setUser, clearUser]);

  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>

      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
    </Routes>
  );
}

export default App;
