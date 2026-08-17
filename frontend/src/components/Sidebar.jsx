import { NavLink } from "react-router-dom";

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const userRole = localStorage.getItem("role") || "User";
  const userEmail = localStorage.getItem("email") || "User";

  const normalizedRole = userRole
    .toLowerCase()
    .replace(/\s+/g, "_");

  const roleNames = {
    administrator: "Administrator",
    fleet_manager: "Fleet Manager",
    driver: "Driver",
    dispatcher: "Dispatcher",
  };

  const displayRole =
    roleNames[normalizedRole] || userRole;

  // ================= MENU ITEMS =================

  const menuItems = [
    {
      path: "/dashboard",
      icon: "📊",
      label: "Dashboard",
      roles: [
        "administrator",
        "fleet_manager",
        "driver",
        "dispatcher",
      ],
    },

    {
      path: "/vehicles",
      icon: "🚛",
      label: "Vehicles",
      roles: [
        "administrator",
        "fleet_manager",
        "driver",
        "dispatcher",
      ],
    },

    {
      path: "/drivers",
      icon: "👨‍✈️",
      label: "Drivers",
      roles: [
        "administrator",
        "fleet_manager",
        "driver",
        "dispatcher",
      ],
    },

    {
      path: "/driver-assignments",
      icon: "📋",
      label: "Driver Assignments",
      roles: [
        "administrator",
        "fleet_manager",
        "driver",
        "dispatcher",
      ],
    },

    {
      path: "/driver-attendance",
      icon: "📅",
      label: "Driver Attendance",
      roles: [
        "administrator",
        "fleet_manager",
        "driver",
        "dispatcher",
      ],
    },

    {
      path: "/driver-performance",
      icon: "⭐",
      label: "Driver Performance",
      roles: [
        "administrator",
        "fleet_manager",
        "driver",
        "dispatcher",
      ],
    },

    {
      path: "/shipments",
      icon: "📦",
      label: "Shipments",
      roles: [
        "administrator",
        "fleet_manager",
        "driver",
        "dispatcher",
      ],
    },

    {
      path: "/trips",
      icon: "🛣️",
      label: "Trips",
      roles: [
        "administrator",
        "fleet_manager",
        "driver",
        "dispatcher",
      ],
    },

    {
      path: "/live-tracking",
      icon: "📍",
      label: "Live Tracking",
      roles: [
        "administrator",
        "fleet_manager",
        "driver",
        "dispatcher",
      ],
    },

    {
      path: "/route-generation",
      icon: "🗺️",
      label: "Route Generation",
      roles: [
        "administrator",
        "fleet_manager",
        "driver",
        "dispatcher",
      ],
    },

    {
      path: "/fuel-records",
      icon: "⛽",
      label: "Fuel Records",
      roles: [
        "administrator",
        "fleet_manager",
        "driver",
        "dispatcher",
      ],
    },

    {
      path: "/maintenance",
      icon: "🔧",
      label: "Maintenance",
      roles: [
        "administrator",
        "fleet_manager",
        "dispatcher",
      ],
    },

    {
      path: "/maintenance-alerts",
      icon: "🔔",
      label: "Maintenance Alerts",
      roles: [
        "administrator",
        "fleet_manager",
        "dispatcher",
      ],
    },

    {
      path: "/reports",
      icon: "📈",
      label: "Reports",
      roles: [
        "administrator",
        "fleet_manager",
        "dispatcher",
      ],
    },
  ];

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(normalizedRole)
  );

  return (
    <aside
      className={`
        fixed left-0 top-0
        w-64 h-screen
        bg-slate-950
        border-r border-slate-800
        text-white
        flex flex-col
        z-50
        transition-transform duration-300 ease-in-out

        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
    >

      {/* ================= LOGO ================= */}

      <div className="h-24 flex-shrink-0 flex items-center justify-center border-b border-slate-800 relative">

        <div className="text-center">

          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            🚚 FleetFlow
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Fleet Management
          </p>

        </div>

        {/* Mobile Close Button */}

        <button
          onClick={onClose}
          className="absolute right-3 top-3 md:hidden w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
        >
          ✕
        </button>

      </div>

      {/* ================= NAVIGATION ================= */}

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">

        {visibleMenuItems.map((item) => (

          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `
              group flex items-center gap-3
              px-4 py-3
              rounded-xl
              transition-all duration-200

              ${
                isActive
                  ? "bg-gradient-to-r from-blue-600/80 to-indigo-600/70 text-white shadow-lg shadow-blue-900/30 border border-blue-400/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/80"
              }
              `
            }
          >

            <span className="text-xl w-7 text-center">
              {item.icon}
            </span>

            <span className="text-sm font-medium">
              {item.label}
            </span>

          </NavLink>

        ))}

      </nav>

      {/* ================= PROFILE ================= */}

      <div className="border-t border-slate-800 p-3">

        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            `
            flex items-center gap-3
            px-4 py-3
            rounded-xl
            transition-all duration-200

            ${
              isActive
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800/80"
            }
            `
          }
        >

          {/* Avatar */}

          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {userEmail.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}

          <div className="min-w-0">

            <p className="text-sm font-semibold text-white truncate">
              {displayRole}
            </p>

            <div className="flex items-center gap-1.5">

              <span className="w-2 h-2 rounded-full bg-green-400"></span>

              <span className="text-xs text-slate-500">
                Online
              </span>

            </div>

          </div>

        </NavLink>

      </div>

    </aside>
  );
}

export default Sidebar;