import { Navigate, useLocation } from "react-router-dom";

function AdminProtectedRoute({ children }) {

    const location = useLocation();

    const token = localStorage.getItem("token");

    const role = (
        localStorage.getItem("role") || ""
    )
        .toLowerCase()
        .trim();


    // ==========================================
    // NOT LOGGED IN
    // ==========================================

    if (!token) {

        console.log(
            "AdminProtectedRoute: No token"
        );

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
    // NOT ADMIN
    // ==========================================

    if (role !== "admin") {

        console.log(
            "AdminProtectedRoute: Not admin",
            role
        );

        return (
            <Navigate
                to="/home"
                replace
            />
        );
    }


    // ==========================================
    // ADMIN
    // ==========================================

    return children;
}

export default AdminProtectedRoute;