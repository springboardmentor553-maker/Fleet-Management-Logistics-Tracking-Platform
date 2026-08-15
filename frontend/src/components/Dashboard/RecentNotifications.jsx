import { useEffect, useState } from "react";
import api from "../../services/api";
import "./RecentNotifications.css";

function RecentNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchNotifications = async () => {
        try {
            setError("");

            const response = await api.get("/notifications/latest");

            let notificationData = [];

            if (Array.isArray(response.data)) {
                notificationData = response.data;
            } else if (
                Array.isArray(response.data?.notifications)
            ) {
                notificationData = response.data.notifications;
            } else if (
                Array.isArray(response.data?.data)
            ) {
                notificationData = response.data.data;
            }

            const latestNotifications = notificationData
                .filter(
                    (notification) =>
                        notification &&
                        notification.created_at
                )
                .sort((a, b) => {
                    return (
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    );
                })
                .slice(0, 5);

            setNotifications(latestNotifications);
        } catch (error) {
            console.error(
                "Failed to fetch dashboard notifications:",
                error
            );

            setError("Unable to load notifications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const getRelativeTime = (createdAt) => {
        if (!createdAt) {
            return "Unknown";
        }

        const date = new Date(createdAt);

        if (Number.isNaN(date.getTime())) {
            return "Unknown";
        }

        const now = new Date();

        const difference =
            now.getTime() - date.getTime();

        if (difference < 0) {
            return "Just now";
        }

        const seconds = Math.floor(
            difference / 1000
        );

        if (seconds < 10) {
            return "Just now";
        }

        if (seconds < 60) {
            return `${seconds} sec ago`;
        }

        const minutes = Math.floor(
            seconds / 60
        );

        if (minutes === 1) {
            return "1 min ago";
        }

        if (minutes < 60) {
            return `${minutes} min ago`;
        }

        const hours = Math.floor(
            minutes / 60
        );

        if (hours === 1) {
            return "1 hour ago";
        }

        if (hours < 24) {
            return `${hours} hours ago`;
        }

        const days = Math.floor(
            hours / 24
        );

        if (days === 1) {
            return "Yesterday";
        }

        if (days < 7) {
            return `${days} days ago`;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const getExactTime = (createdAt) => {
        if (!createdAt) {
            return "";
        }

        const date = new Date(createdAt);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            }
        );
    };

    const getNotificationType = (type) => {
        switch (
            (type || "").toLowerCase()
        ) {
            case "success":
                return "success";

            case "warning":
                return "warning";

            case "error":
            case "danger":
                return "error";

            case "info":
                return "info";

            default:
                return "default";
        }
    };

    const getNotificationIcon = (type) => {
        switch (
            (type || "").toLowerCase()
        ) {
            case "success":
                return "✓";

            case "warning":
                return "!";

            case "error":
            case "danger":
                return "×";

            case "info":
                return "i";

            default:
                return "•";
        }
    };

    return (
        <section className="recent-notifications-card">

            {/* HEADER */}
            <div className="recent-notifications-header">

                <div className="recent-notifications-heading">

                    <div className="recent-notifications-bell">
                        🔔
                    </div>

                    <div>
                        <h2>
                            Latest Notifications
                        </h2>

                        <p>
                            Recent system activity
                        </p>
                    </div>

                </div>

                <button
                    type="button"
                    className="recent-notifications-refresh"
                    onClick={fetchNotifications}
                    title="Refresh notifications"
                    aria-label="Refresh notifications"
                >
                    ↻
                </button>

            </div>

            {/* CONTENT */}
            <div className="recent-notifications-content">

                {loading && (
                    <div className="recent-notifications-state">

                        <div className="notification-spinner"></div>

                        <span>
                            Loading notifications...
                        </span>

                    </div>
                )}

                {!loading && error && (
                    <div className="recent-notifications-state error-state">

                        <div className="notification-error-icon">
                            !
                        </div>

                        <span>
                            {error}
                        </span>

                        <button
                            type="button"
                            onClick={fetchNotifications}
                        >
                            Retry
                        </button>

                    </div>
                )}

                {!loading &&
                    !error &&
                    notifications.length === 0 && (
                        <div className="recent-notifications-state">

                            <div className="notification-empty-icon">
                                🔔
                            </div>

                            <strong>
                                No notifications yet
                            </strong>

                            <span>
                                New system activity will
                                appear here.
                            </span>

                        </div>
                    )}

                {!loading &&
                    !error &&
                    notifications.length > 0 && (
                        <div className="recent-notifications-list">

                            {notifications.map(
                                (notification) => {
                                    const type =
                                        getNotificationType(
                                            notification.type
                                        );

                                    return (
                                        <article
                                            className={`recent-notification-item ${type} ${
                                                notification.is_read
                                                    ? "read"
                                                    : "unread"
                                            }`}
                                            key={
                                                notification.id
                                            }
                                        >

                                            {/* ICON */}
                                            <div
                                                className={`recent-notification-icon ${type}`}
                                            >
                                                {getNotificationIcon(
                                                    notification.type
                                                )}
                                            </div>

                                            {/* CONTENT */}
                                            <div className="recent-notification-main">

                                                <div className="recent-notification-title-row">

                                                    <h3>
                                                        {notification.title ||
                                                            "Notification"}
                                                    </h3>

                                                    {!notification.is_read && (
                                                        <span className="recent-notification-unread">
                                                            New
                                                        </span>
                                                    )}

                                                </div>

                                                <p>
                                                    {notification.message ||
                                                        "No message available."}
                                                </p>

                                            </div>

                                            {/* TIME */}
                                            <div className="recent-notification-time">

                                                <span
                                                    title={getExactTime(
                                                        notification.created_at
                                                    )}
                                                >
                                                    {getRelativeTime(
                                                        notification.created_at
                                                    )}
                                                </span>

                                            </div>

                                        </article>
                                    );
                                }
                            )}

                        </div>
                    )}

            </div>

            {/* FOOTER */}
            {!loading &&
                !error &&
                notifications.length > 0 && (
                    <div className="recent-notifications-footer">

                        <span>
                            Showing latest{" "}
                            <strong>
                                {notifications.length}
                            </strong>{" "}
                            notification
                            {notifications.length !== 1
                                ? "s"
                                : ""}
                        </span>

                    </div>
                )}

        </section>
    );
}

export default RecentNotifications;