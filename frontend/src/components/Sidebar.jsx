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
        bg-[#03181b]
        border-r border-teal-900/60
        text-white
        flex flex-col
        z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
    >

      {/* ================= LOGO ================= */}

      <div className="h-24 flex-shrink-0 flex items-center justify-center border-b border-teal-900/60 relative">

        <div className="text-center">

          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
            🚚 FleetFlow
          </h1>

          <p className="text-xs text-teal-200/50 mt-1">
            Fleet Management
          </p>

        </div>

        {/* Mobile Close Button */}

        <button
          onClick={onClose}
          className="absolute right-3 top-3 md:hidden w-8 h-8 rounded-lg bg-[#0a2b30] text-teal-100/70 hover:text-white hover:bg-teal-500/20 transition"
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
                  ? "bg-teal-500/20 text-teal-300 border border-teal-400/30 shadow-[0_0_15px_rgba(20,184,166,0.12)]"
                  : "text-teal-100/70 hover:text-teal-300 hover:bg-teal-500/10"
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

      <div className="border-t border-teal-900/60 p-3">

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
                ? "bg-teal-500/20 text-teal-300 border border-teal-400/30"
                : "text-teal-100/70 hover:text-teal-300 hover:bg-teal-500/10"
            }
            `
          }
        >

          {/* Avatar */}

          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-r from-teal-400 to-cyan-300 flex items-center justify-center text-[#03181b] font-bold">
            {userEmail.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}

          <div className="min-w-0">

            <p className="text-sm font-semibold text-white truncate">
              {displayRole}
            </p>

            <div className="flex items-center gap-1.5">

              <span className="w-2 h-2 rounded-full bg-teal-400"></span>

              <span className="text-xs text-teal-200/50">
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