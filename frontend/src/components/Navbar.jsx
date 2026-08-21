import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaBell,
  FaUserCircle,
  FaChevronDown,
  FaBars,
} from "react-icons/fa";

import api from "../api/api";


function Navbar({
  onMenuClick,
  isMobile,
}) {

  const navigate = useNavigate();

  const [currentTime, setCurrentTime] =
    useState("");

  const [notificationCount, setNotificationCount] =
    useState(0);


  const name =
    localStorage.getItem("name") || "Admin";

  const role =
    localStorage.getItem("role") || "Admin";


  // =====================================================
  // CURRENT TIME
  // =====================================================

  useEffect(() => {

    const updateTime = () => {

      const now = new Date();

      setCurrentTime(
        now.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      );

    };

    updateTime();

    const interval =
      setInterval(
        updateTime,
        1000000
      );

    return () => {
      clearInterval(interval);
    };

  }, []);


  // =====================================================
  // LOAD UNREAD NOTIFICATIONS
  // =====================================================

  const fetchNotificationCount =
    async () => {

      try {

        const response =
          await api.get(
            "/notifications"
          );


        const data =
          Array.isArray(response.data)
            ? response.data
            : [];


        // Same logic used by
        // Notifications.jsx

        const unreadCount =
          data.filter(
            (notification) =>
              notification.status !== "Read"
          ).length;


        setNotificationCount(
          unreadCount
        );


      } catch (error) {

        console.error(
          "Failed to load notification count:",
          error
        );

        setNotificationCount(0);

      }

    };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    fetchNotificationCount();

  }, []);


  // =====================================================
  // AUTO REFRESH
  // =====================================================

  useEffect(() => {

    const interval =
      setInterval(
        fetchNotificationCount,
        10000
      );

    return () => {

      clearInterval(
        interval
      );

    };

  }, []);


  // =====================================================
  // REFRESH WHEN USER RETURNS TO TAB
  // =====================================================

  useEffect(() => {

    const handleVisibilityChange =
      () => {

        if (
          document.visibilityState ===
          "visible"
        ) {

          fetchNotificationCount();

        }

      };


    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );


    return () => {

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

    };

  }, []);


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <nav className="fleet-navbar">


      {/* =================================================
          LEFT
      ================================================= */}

      <div className="fleet-navbar-left">


        <button
          type="button"
          className="fleet-menu-btn"
          onClick={onMenuClick}
          aria-label="Open sidebar"
          title="Open sidebar"
        >

          <FaBars />

        </button>


        <div className="fleet-navbar-brand">

          <div className="fleet-navbar-title">
            FleetFlow
          </div>


          <div className="fleet-navbar-subtitle">
            Fleet Management & Logistics Platform
          </div>

        </div>

      </div>


      {/* =================================================
          RIGHT
      ================================================= */}

      <div className="fleet-navbar-right">


        {/* TIME */}

        {!isMobile && (

          <div className="fleet-navbar-time">

            {currentTime}

          </div>

        )}


        {/* =================================================
            NOTIFICATION BUTTON
        ================================================= */}

        <button
          type="button"
          className="fleet-notification-btn"
          onClick={() =>
            navigate("/notifications")
          }
          title="Notifications"
        >

          <FaBell />


          {/* Show badge ONLY when unread > 0 */}

          {notificationCount > 0 && (

            <span className="fleet-notification-badge">

              {notificationCount}

            </span>

          )}

        </button>


        {/* =================================================
            USER
        ================================================= */}

        <div className="fleet-navbar-user">


          <div className="fleet-navbar-avatar">

            <FaUserCircle />

          </div>


          {!isMobile && (

            <div>

              <div className="fleet-navbar-user-name">

                Welcome {name}

              </div>


              <div className="fleet-navbar-user-role">

                {role === "Admin"
                  ? "Administrator"
                  : role}

              </div>

            </div>

          )}


          {!isMobile && (

            <FaChevronDown
              className="fleet-navbar-arrow"
            />

          )}

        </div>

      </div>

    </nav>

  );

}


export default Navbar;