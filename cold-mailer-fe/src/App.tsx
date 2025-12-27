import "./App.css";
import LoginPage from "./components/LoginPage";
import { Route, Routes, Navigate } from "react-router";
import SignupPage from "./components/SignupPage";
import DashboardPage from "./components/DashboardPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import OAuthCallback from "./components/OAuthCallback";
import AppLayout from "./components/layout/AppLayout";

function App() {
  return (
    <Routes>
      {/* Protected routes - add new protected routes here */}
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
