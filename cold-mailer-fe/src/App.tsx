import "./App.css";
import LoginPage from "./components/LoginPage";
import { Route, Routes } from "react-router";
import SignupPage from "./components/SignupPage";
import DashboardPage from "./components/DeshboardPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
