import { Navigate, Outlet } from "react-router";
import AuthCheck from "../hooks/Authcheck";

const ProtectedRoute = () => {
  const isAuthenticated = AuthCheck();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
