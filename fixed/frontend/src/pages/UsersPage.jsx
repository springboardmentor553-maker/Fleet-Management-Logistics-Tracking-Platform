import React, { useEffect, useState } from "react";
import { usersApi } from "../api/fleetApi.js";
import { Badge } from "../components/common/Badge.jsx";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { Modal } from "../components/common/Modal.jsx";
import { SkeletonRows } from "../components/common/Skeleton.jsx";

export function UsersPage({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "manager",
  });

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function handleOpenCreate() {
    setEditingItem(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "manager",
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(user) {
    setEditingItem(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "manager",
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast("Name and Email are required.", "error");
      return;
    }
    if (!editingItem && !formData.password.trim()) {
      showToast("Password is required for new user registration.", "error");
      return;
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      password: formData.password || "defaultPass123",
    };

    try {
      if (editingItem) {
        await usersApi.update(editingItem.id, payload);
        showToast("User updated!", "success");
      } else {
        await usersApi.create(payload);
        showToast("User account created successfully!", "success");
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to remove this user account?")) return;
    try {
      await usersApi.delete(id);
      showToast("User deleted.", "success");
      loadUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1>User Accounts & Access</h1>
          <p className="subtitle">Manage FleetFlow system users, administrators, and dispatchers</p>
        </div>
        <button className="btn primary" onClick={handleOpenCreate} type="button">
          + Add User Account
        </button>
      </header>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={5} rows={3} />
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <Badge status={u.role} />
                    </td>
                    <td className="text-right action-cells">
                      <button
                        className="btn sm outline"
                        onClick={() => handleOpenEdit(u)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="btn sm danger"
                        onClick={() => handleDelete(u.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      actionText="Add User Account"
                      description="No user accounts registered."
                      onAction={handleOpenCreate}
                      title="No Users Registered"
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
        title={editingItem ? "Edit User Account" : "Create User Account"}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="col-span-2">
            <span>Full Name *</span>
            <input
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sarah Connor"
              required
              type="text"
              value={formData.name}
            />
          </label>

          <label className="col-span-2">
            <span>Email Address *</span>
            <input
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="s.connor@fleetflow.com"
              required
              type="email"
              value={formData.email}
            />
          </label>

          <label>
            <span>Password {editingItem && "(Leave blank to keep current)"}</span>
            <input
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required={!editingItem}
              type="password"
              value={formData.password}
            />
          </label>

          <label>
            <span>System Role *</span>
            <select
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              value={formData.role}
            >
              <option value="manager">Fleet Manager</option>
              <option value="admin">Administrator</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="driver">Driver</option>
            </select>
          </label>

          <div className="form-actions col-span-2">
            <button className="btn outline" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </button>
            <button className="btn primary" type="submit">
              {editingItem ? "Save Changes" : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
