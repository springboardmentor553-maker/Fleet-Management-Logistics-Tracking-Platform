import {
  FaChartPie,
  FaMapMarkedAlt,
  FaTruck,
  FaUserTie,
  FaBox,
  FaRoute,
  FaTools,
  FaChartBar,
  FaBell,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

const navigation = [
  {
    title: "Operations",
    items: [
      { name: "Dashboard", icon: FaChartPie, path: "/dashboard" },
      { name: "Live Tracking", icon: FaMapMarkedAlt, path: "/tracking" },
      { name: "Vehicles", icon: FaTruck, path: "/vehicles" },
      { name: "Drivers", icon: FaUserTie, path: "/drivers" },
      { name: "Shipments", icon: FaBox, path: "/shipments" },
    ],
  },
  {
    title: "Management",
    items: [
      { name: "Routes", icon: FaRoute, path: "/routes" },
      { name: "Maintenance", icon: FaTools, path: "/maintenance" },
      { name: "Reports", icon: FaChartBar, path: "/reports" },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Alerts", icon: FaBell, path: "/alerts" },
      { name: "Settings", icon: FaCog, path: "/settings" },
      { name: "Logout", icon: FaSignOutAlt, path: "/" },
    ],
  },
];

export default navigation;