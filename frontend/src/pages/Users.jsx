import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import { toast } from "react-toastify";

import {
  FaUsers,
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaUserShield,
  FaUser,
  FaCheckCircle,
} from "react-icons/fa";

function Users() {
  // ==========================================
  // EMPTY USER
  // ==========================================

  const emptyUser = {
    username: "",
    email: "",
    password: "",
    role: "User",
  };

  // ==========================================
  // STATES
  // ==========================================

  const [users, setUsers] = useState([]);

  const [user, setUser] = useState(emptyUser);

  const [editUser, setEditUser] =
    useState(emptyUser);

  const [editId, setEditId] = useState(null);

  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  const role = localStorage.getItem("role");

  // ==========================================
  // ADMIN CHECK
  // ==========================================

  useEffect(() => {
    if (role !== "Admin") {
      alert("Access Denied");
      navigate("/dashboard");
      return;
    }

    fetchUsers();
  }, []);

  // ==========================================
  // FETCH USERS
  // ==========================================

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");

      setUsers(response.data);
    } catch (error) {
      console.error("Fetch Users Error:", error);

      toast.error("Failed to load users");
    }
  };

  // ==========================================
  // ADD USER CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setUser((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // EDIT USER CHANGE
  // ==========================================

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditUser((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // ADD USER
  // ==========================================

  const addUser = async (e) => {
    e.preventDefault();

    try {
      await api.post("/users", user);

      await fetchUsers();

      setUser(emptyUser);

      toast.success(
        "User Added Successfully"
      );

      document
        .getElementById("closeAddUserModal")
        ?.click();
    } catch (error) {
      console.error("Add User Error:", error);

      const message =
        error?.response?.data?.detail ||
        "Failed to Add User";

      toast.error(message);
    }
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const openEditModal = (u) => {
    setEditUser({
      username: u.username || "",
      email: u.email || "",
      password: "",
      role: u.role || "User",
    });

    setEditId(u.id);
  };

  // ==========================================
  // UPDATE USER
  // ==========================================

  const updateUser = async (e) => {
    e.preventDefault();

    if (!editId) {
      toast.error("User ID is missing");
      return;
    }

    try {
      await api.put(
        `/users/${editId}`,
        editUser
      );

      await fetchUsers();

      toast.success(
        "User Updated Successfully"
      );

      setEditId(null);
      setEditUser(emptyUser);

      document
        .getElementById("closeEditUserModal")
        ?.click();
    } catch (error) {
      console.error(
        "Update User Error:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Update Failed";

      toast.error(message);
    }
  };

  // ==========================================
  // DELETE USER
  // ==========================================

  const deleteUser = async (id) => {
    if (
      !window.confirm(
        "Delete this user?"
      )
    ) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);

      await fetchUsers();

      toast.success(
        "User Deleted Successfully"
      );
    } catch (error) {
      console.error(
        "Delete User Error:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Delete Failed";

      toast.error(message);
    }
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredUsers = users.filter((u) => {
    const text =
      `${u.username || ""}
       ${u.email || ""}
       ${u.role || ""}`.toLowerCase();

    return text.includes(
      search.toLowerCase()
    );
  });

  // ==========================================
  // STATISTICS
  // ==========================================

  const totalUsers = users.length;

  const adminUsers = users.filter(
    (u) => u.role === "Admin"
  ).length;

  const normalUsers = users.filter(
    (u) => u.role !== "Admin"
  ).length;

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="users-page">

      {/* ==================================
          HEADER
      ================================== */}

      <div className="d-flex justify-content-between align-items-center mb-4">

        <div>
          <h2
            className="fw-bold mb-1"
            style={{
              color: "#172033",
              fontSize: "30px",
            }}
          >
            <FaUsers
              className="me-2"
              style={{
                color: "#2563eb",
              }}
            />

            User Management
          </h2>

          <p className="text-muted mb-0">
            Manage system users, roles and
            access.
          </p>
        </div>

        <button
          type="button"
          className="btn"
          data-bs-toggle="modal"
          data-bs-target="#addUserModal"
          style={{
            background: "#2563eb",
            color: "white",
            borderRadius: "10px",
            padding: "11px 20px",
            fontWeight: "600",
            boxShadow:
              "0 5px 15px rgba(37,99,235,0.25)",
          }}
        >
          <FaUserPlus className="me-2" />

          Add User
        </button>

      </div>


      {/* ==================================
          STAT CARDS
      ================================== */}

      <div className="row g-4 mb-4">

        {/* TOTAL USERS */}

        <div className="col-lg-4 col-md-6">

          <div
            className="card border-0"
            style={{
              borderRadius: "16px",
              boxShadow:
                "0 6px 20px rgba(15,23,42,0.08)",
              transition:
                "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                "translateY(-5px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                "translateY(0)";
            }}
          >

            <div className="card-body p-4 d-flex align-items-center">

              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "23px",
                  marginRight: "15px",
                }}
              >
                <FaUsers />
              </div>

              <div>
                <small className="text-muted">
                  TOTAL USERS
                </small>

                <h3
                  className="fw-bold mb-0"
                  style={{
                    color: "#172033",
                  }}
                >
                  {totalUsers}
                </h3>
              </div>

            </div>

          </div>

        </div>


        {/* ADMINS */}

        <div className="col-lg-4 col-md-6">

          <div
            className="card border-0"
            style={{
              borderRadius: "16px",
              boxShadow:
                "0 6px 20px rgba(15,23,42,0.08)",
              transition:
                "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                "translateY(-5px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                "translateY(0)";
            }}
          >

            <div className="card-body p-4 d-flex align-items-center">

              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "#fef2f2",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "23px",
                  marginRight: "15px",
                }}
              >
                <FaUserShield />
              </div>

              <div>
                <small className="text-muted">
                  ADMIN USERS
                </small>

                <h3
                  className="fw-bold mb-0"
                  style={{
                    color: "#172033",
                  }}
                >
                  {adminUsers}
                </h3>
              </div>

            </div>

          </div>

        </div>


        {/* NORMAL USERS */}

        <div className="col-lg-4 col-md-6">

          <div
            className="card border-0"
            style={{
              borderRadius: "16px",
              boxShadow:
                "0 6px 20px rgba(15,23,42,0.08)",
              transition:
                "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                "translateY(-5px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                "translateY(0)";
            }}
          >

            <div className="card-body p-4 d-flex align-items-center">

              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "#ecfdf5",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "23px",
                  marginRight: "15px",
                }}
              >
                <FaUser />
              </div>

              <div>
                <small className="text-muted">
                  NORMAL USERS
                </small>

                <h3
                  className="fw-bold mb-0"
                  style={{
                    color: "#172033",
                  }}
                >
                  {normalUsers}
                </h3>
              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ==================================
          SEARCH
      ================================== */}

      <div
        className="card border-0 mb-4"
        style={{
          borderRadius: "15px",
          boxShadow:
            "0 5px 18px rgba(15,23,42,0.07)",
        }}
      >

        <div className="card-body p-3">

          <div
            style={{
              position: "relative",
              maxWidth: "550px",
            }}
          >

            <FaSearch
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform:
                  "translateY(-50%)",
                color: "#94a3b8",
              }}
            />

            <input
              type="text"
              className="form-control"
              placeholder="Search username, email or role..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              style={{
                height: "48px",
                paddingLeft: "45px",
                borderRadius: "10px",
                border:
                  "1px solid #e2e8f0",
              }}
            />

          </div>

        </div>

      </div>


      {/* ==================================
          USERS TABLE
      ================================== */}

      <div
        className="card border-0"
        style={{
          borderRadius: "16px",
          boxShadow:
            "0 6px 22px rgba(15,23,42,0.08)",
          overflow: "hidden",
        }}
      >

        <div
          className="card-header border-0"
          style={{
            background: "white",
            padding: "20px 24px",
          }}
        >

          <div className="d-flex align-items-center">

            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >
              <FaUsers />
            </div>

            <div>

              <h5
                className="fw-bold mb-0"
                style={{
                  color: "#172033",
                }}
              >
                System Users
              </h5>

              <small className="text-muted">
                Manage user accounts and roles
              </small>

            </div>

          </div>

        </div>


        <div className="table-responsive">

          <table className="table align-middle mb-0">

            <thead
              style={{
                background: "#f8fafc",
              }}
            >

              <tr>

                <th
                  style={{
                    padding: "15px 20px",
                  }}
                >
                  ID
                </th>

                <th>User</th>

                <th>Email</th>

                <th>Role</th>

                <th>Status</th>

                <th>Actions</th>

              </tr>

            </thead>


            <tbody>

              {filteredUsers.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="text-center py-5"
                  >

                    <FaUsers
                      style={{
                        fontSize: "40px",
                        color: "#cbd5e1",
                      }}
                    />

                    <h6
                      className="mt-3"
                      style={{
                        color: "#64748b",
                      }}
                    >
                      No users found
                    </h6>

                  </td>

                </tr>

              ) : (

                filteredUsers.map((u) => (

                  <tr
                    key={u.id}
                    style={{
                      transition:
                        "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "white";
                    }}
                  >

                    {/* ID */}

                    <td
                      style={{
                        padding:
                          "16px 20px",
                        fontWeight: "700",
                        color: "#64748b",
                      }}
                    >
                      #{u.id}
                    </td>


                    {/* USER */}

                    <td>

                      <div className="d-flex align-items-center">

                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background:
                              u.role === "Admin"
                                ? "#fef2f2"
                                : "#eff6ff",
                            color:
                              u.role === "Admin"
                                ? "#ef4444"
                                : "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                              "center",
                            marginRight: "10px",
                          }}
                        >

                          {u.role === "Admin" ? (
                            <FaUserShield />
                          ) : (
                            <FaUser />
                          )}

                        </div>

                        <div>

                          <div
                            style={{
                              fontWeight: "600",
                              color: "#172033",
                            }}
                          >
                            {u.username}
                          </div>

                          <small className="text-muted">
                            User ID #{u.id}
                          </small>

                        </div>

                      </div>

                    </td>


                    {/* EMAIL */}

                    <td>

                      <span
                        style={{
                          color: "#475569",
                        }}
                      >
                        {u.email}
                      </span>

                    </td>


                    {/* ROLE */}

                    <td>

                      <span
                        style={{
                          display:
                            "inline-flex",
                          alignItems:
                            "center",

                          background:
                            u.role === "Admin"
                              ? "#fee2e2"
                              : "#dbeafe",

                          color:
                            u.role === "Admin"
                              ? "#dc2626"
                              : "#1d4ed8",

                          padding:
                            "6px 12px",

                          borderRadius:
                            "20px",

                          fontSize: "12px",

                          fontWeight: "700",
                        }}
                      >

                        {u.role === "Admin" ? (
                          <FaUserShield className="me-1" />
                        ) : (
                          <FaUser className="me-1" />
                        )}

                        {u.role}

                      </span>

                    </td>


                    {/* STATUS */}

                    <td>

                      <span
                        style={{
                          display:
                            "inline-flex",
                          alignItems:
                            "center",
                          background:
                            "#dcfce7",
                          color:
                            "#15803d",
                          padding:
                            "6px 11px",
                          borderRadius:
                            "20px",
                          fontSize:
                            "12px",
                          fontWeight:
                            "700",
                        }}
                      >

                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius:
                              "50%",
                            background:
                              "#16a34a",
                            marginRight:
                              "6px",
                          }}
                        />

                        Active

                      </span>

                    </td>


                    {/* ACTIONS */}

                    <td>

                      <button
                        type="button"
                        className="btn btn-sm me-2"
                        data-bs-toggle="modal"
                        data-bs-target="#editUserModal"
                        onClick={() =>
                          openEditModal(u)
                        }
                        style={{
                          background:
                            "#fef3c7",
                          color:
                            "#b45309",
                          border: "none",
                          borderRadius:
                            "8px",
                          fontWeight:
                            "600",
                        }}
                      >

                        <FaEdit className="me-1" />

                        Edit

                      </button>


                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() =>
                          deleteUser(u.id)
                        }
                        style={{
                          background:
                            "#fee2e2",
                          color:
                            "#dc2626",
                          border: "none",
                          borderRadius:
                            "8px",
                          fontWeight:
                            "600",
                        }}
                      >

                        <FaTrash className="me-1" />

                        Delete

                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ==================================
          ADD USER MODAL
      ================================== */}

      <div
        className="modal fade"
        id="addUserModal"
        tabIndex="-1"
      >

        <div className="modal-dialog">

          <div
            className="modal-content border-0"
            style={{
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >

            <div
              className="modal-header"
              style={{
                background: "#2563eb",
                color: "white",
              }}
            >

              <h5 className="modal-title fw-bold">

                <FaUserPlus className="me-2" />

                Add New User

              </h5>

              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
              />

            </div>


            <form onSubmit={addUser}>

              <div className="modal-body p-4">

                {/* USERNAME */}

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Username
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    name="username"
                    value={user.username}
                    onChange={handleChange}
                    required
                    style={{
                      borderRadius: "9px",
                      padding: "11px",
                    }}
                  />

                </div>


                {/* EMAIL */}

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Email
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={user.email}
                    onChange={handleChange}
                    required
                    style={{
                      borderRadius: "9px",
                      padding: "11px",
                    }}
                  />

                </div>


                {/* PASSWORD */}

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Password
                  </label>

                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={user.password}
                    onChange={handleChange}
                    required
                    style={{
                      borderRadius: "9px",
                      padding: "11px",
                    }}
                  />

                </div>


                {/* ROLE */}

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Role
                  </label>

                  <select
                    className="form-select"
                    name="role"
                    value={user.role}
                    onChange={handleChange}
                    style={{
                      borderRadius: "9px",
                      padding: "11px",
                    }}
                  >

                    <option value="User">
                      User
                    </option>

                    <option value="Admin">
                      Admin
                    </option>

                  </select>

                </div>

              </div>


              <div className="modal-footer">

                <button
                  id="closeAddUserModal"
                  type="button"
                  className="btn btn-light"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                >

                  <FaUserPlus className="me-2" />

                  Save User

                </button>

              </div>

            </form>

          </div>

        </div>

      </div>


      {/* ==================================
          EDIT USER MODAL
      ================================== */}

      <div
        className="modal fade"
        id="editUserModal"
        tabIndex="-1"
      >

        <div className="modal-dialog">

          <div
            className="modal-content border-0"
            style={{
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >

            <div
              className="modal-header"
              style={{
                background: "#2563eb",
                color: "white",
              }}
            >

              <h5 className="modal-title fw-bold">

                <FaEdit className="me-2" />

                Edit User

              </h5>

              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="modal"
              />

            </div>


            <form onSubmit={updateUser}>

              <div className="modal-body p-4">

                {/* USERNAME */}

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Username
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    name="username"
                    value={
                      editUser.username
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                    style={{
                      borderRadius: "9px",
                      padding: "11px",
                    }}
                  />

                </div>


                {/* EMAIL */}

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Email
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={
                      editUser.email
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                    style={{
                      borderRadius: "9px",
                      padding: "11px",
                    }}
                  />

                </div>


                {/* PASSWORD */}

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Password
                  </label>

                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={
                      editUser.password
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                    style={{
                      borderRadius: "9px",
                      padding: "11px",
                    }}
                  />

                </div>


                {/* ROLE */}

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Role
                  </label>

                  <select
                    className="form-select"
                    name="role"
                    value={
                      editUser.role
                    }
                    onChange={
                      handleEditChange
                    }
                    style={{
                      borderRadius: "9px",
                      padding: "11px",
                    }}
                  >

                    <option value="User">
                      User
                    </option>

                    <option value="Admin">
                      Admin
                    </option>

                  </select>

                </div>

              </div>


              <div className="modal-footer">

                <button
                  id="closeEditUserModal"
                  type="button"
                  className="btn btn-light"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-success"
                >

                  <FaCheckCircle className="me-2" />

                  Update User

                </button>

              </div>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Users;