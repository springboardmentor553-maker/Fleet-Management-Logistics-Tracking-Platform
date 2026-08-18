import { NavLink } from "react-router-dom";

import {
  FaTachometerAlt,
  FaTruck,
  FaUserTie,
  FaBoxOpen,
  FaChartBar,
  FaUsers,
  FaRoute,
  FaCog,
  FaSignOutAlt,
  FaTruckMoving,
  FaGasPump,
  FaTools,
  FaUserCheck,
  FaChartPie,
  FaBell,
  FaTimes,
} from "react-icons/fa";


function Sidebar({
  isOpen,
  isMobile,
  onClose,
}) {


  // =====================================================
  // ROLE
  // =====================================================

  const role =
    localStorage.getItem("role") || "Admin";


  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");

    window.location.href = "/";

  };


  // =====================================================
  // NAVIGATION CLASS
  // =====================================================

  const linkClass = ({ isActive }) => {

    return `fleet-sidebar-link ${
      isActive
        ? "fleet-sidebar-active"
        : ""
    }`;

  };


  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleNavigation = () => {

    if (isMobile) {

      onClose();

    }

  };


  return (

    <>


      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {isMobile && isOpen && (

        <div
          className="fleet-sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />

      )}


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`fleet-sidebar ${
          isOpen
            ? "fleet-sidebar-open"
            : "fleet-sidebar-closed"
        }`}
      >


        {/* =================================================
            LOGO
        ================================================= */}

        <div className="fleet-logo">


          <div className="fleet-logo-icon">

            <FaTruck />

          </div>


          <div className="fleet-logo-text">

            <div className="fleet-logo-title">
              FleetFlow
            </div>


            <div className="fleet-logo-subtitle">
              Fleet Management
            </div>

          </div>


          {/* =================================================
              CLOSE X
          ================================================= */}

          <button
            type="button"
            className="fleet-sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
            title="Close sidebar"
          >

            <FaTimes />

          </button>


        </div>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="fleet-navigation">


          <NavLink
            to="/dashboard"
            className={linkClass}
            onClick={handleNavigation}
          >
            <FaTachometerAlt />
            <span>Dashboard</span>
          </NavLink>


          <NavLink
            to="/vehicles"
            className={linkClass}
            onClick={handleNavigation}
          >
            <FaTruck />
            <span>Vehicles</span>
          </NavLink>


          <NavLink
            to="/drivers"
            className={linkClass}
            onClick={handleNavigation}
          >
            <FaUserTie />
            <span>Drivers</span>
          </NavLink>


          <NavLink
            to="/shipments"
            className={linkClass}
            onClick={handleNavigation}
          >
            <FaBoxOpen />
            <span>Shipments</span>
          </NavLink>


          <NavLink
            to="/trips"
            className={linkClass}
            onClick={handleNavigation}
          >
            <FaTruckMoving />
            <span>Trips</span>
          </NavLink>


          <NavLink
            to="/reports"
            className={linkClass}
            onClick={handleNavigation}
          >
            <FaChartBar />
            <span>Reports</span>
          </NavLink>


          <NavLink
            to="/maintenance"
            className={linkClass}
            onClick={handleNavigation}
          >
            <FaTools />
            <span>Maintenance</span>
          </NavLink>


          <NavLink
            to="/fuel"
            className={linkClass}
            onClick={handleNavigation}
          >
            <FaGasPump />
            <span>Fuel</span>
          </NavLink>


          <NavLink
            to="/notifications"
            className={linkClass}
            onClick={handleNavigation}
          >
            <FaBell />
            <span>Notifications</span>
          </NavLink>


          <NavLink
            to="/driver-assignment"
            className={linkClass}
            onClick={handleNavigation}
          >
            <FaUserCheck />
            <span>Driver Assignment</span>
          </NavLink>


          <NavLink
            to="/analytics"
            className={linkClass}
            onClick={handleNavigation}
          >
            <FaChartPie />
            <span>Analytics</span>
          </NavLink>


          {role === "Admin" && (

            <NavLink
              to="/users"
              className={linkClass}
              onClick={handleNavigation}
            >
              <FaUsers />
              <span>Users</span>
            </NavLink>

          )}


          <NavLink
            to="/route-planner"
            className={linkClass}
            onClick={handleNavigation}
          >
            <FaRoute />
            <span>Route Planner</span>
          </NavLink>


          <NavLink
            to="/settings"
            className={linkClass}
            onClick={handleNavigation}
          >
            <FaCog />
            <span>Settings</span>
          </NavLink>


        </nav>


        {/* =================================================
            BOTTOM
        ================================================= */}

        <div className="fleet-sidebar-bottom">


          <div className="fleet-user-card">


            <div className="fleet-user-avatar">

              {(
                localStorage.getItem("name") ||
                "A"
              )
                .charAt(0)
                .toUpperCase()}

            </div>


            <div>

              <div className="fleet-user-name">

                {localStorage.getItem("name") ||
                  "Admin"}

              </div>


              <div className="fleet-user-role">

                {role === "Admin"
                  ? "Administrator"
                  : role}

              </div>

            </div>


          </div>


          <button
            type="button"
            className="fleet-logout"
            onClick={logout}
          >

            <FaSignOutAlt />

            <span>
              Logout
            </span>

          </button>


        </div>


      </aside>

    </>

  );

}


export default Sidebar;