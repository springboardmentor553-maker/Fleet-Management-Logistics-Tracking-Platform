import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Returns the default landing page path for a given role.
 * Used when a user tries to access a page they are not allowed to see.
 */
const getDefaultPathForRole = (role) => {
  if (role === "Admin" || role === "Fleet Manager") return "/dashboard";
  if (role === "Dispatcher") return "/shipments";
  if (role === "Driver") return "/vehicles";
  return "/vehicles"; // safe fallback for any unknown role
};

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the highest-access page the user's role can see
    const fallback = getDefaultPathForRole(user.role);
    return <Navigate to={fallback} replace />;
  }

  // Outlet renders child routes if nested
  return <Outlet />;
};

export default ProtectedRoute;
