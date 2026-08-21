import {
  FaChartPie,
  FaMapMarkedAlt,
  FaTruck,
  FaUserTie,
  FaBox,
  FaRoute,
  FaTools,
  FaChartBar,
  FaChartLine,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaGasPump,
} from "react-icons/fa";


const navigation = [

  {
    title: "Operations",

    items: [

      {
        name: "Dashboard",
        icon: FaChartPie,
        path: "/dashboard",
        roles: [
          "admin",
          "fleet manager",
          "dispatcher",
        ],
      },

      {
        name: "Driver Dashboard",
        icon: FaChartPie,
        path: "/driver-dashboard",
        roles: [
          "driver",
        ],
      },

      {
        name: "Live Tracking",
        icon: FaMapMarkedAlt,
        path: "/tracking",
        roles: [
          "admin",
          "fleet manager",
          "dispatcher",
        ],
      },

      {
        name: "My Live Tracking",
        icon: FaMapMarkedAlt,
        path: "/driver-tracking",
        roles: [
          "driver",
        ],
      },

      {
        name: "Vehicles",
        icon: FaTruck,
        path: "/vehicles",
        roles: [
          "admin",
          "fleet manager",
          "dispatcher",
        ],
      },

      {
        name: "Drivers",
        icon: FaUserTie,
        path: "/drivers",
        roles: [
          "admin",
          "fleet manager",
          "dispatcher",
        ],
      },

      {
        name: "Shipments",
        icon: FaBox,
        path: "/shipments",
        roles: [
          "admin",
          "fleet manager",
          "dispatcher",
        ],
      },

      {
        name: "My Shipments",
        icon: FaBox,
        path: "/driver-shipments",
        roles: [
          "driver",
        ],
      },

      {
        name: "Trips",
        icon: FaRoute,
        path: "/trips",
        roles: [
          "admin",
          "fleet manager",
          "dispatcher",
        ],
      },

    ],
  },


  {
    title: "Management",

    items: [

      {
        name: "Routes",
        icon: FaRoute,
        path: "/routes",
        roles: [
          "admin",
          "fleet manager",
          "dispatcher",
        ],
      },

      {
        name: "Maintenance",
        icon: FaTools,
        path: "/maintenance",
        roles: [
          "admin",
          "fleet manager",
        ],
      },

      {
        name: "My Maintenance",
        icon: FaTools,
        path: "/driver-maintenance",
        roles: [
          "driver",
        ],
      },

      {
        name: "Fuel",
        icon: FaGasPump,
        path: "/fuel",
        roles: [
          "admin",
          "fleet manager",
          "dispatcher",
        ],
      },

      {
        name: "My Fuel",
        icon: FaGasPump,
        path: "/driver-fuel",
        roles: [
          "driver",
        ],
      },

      {
        name: "Analytics",
        icon: FaChartLine,
        path: "/analytics",
        roles: [
          "admin",
          "fleet manager",
          "dispatcher",
        ],
      },

      {
        name: "Reports",
        icon: FaChartBar,
        path: "/reports",
        roles: [
          "admin",
          "fleet manager",
          "dispatcher",
        ],
      },

    ],
  },


  {
    title: "System",

    items: [

      {
        name: "Alerts",
        icon: FaBell,
        path: "/alerts",
        roles: [
          "admin",
          "fleet manager",
          "dispatcher",
        ],
      },

      {
        name: "Settings",
        icon: FaCog,
        path: "/settings",
      },

      {
        name: "Logout",
        icon: FaSignOutAlt,
        path: "/",
      },

    ],
  },

];


export default navigation;