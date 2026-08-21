import { Navigate } from "react-router-dom";


function ProtectedRoute({
  children,
  allowedRoles,
}) {

  const token =
    localStorage.getItem("token");

  const user =
    JSON.parse(
      localStorage.getItem("user") || "null"
    );


  if (!token) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  // If no specific roles are provided,
  // any logged-in user can access it.
  if (
    !allowedRoles ||
    allowedRoles.length === 0
  ) {
    return children;
  }


  const userRole =
    user?.role?.toLowerCase();


  // Admin has access to everything.
  if (userRole === "admin") {
    return children;
  }


  if (!allowedRoles.includes(userRole)) {

    // Drivers have their own dashboard.
    if (userRole === "driver") {

      return (
        <Navigate
          to="/driver-dashboard"
          replace
        />
      );

    }


    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }


  return children;
}


export default ProtectedRoute;