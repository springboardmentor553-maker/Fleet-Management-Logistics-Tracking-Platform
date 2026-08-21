import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {

    const location = useLocation();

    const token = localStorage.getItem("token");

    const role = (
        localStorage.getItem("role") || ""
    )
        .toLowerCase()
        .trim();


    console.log("========== PROTECTED ROUTE ==========");
    console.log("Path:", location.pathname);
    console.log("Token exists:", !!token);
    console.log("Role:", role);
    console.log("=====================================");


    // ==========================================
    // NOT LOGGED IN
    // ==========================================

    if (!token) {

        return (
            <Navigate
                to="/"
                replace
                state={{
                    from: location.pathname
                }}
            />
        );
    }


    // ==========================================
    // VALID ROLES
    // ==========================================

    const validRoles = [
        "admin",
        "manager",
        "user",
        "driver"
    ];


    // ==========================================
    // INVALID ROLE
    // ==========================================

    if (!validRoles.includes(role)) {

        console.log(
            "Invalid role:",
            role
        );

        return (
            <Navigate
                to="/"
                replace
            />
        );
    }


    // ==========================================
    // AUTHENTICATED
    // ==========================================

    return children;
}

export default ProtectedRoute;