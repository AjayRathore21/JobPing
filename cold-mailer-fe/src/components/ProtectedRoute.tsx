import React from "react";
import { Navigate } from "react-router";
import { selectUser, useUserStore } from "../store/userStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = (props: ProtectedRouteProps) => {
  const { children } = props;
  const user = useUserStore(selectUser);
  console.log("ProtectedRoute - user:", user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
