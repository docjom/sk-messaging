import { Navigate, Outlet } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";

export function AdminRoute() {
  const { userProfile, initialized } = useUserStore();
  if (!initialized) return null;

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  if (userProfile.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
