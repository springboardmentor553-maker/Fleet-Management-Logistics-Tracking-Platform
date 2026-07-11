import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, account } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base text-ink-muted font-data text-sm tracking-board uppercase">
        Loading console…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(account.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
