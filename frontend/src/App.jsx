import {
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Drivers from "./pages/Drivers";
import Vehicles from "./pages/Vehicles";
import Shipments from "./pages/Shipments";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Trips from "./pages/Trips";
import MainLayout from "./layout/MainLayout";
import MapPage from "./pages/MapPage";


// ==========================================================
// GET CURRENT USER
// ==========================================================

function getCurrentUser() {

    try {

        const storedUser =
            sessionStorage.getItem("user");

        if (!storedUser) {
            return null;
        }

        return JSON.parse(storedUser);

    } catch (error) {

        console.error(
            "Unable to parse stored user:",
            error
        );

        return null;
    }
}


// ==========================================================
// CLEAR AUTHENTICATION
// ==========================================================

function clearAuthentication() {

    sessionStorage.removeItem("token");

    sessionStorage.removeItem("token_type");

    sessionStorage.removeItem("user");

    sessionStorage.removeItem("user_email");
}


// ==========================================================
// PROTECTED ROUTE
// ==========================================================

function ProtectedRoute({
    children,
}) {

    const token =
        sessionStorage.getItem("token");

    const user =
        getCurrentUser();


    // ======================================================
    // NO TOKEN
    // ======================================================

    if (!token) {

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }


    // ======================================================
    // TOKEN BUT NO USER
    // ======================================================

    if (!user) {

        clearAuthentication();

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }


    return children;
}


// ==========================================================
// ROLE PROTECTED ROUTE
// ==========================================================

function RoleRoute({
    children,
    allowedRoles,
}) {

    const token =
        sessionStorage.getItem("token");

    const user =
        getCurrentUser();


    // ======================================================
    // NOT AUTHENTICATED
    // ======================================================

    if (!token || !user) {

        clearAuthentication();

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }


    // ======================================================
    // USER ROLE
    // ======================================================

    const userRole =
        String(
            user?.role || "User"
        )
            .trim()
            .toLowerCase();


    // ======================================================
    // ROLE NOT ALLOWED
    // ======================================================

    if (
        !allowedRoles.includes(userRole)
    ) {

        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }


    return children;
}


// ==========================================================
// APP
// ==========================================================

function App() {

    return (

        <Routes>

            {/* ==================================================
                LOGIN
            ================================================== */}

            <Route
                path="/login"
                element={
                    <Login />
                }
            />


            {/* ==================================================
                DEFAULT
            ================================================== */}

            <Route
                path="/"
                element={
                    <Navigate
                        to="/dashboard"
                        replace
                    />
                }
            />


            {/* ==================================================
                PROTECTED APPLICATION
            ================================================== */}

            <Route
                element={

                    <ProtectedRoute>

                        <MainLayout />

                    </ProtectedRoute>

                }
            >

                {/* ==================================================
                    AUTHENTICATED USERS
                ================================================== */}

                <Route
                    path="/dashboard"
                    element={
                        <Dashboard />
                    }
                />

                <Route
                    path="/shipments"
                    element={
                        <Shipments />
                    }
                />

                <Route
                    path="/trips"
                    element={
                        <Trips />
                    }
                />

                <Route
                    path="/map"
                    element={
                        <MapPage />
                    }
                />

                <Route
                    path="/notifications"
                    element={
                        <Notifications />
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <Profile />
                    }
                />


                {/* ==================================================
                    ADMIN ONLY
                ================================================== */}

                <Route
                    path="/drivers"
                    element={

                        <RoleRoute
                            allowedRoles={[
                                "admin",
                            ]}
                        >

                            <Drivers />

                        </RoleRoute>

                    }
                />

                <Route
                    path="/vehicles"
                    element={

                        <RoleRoute
                            allowedRoles={[
                                "admin",
                            ]}
                        >

                            <Vehicles />

                        </RoleRoute>

                    }
                />

                <Route
                    path="/settings"
                    element={

                        <RoleRoute
                            allowedRoles={[
                                "admin",
                            ]}
                        >

                            <Settings />

                        </RoleRoute>

                    }
                />

            </Route>


            {/* ==================================================
                INVALID URL
            ================================================== */}

            <Route
                path="*"
                element={
                    <Navigate
                        to="/login"
                        replace
                    />
                }
            />

        </Routes>
    );
}


export default App;