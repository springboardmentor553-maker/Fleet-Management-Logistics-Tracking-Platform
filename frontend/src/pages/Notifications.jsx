import React, { useEffect, useState } from "react";

import api from "../api/api";

import { toast } from "react-toastify";

import {
  FaTrash,
  FaCheck,
  FaBell,
  FaPlus,
  FaSearch,
  FaEnvelopeOpen,
  FaEnvelope,
  FaClock,
  FaInbox,
} from "react-icons/fa";


function Notifications() {

  // =====================================================
  // EMPTY FORM
  // =====================================================

  const emptyNotification = {
    title: "",
    message: "",
  };


  // =====================================================
  // STATES
  // =====================================================

  const [notifications, setNotifications] =
    useState([]);

  const [notification, setNotification] =
    useState(emptyNotification);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [readingId, setReadingId] =
    useState(null);


  // =====================================================
  // LOAD NOTIFICATIONS
  // =====================================================

  useEffect(() => {

    fetchNotifications();

  }, []);


  const fetchNotifications = async () => {

    try {

      setLoading(true);

      const res =
        await api.get(
          "/notifications"
        );

      const data =
        Array.isArray(res.data)
          ? res.data
          : [];

      setNotifications(data);

    } catch (err) {

      console.error(
        "Failed to load notifications:",
        err
      );

      toast.error(
        "Failed to load notifications"
      );

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setNotification(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  };


  // =====================================================
  // ADD NOTIFICATION
  // =====================================================

  const addNotification = async (e) => {

    e.preventDefault();

    if (
      !notification.title.trim()
    ) {

      toast.error(
        "Please enter notification title."
      );

      return;
    }


    if (
      !notification.message.trim()
    ) {

      toast.error(
        "Please enter notification message."
      );

      return;
    }


    try {

      setCreating(true);

      await api.post(
        "/notifications",
        {
          title:
            notification.title.trim(),

          message:
            notification.message.trim(),
        }
      );


      toast.success(
        "Notification Created"
      );


      setNotification(
        emptyNotification
      );


      await fetchNotifications();


      // Close Bootstrap modal

      const closeButton =
        document.getElementById(
          "closeNotificationModal"
        );

      if (closeButton) {

        closeButton.click();

      }

    } catch (err) {

      console.error(
        "Create notification error:",
        err
      );

      toast.error(
        err.response?.data?.detail ||
        "Failed to Create Notification"
      );

    } finally {

      setCreating(false);

    }

  };


  // =====================================================
  // MARK AS READ
  // =====================================================

  const markAsRead = async (
    id
  ) => {

    try {

      setReadingId(id);

      await api.put(
        `/notifications/${id}/read`
      );


      toast.success(
        "Marked as Read"
      );


      await fetchNotifications();

    } catch (err) {

      console.error(
        "Mark as read error:",
        err
      );

      toast.error(
        err.response?.data?.detail ||
        "Operation Failed"
      );

    } finally {

      setReadingId(null);

    }

  };


  // =====================================================
  // DELETE
  // =====================================================

  const deleteNotification = async (
    id
  ) => {

    if (
      !window.confirm(
        "Delete this notification?"
      )
    ) {

      return;

    }


    try {

      setDeletingId(id);

      await api.delete(
        `/notifications/${id}`
      );


      toast.success(
        "Notification Deleted"
      );


      await fetchNotifications();

    } catch (err) {

      console.error(
        "Delete notification error:",
        err
      );

      toast.error(
        err.response?.data?.detail ||
        "Delete Failed"
      );

    } finally {

      setDeletingId(null);

    }

  };


  // =====================================================
  // FILTER
  // =====================================================

  const searchText =
    search
      .trim()
      .toLowerCase();


  const filteredNotifications =
    notifications.filter(
      (n) => {

        const text =
          `${n.title || ""}
          ${n.message || ""}
          ${n.status || ""}`
            .toLowerCase();

        return text.includes(
          searchText
        );

      }
    );


  // =====================================================
  // STATISTICS
  // =====================================================

  const unreadCount =
    notifications.filter(
      (n) =>
        n.status !== "Read"
    ).length;


  const readCount =
    notifications.filter(
      (n) =>
        n.status === "Read"
    ).length;


  const totalCount =
    notifications.length;


  // =====================================================
  // TIME FORMAT
  // =====================================================

  const formatDate = (
    date
  ) => {

    if (!date) {

      return "-";

    }


    const parsedDate =
      new Date(date);


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      return "-";

    }


    return parsedDate.toLocaleString(
      "en-IN",
      {
        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit",
      }
    );

  };


  // =====================================================
  // MAIN UI
  // =====================================================

  return (

    <main
      className="notifications-page"
      style={{
        minHeight:
          "100vh",

        background:
          "#f4f7fb",
      }}
    >

      <div
        className="container-fluid"
        style={{
          padding:
            "30px",
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="d-flex justify-content-between align-items-center mb-4"
        >

          <div>

            <h2
              className="fw-bold mb-1"
              style={{
                color:
                  "#172033",

                fontSize:
                  "30px",
              }}
            >

              <FaBell
                className="me-2"
                style={{
                  color:
                    "#2563eb",
                }}
              />

              Notifications

            </h2>


            <p
              className="text-muted mb-0"
            >
              Manage fleet alerts,
              updates and notifications.
            </p>

          </div>


          {/* ADD BUTTON */}

          <button
            type="button"
            className="btn"
            data-bs-toggle="modal"
            data-bs-target="#addNotificationModal"
            style={{
              background:
                "#2563eb",

              color:
                "white",

              borderRadius:
                "10px",

              padding:
                "11px 20px",

              fontWeight:
                "600",

              boxShadow:
                "0 5px 15px rgba(37,99,235,0.25)",
            }}
          >

            <FaPlus
              className="me-2"
            />

            Add Notification

          </button>

        </div>


        {/* =================================================
            STATISTICS
        ================================================= */}

        <div
          className="row g-4 mb-4"
        >

          {/* TOTAL */}

          <div
            className="col-lg-4 col-md-6"
          >

            <div
              className="card border-0"
              style={{
                borderRadius:
                  "16px",

                boxShadow:
                  "0 6px 20px rgba(15,23,42,0.08)",
              }}
            >

              <div
                className="card-body d-flex align-items-center"
              >

                <div
                  style={{
                    width:
                      "55px",

                    height:
                      "55px",

                    borderRadius:
                      "14px",

                    background:
                      "#eff6ff",

                    color:
                      "#2563eb",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontSize:
                      "22px",

                    marginRight:
                      "15px",
                  }}
                >

                  <FaInbox />

                </div>


                <div>

                  <small
                    className="text-muted"
                  >
                    Total Notifications
                  </small>

                  <h3
                    className="fw-bold mb-0"
                  >
                    {totalCount}
                  </h3>

                </div>

              </div>

            </div>

          </div>


          {/* UNREAD */}

          <div
            className="col-lg-4 col-md-6"
          >

            <div
              className="card border-0"
              style={{
                borderRadius:
                  "16px",

                boxShadow:
                  "0 6px 20px rgba(15,23,42,0.08)",
              }}
            >

              <div
                className="card-body d-flex align-items-center"
              >

                <div
                  style={{
                    width:
                      "55px",

                    height:
                      "55px",

                    borderRadius:
                      "14px",

                    background:
                      "#fff7ed",

                    color:
                      "#f97316",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontSize:
                      "22px",

                    marginRight:
                      "15px",
                  }}
                >

                  <FaEnvelope />

                </div>


                <div>

                  <small
                    className="text-muted"
                  >
                    Unread
                  </small>

                  <h3
                    className="fw-bold mb-0"
                  >
                    {unreadCount}
                  </h3>

                </div>

              </div>

            </div>

          </div>


          {/* READ */}

          <div
            className="col-lg-4 col-md-6"
          >

            <div
              className="card border-0"
              style={{
                borderRadius:
                  "16px",

                boxShadow:
                  "0 6px 20px rgba(15,23,42,0.08)",
              }}
            >

              <div
                className="card-body d-flex align-items-center"
              >

                <div
                  style={{
                    width:
                      "55px",

                    height:
                      "55px",

                    borderRadius:
                      "14px",

                    background:
                      "#ecfdf5",

                    color:
                      "#10b981",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    fontSize:
                      "22px",

                    marginRight:
                      "15px",
                  }}
                >

                  <FaEnvelopeOpen />

                </div>


                <div>

                  <small
                    className="text-muted"
                  >
                    Read
                  </small>

                  <h3
                    className="fw-bold mb-0"
                  >
                    {readCount}
                  </h3>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            SEARCH
        ================================================= */}

        <div
          className="card border-0 mb-4"
          style={{
            borderRadius:
              "15px",

            boxShadow:
              "0 5px 18px rgba(15,23,42,0.07)",
          }}
        >

          <div
            className="card-body"
          >

            <div
              className="position-relative"
              style={{
                maxWidth:
                  "550px",
              }}
            >

              <FaSearch
                style={{
                  position:
                    "absolute",

                  left:
                    "16px",

                  top:
                    "50%",

                  transform:
                    "translateY(-50%)",

                  color:
                    "#94a3b8",

                  zIndex:
                    2,
                }}
              />


              <input
                type="text"
                className="form-control"
                placeholder="Search notifications..."
                value={
                  search
                }
                onChange={
                  (e) =>
                    setSearch(
                      e.target.value
                    )
                }
                style={{
                  height:
                    "48px",

                  paddingLeft:
                    "45px",

                  borderRadius:
                    "10px",

                  border:
                    "1px solid #e2e8f0",
                }}
              />

            </div>

          </div>

        </div>


        {/* =================================================
            NOTIFICATION LIST
        ================================================= */}

        <div
          className="card border-0"
          style={{
            borderRadius:
              "16px",

            boxShadow:
              "0 6px 22px rgba(15,23,42,0.08)",

            overflow:
              "hidden",
          }}
        >

          {/* HEADER */}

          <div
            className="card-header border-0"
            style={{
              background:
                "white",

              padding:
                "20px 24px",
            }}
          >

            <div
              className="d-flex align-items-center"
            >

              <div
                style={{
                  width:
                    "42px",

                  height:
                    "42px",

                  borderRadius:
                    "11px",

                  background:
                    "#eff6ff",

                  color:
                    "#2563eb",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  marginRight:
                    "12px",
                }}
              >

                <FaBell />

              </div>


              <div>

                <h5
                  className="fw-bold mb-0"
                  style={{
                    color:
                      "#172033",
                  }}
                >
                  Notification Center
                </h5>

                <small
                  className="text-muted"
                >
                  Recent fleet alerts
                </small>

              </div>

            </div>

          </div>


          {/* LIST */}

          <div
            className="p-3"
          >

            {loading ? (

              <div
                className="text-center py-5"
              >

                <div
                  className="spinner-border text-primary"
                  role="status"
                />

                <p
                  className="text-muted mt-3 mb-0"
                >
                  Loading notifications...
                </p>

              </div>

            ) : filteredNotifications.length === 0 ? (

              <div
                className="text-center py-5"
              >

                <FaBell
                  style={{
                    fontSize:
                      "45px",

                    color:
                      "#cbd5e1",
                  }}
                />


                <h5
                  className="mt-3"
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  No notifications found
                </h5>


                <p
                  className="text-muted"
                >
                  There are no
                  notifications
                  matching your search.
                </p>

              </div>

            ) : (

              filteredNotifications.map(
                (n) => {

                  const isRead =
                    n.status ===
                    "Read";


                  return (

                    <div
                      key={n.id}
                      style={{
                        padding:
                          "18px",

                        marginBottom:
                          "10px",

                        borderRadius:
                          "12px",

                        background:
                          isRead
                            ? "#ffffff"
                            : "#eff6ff",

                        border:
                          isRead
                            ? "1px solid #e2e8f0"
                            : "1px solid #bfdbfe",

                        transition:
                          "all 0.2s ease",
                      }}

                      onMouseEnter={(
                        e
                      ) => {

                        e.currentTarget.style.transform =
                          "translateX(3px)";

                        e.currentTarget.style.boxShadow =
                          "0 5px 15px rgba(15,23,42,0.07)";

                      }}

                      onMouseLeave={(
                        e
                      ) => {

                        e.currentTarget.style.transform =
                          "translateX(0)";

                        e.currentTarget.style.boxShadow =
                          "none";

                      }}
                    >

                      <div
                        className="d-flex align-items-start"
                      >

                        {/* ICON */}

                        <div
                          style={{
                            width:
                              "48px",

                            height:
                              "48px",

                            minWidth:
                              "48px",

                            borderRadius:
                              "12px",

                            background:
                              isRead
                                ? "#f1f5f9"
                                : "#dbeafe",

                            color:
                              isRead
                                ? "#64748b"
                                : "#2563eb",

                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "center",

                            fontSize:
                              "20px",

                            marginRight:
                              "15px",
                          }}
                        >

                          {isRead ? (
                            <FaEnvelopeOpen />
                          ) : (
                            <FaBell />
                          )}

                        </div>


                        {/* CONTENT */}

                        <div
                          className="flex-grow-1"
                        >

                          <div
                            className="d-flex justify-content-between align-items-start gap-3"
                          >

                            <div>

                              <h6
                                className="fw-bold mb-1"
                                style={{
                                  color:
                                    "#172033",
                                }}
                              >
                                {n.title ||
                                  "Notification"}
                              </h6>


                              <p
                                className="mb-2"
                                style={{
                                  color:
                                    "#475569",

                                  fontSize:
                                    "14px",
                                }}
                              >
                                {n.message ||
                                  "-"}
                              </p>

                            </div>


                            {/* STATUS */}

                            <span
                              style={{
                                background:
                                  isRead
                                    ? "#dcfce7"
                                    : "#fef3c7",

                                color:
                                  isRead
                                    ? "#15803d"
                                    : "#b45309",

                                padding:
                                  "6px 10px",

                                borderRadius:
                                  "20px",

                                fontSize:
                                  "11px",

                                fontWeight:
                                  "700",

                                whiteSpace:
                                  "nowrap",
                              }}
                            >

                              {isRead
                                ? "Read"
                                : "Unread"}

                            </span>

                          </div>


                          {/* FOOTER */}

                          <div
                            className="d-flex justify-content-between align-items-center flex-wrap gap-2"
                          >

                            <small
                              className="text-muted"
                            >

                              <FaClock
                                className="me-1"
                              />

                              {formatDate(
                                n.created_at
                              )}

                            </small>


                            <div>

                              {/* MARK READ */}

                              {!isRead && (

                                <button
                                  type="button"
                                  className="btn btn-sm me-2"
                                  onClick={() =>
                                    markAsRead(
                                      n.id
                                    )
                                  }
                                  disabled={
                                    readingId ===
                                    n.id
                                  }
                                  style={{
                                    background:
                                      "#dcfce7",

                                    color:
                                      "#15803d",

                                    border:
                                      "none",

                                    borderRadius:
                                      "8px",

                                    fontWeight:
                                      "600",

                                    opacity:
                                      readingId ===
                                      n.id
                                        ? 0.7
                                        : 1,
                                  }}
                                >

                                  <FaCheck
                                    className="me-1"
                                  />

                                  {readingId ===
                                  n.id
                                    ? "Updating..."
                                    : "Mark Read"}

                                </button>

                              )}


                              {/* DELETE */}

                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() =>
                                  deleteNotification(
                                    n.id
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  n.id
                                }
                                style={{
                                  background:
                                    "#fee2e2",

                                  color:
                                    "#dc2626",

                                  border:
                                    "none",

                                  borderRadius:
                                    "8px",

                                  fontWeight:
                                    "600",

                                  opacity:
                                    deletingId ===
                                    n.id
                                      ? 0.7
                                      : 1,
                                }}
                              >

                                <FaTrash
                                  className="me-1"
                                />

                                {deletingId ===
                                n.id
                                  ? "Deleting..."
                                  : "Delete"}

                              </button>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  );

                }
              )

            )}

          </div>

        </div>


        {/* =================================================
            ADD NOTIFICATION MODAL
        ================================================= */}

        <div
          className="modal fade"
          id="addNotificationModal"
          tabIndex="-1"
          aria-labelledby="addNotificationModalLabel"
          aria-hidden="true"
        >

          <div
            className="modal-dialog modal-dialog-centered"
          >

            <div
              className="modal-content border-0"
              style={{
                borderRadius:
                  "16px",

                overflow:
                  "hidden",
              }}
            >

              {/* MODAL HEADER */}

              <div
                className="modal-header"
                style={{
                  background:
                    "#2563eb",

                  color:
                    "white",
                }}
              >

                <h5
                  className="modal-title fw-bold"
                  id="addNotificationModalLabel"
                >

                  <FaBell
                    className="me-2"
                  />

                  Create Notification

                </h5>


                <button
                  type="button"
                  className="btn-close btn-close-white"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />

              </div>


              {/* FORM */}

              <form
                onSubmit={
                  addNotification
                }
              >

                <div
                  className="modal-body p-4"
                >

                  {/* TITLE */}

                  <div
                    className="mb-3"
                  >

                    <label
                      className="form-label fw-semibold"
                    >
                      Notification Title
                    </label>


                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={
                        notification.title
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter notification title"
                      required
                    />

                  </div>


                  {/* MESSAGE */}

                  <div
                    className="mb-3"
                  >

                    <label
                      className="form-label fw-semibold"
                    >
                      Message
                    </label>


                    <textarea
                      rows="5"
                      className="form-control"
                      name="message"
                      value={
                        notification.message
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter notification message"
                      required
                    />

                  </div>

                </div>


                {/* FOOTER */}

                <div
                  className="modal-footer"
                >

                  <button
                    id="closeNotificationModal"
                    type="button"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                    disabled={
                      creating
                    }
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      creating
                    }
                  >

                    <FaPlus
                      className="me-2"
                    />

                    {creating
                      ? "Saving..."
                      : "Save Notification"}

                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}


export default Notifications;