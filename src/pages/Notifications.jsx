import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./Notifications.css";

import {
  FaBell,
  FaTrash,
  FaCheckCircle,
  FaTruck,
  FaUserTie,
  FaBoxOpen,
  FaSearch,
  FaCheckDouble,
  FaBroom,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setCurrentTime] = useState(Date.now());
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // ====================================
  // Fetch Notifications
  // ====================================

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");

      setNotifications(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // Mark Single Read
  // ====================================

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);

      fetchNotifications();
    } catch (error) {
      console.log(error);
    }
  };

  // ====================================
  // Mark All Read
  // ====================================

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");

      fetchNotifications();
    } catch (error) {
      console.log(error);
    }
  };

  // ====================================
  // Delete One
  // ====================================

  const deleteNotification = async (id) => {
    const confirmDelete = window.confirm("Delete this notification?");

    if (!confirmDelete) return;

    try {
      await api.delete(`/notifications/${id}`);

      fetchNotifications();
    } catch (error) {
      console.log(error);
    }
  };

  // ====================================
  // Clear All
  // ====================================

  const clearAllNotifications = async () => {
    const confirmDelete = window.confirm("Delete ALL notifications?");

    if (!confirmDelete) return;

    try {
      await api.delete("/notifications/clear-all");

      fetchNotifications();
    } catch (error) {
      console.log(error);
    }
  };

  // ====================================
  // Relative Time
  // ====================================
  const getRelativeTime = (createdAt) => {

    const created = new Date(createdAt);
    const now = new Date();

    const diff = now.getTime() - created.getTime();

    if (diff < 0) {
        return "Just now";
    }

    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) {
        return "Just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(hours / 24);

    if (days === 1) {
        return "Yesterday";
    }

    if (days < 7) {
        return `${days} days ago`;
    }

    return created.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};
  // ====================================
  // Notification Icon
  // ====================================

  const getIcon = (title) => {
    if (title.includes("Driver")) return <FaUserTie />;

    if (title.includes("Vehicle")) return <FaTruck />;

    if (title.includes("Shipment")) return <FaBoxOpen />;

    return <FaBell />;
  };

  // ====================================
  // Notification Color
  // ====================================

  const getTypeClass = (type) => {
    switch (type) {
      case "success":
        return "success";

      case "warning":
        return "warning";

      case "info":
        return "info";

      default:
        return "info";
    }
  };

  // ====================================
  // Search
  // ====================================

  const filteredNotifications = useMemo(() => {
    return notifications.filter(
      (item) =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.message.toLowerCase().includes(search.toLowerCase()),
    );
  }, [notifications, search]);

  // ====================================
  // Counts
  // ====================================

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  if (loading)
    return <div className="notification-loading">Loading Notifications...</div>;

  return (
    <div className="notifications-page">
      {/* ============================= */}
      {/* Header */}
      {/* ============================= */}

      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>

          <p>Stay updated with all FleetFlow activities.</p>
        </div>

        <div className="notification-count">
          <span>{notifications.length}</span>
          Total
        </div>
      </div>

      {/* ============================= */}
      {/* Toolbar */}
      {/* ============================= */}

      <div className="notification-toolbar">
        <div className="notification-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="notification-toolbar-buttons">
          <button
            className="mark-all-btn"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <FaCheckDouble />
            Mark All Read
          </button>

          <button
            className="clear-all-btn"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
          >
            <FaBroom />
            Clear All
          </button>
        </div>
      </div>

      {/* ============================= */}
      {/* Empty */}
      {/* ============================= */}

      {filteredNotifications.length === 0 ? (
        <div className="empty-notifications">
          <FaBell />

          <h2>No Notifications Found</h2>
        </div>
      ) : (
        filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-card ${
              notification.is_read ? "read" : "unread"
            }`}
          >
            {/* Icon */}

            <div
              className={`notification-icon ${getTypeClass(notification.type)}`}
            >
              {getIcon(notification.title)}
            </div>

            {/* Content */}

            <div className="notification-content">
              <div className="notification-top">
                <h3>{notification.title}</h3>

                <div className="notification-time">
                  <strong>{getRelativeTime(notification.created_at)}</strong>

                  <small>
                    {new Date(notification.created_at).toLocaleTimeString(
                      "en-IN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      },
                    )}
                  </small>
                </div>
              </div>

              <p>{notification.message}</p>

              <div className="notification-type">
                {notification.type === "success" && (
                  <>
                    <FaCheckCircle />
                    Success
                  </>
                )}

                {notification.type === "warning" && (
                  <>
                    <FaExclamationTriangle />
                    Warning
                  </>
                )}

                {notification.type === "info" && (
                  <>
                    <FaInfoCircle />
                    Information
                  </>
                )}
              </div>
            </div>

            {/* Actions */}

            <div className="notification-actions">
              {!notification.is_read && (
                <button
                  className="read-btn"
                  onClick={() => markAsRead(notification.id)}
                >
                  <FaCheckCircle />
                </button>
              )}

              <button
                className="delete-btn"
                onClick={() => deleteNotification(notification.id)}
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Notifications;
