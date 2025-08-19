import { Navigate, Outlet } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";

export function ProtectedRoute({ allowedRoles }) {
  const { userProfile, initialized } = useUserStore();

  if (!initialized) return null;

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
