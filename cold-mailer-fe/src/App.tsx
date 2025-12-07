import "./App.css";
import LoginPage from "./components/LoginPage";
import { Route, Routes } from "react-router";
import SignupPage from "./components/SignupPage";
import DashboardPage from "./components/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Protected routes - add new protected routes here */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* Add more protected routes here, e.g.: */}
        {/* <Route path="/settings" element={<SettingsPage />} /> */}
      </Route>

      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}

export default App;
