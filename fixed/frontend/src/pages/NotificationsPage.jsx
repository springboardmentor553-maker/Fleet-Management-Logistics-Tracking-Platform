import React, { useEffect, useState } from "react";
import { notificationsApi } from "../api/fleetApi.js";
import { Badge } from "../components/common/Badge.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { Modal } from "../components/common/Modal.jsx";
import { SkeletonRows } from "../components/common/Skeleton.jsx";

export function NotificationsPage({ showToast }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    level: "info",
    is_read: 0,
  });

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  function handleOpenCreate() {
    setFormData({
      title: "",
      message: "",
      level: "info",
      is_read: 0,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      showToast("Title and Message are required.", "error");
      return;
    }

    try {
      await notificationsApi.create({
        ...formData,
        is_read: Number(formData.is_read),
      });
      showToast("Notification dispatched!", "success");
      setIsModalOpen(false);
      loadNotifications();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDelete(id) {
    try {
      await notificationsApi.delete(id);
      showToast("Notification dismissed.", "success");
      loadNotifications();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>System Alerts & Notifications</h1>
          <p className="subtitle">Operational warnings, maintenance alerts, and system broadcasts</p>
        </div>
        <button className="btn primary" onClick={handleOpenCreate} type="button">
          + Broadcast Alert
        </button>
      </header>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Message Detail</th>
                <th>Level</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={6} rows={3} />
              ) : notifications.length > 0 ? (
                notifications.map((n) => (
                  <tr key={n.id}>
                    <td>#{n.id}</td>
                    <td>
                      <strong>{n.title}</strong>
                    </td>
                    <td>{n.message}</td>
                    <td>
                      <Badge status={n.level} />
                    </td>
                    <td>
                      <span className={`read-pill ${n.is_read ? "read" : "unread"}`}>
                        {n.is_read ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="text-right action-cells">
                      <button
                        className="btn sm danger"
                        onClick={() => handleDelete(n.id)}
                        type="button"
                      >
                        Dismiss
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      actionText="Broadcast Alert"
                      description="No system notifications active."
                      onAction={handleOpenCreate}
                      title="No Notifications"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Broadcast System Notification"
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="col-span-2">
            <span>Alert Title *</span>
            <input
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Severe Weather Warning"
              required
              type="text"
              value={formData.title}
            />
          </label>

          <label className="col-span-2">
            <span>Notification Level</span>
            <select
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              value={formData.level}
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="danger">Critical / Danger</option>
            </select>
          </label>

          <label className="col-span-2">
            <span>Message Content *</span>
            <textarea
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter operational notice for dispatchers and drivers..."
              required
              rows={3}
              value={formData.message}
            />
          </label>

          <div className="form-actions col-span-2">
            <button className="btn outline" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </button>
            <button className="btn primary" type="submit">
              Send Notification
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
