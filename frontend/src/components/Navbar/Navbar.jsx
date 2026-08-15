import {
    useEffect,
    useRef,
    useState,
} from "react";

import "./Navbar.css";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import {
    FaBell,
    FaSearch,
    FaUserCircle,
    FaCog,
    FaSignOutAlt,
    FaUser,
    FaTruck,
    FaUserTie,
    FaBoxOpen,
    FaCheckCircle,
    FaTrash,
} from "react-icons/fa";

function Navbar() {
    const navigate = useNavigate();

    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    const [
        showNotifications,
        setShowNotifications,
    ] = useState(false);

    const [
        showProfile,
        setShowProfile,
    ] = useState(false);

    const [
        notifications,
        setNotifications,
    ] = useState([]);

    const [loading, setLoading] =
        useState(false);

    // ==========================================================
    // USER STATE
    // ==========================================================

    const [user, setUser] = useState(null);

    // ==========================================================
    // LOAD USER
    // ==========================================================

    const loadUser = async () => {
        try {
            const storedUser =
                localStorage.getItem("user");

            if (storedUser) {
                setUser(
                    JSON.parse(storedUser)
                );
            }

            // Always try to get the latest profile
            // when a token exists.

            const token =
                localStorage.getItem("token");

            if (!token) {
                return;
            }

            const response =
                await api.get("/auth/profile");

            if (response.data) {
                setUser(response.data);

                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        response.data
                    )
                );
            }
        } catch (error) {
            console.error(
                "Unable to load profile:",
                error
            );

            // If API profile request fails,
            // keep the cached user if available.
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    // ==========================================================
    // FETCH NOTIFICATIONS
    // ==========================================================

    const fetchNotifications = async () => {
        try {
            setLoading(true);

            const response =
                await api.get(
                    "/notifications/latest"
                );

            setNotifications(
                response.data
            );
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================================
    // INITIAL LOAD
    // ==========================================================

    useEffect(() => {
        fetchNotifications();

        const interval =
            setInterval(() => {
                fetchNotifications();
            }, 5000);

        return () =>
            clearInterval(interval);
    }, []);

    // ==========================================================
    // CLOSE DROPDOWNS
    // ==========================================================

    useEffect(() => {
        const handleClickOutside = (
            event
        ) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(
                    event.target
                )
            ) {
                setShowNotifications(false);
            }

            if (
                profileRef.current &&
                !profileRef.current.contains(
                    event.target
                )
            ) {
                setShowProfile(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    // ==========================================================
    // LOGOUT
    // ==========================================================

    const handleLogout = () => {
        const confirmLogout =
            window.confirm(
                "Are you sure you want to logout?"
            );

        if (!confirmLogout) return;

        localStorage.removeItem("token");
        localStorage.removeItem("token_type");
        localStorage.removeItem("user");
        localStorage.removeItem("user_email");

        navigate("/login", {
            replace: true,
        });
    };

    // ==========================================================
    // MARK NOTIFICATION READ
    // ==========================================================

    const markAsRead = async (id) => {
        try {
            await api.put(
                `/notifications/${id}/read`
            );

            fetchNotifications();
        } catch (error) {
            console.log(error);
        }
    };

    // ==========================================================
    // DELETE NOTIFICATION
    // ==========================================================

    const deleteNotification = async (
        id
    ) => {
        try {
            await api.delete(
                `/notifications/${id}`
            );

            fetchNotifications();
        } catch (error) {
            console.log(error);
        }
    };

    // ==========================================================
    // NOTIFICATION ICON
    // ==========================================================

    const getNotificationIcon = (
        title
    ) => {
        if (
            title?.includes("Driver")
        ) {
            return <FaUserTie />;
        }

        if (
            title?.includes("Vehicle")
        ) {
            return <FaTruck />;
        }

        if (
            title?.includes("Shipment")
        ) {
            return <FaBoxOpen />;
        }

        return <FaBell />;
    };

    // ==========================================================
    // UNREAD COUNT
    // ==========================================================

    const unreadCount =
        notifications.filter(
            (item) => !item.is_read
        ).length;

    // ==========================================================
    // USER DISPLAY
    // ==========================================================

    const displayName =
        user?.name ||
        user?.full_name ||
        user?.username ||
        localStorage.getItem(
            "user_email"
        ) ||
        "User";

    const displayRole =
        String(
            user?.role || "User"
        ).toLowerCase() === "admin"
            ? "Fleet Manager"
            : "User";

    // ==========================================================
    // JSX
    // ==========================================================

    return (
        <nav className="navbar">

            {/* Left */}

            <div className="navbar-left">
                <h2>FleetFlow</h2>
            </div>

            {/* Right */}

            <div className="navbar-right">

                {/* ========================= */}
                {/* Notifications */}
                {/* ========================= */}

                <div
                    className="notification"
                    ref={notificationRef}
                >
                    <div
                        className="notification-icon-wrapper"
                        onClick={() => {
                            setShowNotifications(
                                !showNotifications
                            );

                            setShowProfile(false);
                        }}
                    >
                        <FaBell />

                        {unreadCount > 0 && (
                            <span className="badge">
                                {unreadCount}
                            </span>
                        )}
                    </div>

                    {showNotifications && (
                        <div className="notification-dropdown">

                            <div className="dropdown-header">
                                <h4>
                                    Notifications
                                </h4>
                            </div>

                            {loading ? (
                                <div className="notification-empty">
                                    Loading...
                                </div>
                            ) : notifications.length ===
                              0 ? (
                                <div className="notification-empty">
                                    No Notifications
                                </div>
                            ) : (
                                notifications.map(
                                    (
                                        notification
                                    ) => (
                                        <div
                                            key={
                                                notification.id
                                            }
                                            className={`notification-item ${
                                                notification.is_read
                                                    ? "read"
                                                    : "unread"
                                            }`}
                                        >

                                            <div className="notification-item-icon">
                                                {getNotificationIcon(
                                                    notification.title
                                                )}
                                            </div>

                                            <div className="notification-item-content">

                                                <strong>
                                                    {
                                                        notification.title
                                                    }
                                                </strong>

                                                <p>
                                                    {
                                                        notification.message
                                                    }
                                                </p>

                                                <small>
                                                    {new Date(
                                                        notification.created_at
                                                    ).toLocaleString()}
                                                </small>

                                            </div>

                                            <div className="notification-buttons">

                                                {!notification.is_read && (
                                                    <button
                                                        className="read-btn"
                                                        onClick={() =>
                                                            markAsRead(
                                                                notification.id
                                                            )
                                                        }
                                                    >
                                                        <FaCheckCircle />
                                                    </button>
                                                )}

                                                <button
                                                    className="delete-btn"
                                                    onClick={() =>
                                                        deleteNotification(
                                                            notification.id
                                                        )
                                                    }
                                                >
                                                    <FaTrash />
                                                </button>

                                            </div>

                                        </div>
                                    )
                                )
                            )}

                            <button
                                className="view-btn"
                                onClick={() => {
                                    setShowNotifications(
                                        false
                                    );

                                    navigate(
                                        "/notifications"
                                    );
                                }}
                            >
                                View All Notifications
                            </button>

                        </div>
                    )}
                </div>

                {/* ========================= */}
                {/* Profile */}
                {/* ========================= */}

                <div
                    className="profile"
                    ref={profileRef}
                >
                    <div
                        className="profile-info2"
                        onClick={() => {
                            setShowProfile(
                                !showProfile
                            );

                            setShowNotifications(
                                false
                            );
                        }}
                    >

                        <FaUserCircle className="profile-icon" />

                        <div className="profile-details2">

                            <h4>
                                {displayName}
                            </h4>

                            <span>
                                {displayRole}
                            </span>

                        </div>

                    </div>

                    {showProfile && (
                        <div className="profile-dropdown">

                            <div
                                className="profile-item"
                                onClick={() => {
                                    navigate(
                                        "/profile"
                                    );

                                    setShowProfile(
                                        false
                                    );
                                }}
                            >
                                <FaUser />

                                <span>
                                    My Profile
                                </span>
                            </div>

                            {/* Settings only for Admin */}

                            {String(
                                user?.role || ""
                            ).toLowerCase() ===
                                "admin" && (
                                <div
                                    className="profile-item"
                                    onClick={() => {
                                        navigate(
                                            "/settings"
                                        );

                                        setShowProfile(
                                            false
                                        );
                                    }}
                                >
                                    <FaCog />

                                    <span>
                                        Settings
                                    </span>
                                </div>
                            )}

                            <div
                                className="profile-item logout"
                                onClick={
                                    handleLogout
                                }
                            >
                                <FaSignOutAlt />

                                <span>
                                    Logout
                                </span>
                            </div>

                        </div>
                    )}
                </div>

            </div>
        </nav>
    );
}

export default Navbar;