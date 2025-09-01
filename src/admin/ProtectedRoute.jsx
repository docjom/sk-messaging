import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, userProfile, allowedRoles }) {
  if (!allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/admin/home" replace />;
  }
  return children;
}

export default ProtectedRoute;
