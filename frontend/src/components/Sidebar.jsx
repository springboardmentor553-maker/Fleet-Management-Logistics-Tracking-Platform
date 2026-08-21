import {
    Link,
    useLocation
} from "react-router-dom";

import {
    FaTachometerAlt,
    FaTruck,
    FaUsers,
    FaBoxOpen,
    FaRoute,
    FaGasPump,
    FaTools,
    FaBell,
    FaClipboardList,
    FaChartBar,
    FaChartLine,
    FaChartPie,
    FaMapMarkedAlt,
    FaSignOutAlt,
    FaUserCheck,
    FaMapMarkerAlt
} from "react-icons/fa";

import "../styles/sidebar.css";


function Sidebar() {

    const location = useLocation();

    const role = (
        localStorage.getItem("role") || "user"
    )
        .toLowerCase()
        .trim();


    // =====================================================
    // LOGOUT
    // =====================================================

    const logout = () => {

        localStorage.clear();

        window.location.href = "/";

    };


    // =====================================================
    // ADMIN MENU
    // =====================================================

    const adminMenu = [

        {
            title: "MAIN",

            items: [

                {
                    path: "/admin",
                    icon: <FaTachometerAlt />,
                    label: "Dashboard"
                }

            ]
        },


        {
            title: "MANAGEMENT",

            items: [

                {
                    path: "/vehicles",
                    icon: <FaTruck />,
                    label: "Vehicles"
                },

                {
                    path: "/drivers",
                    icon: <FaUsers />,
                    label: "Drivers"
                },

                {
                    path: "/driver-assignments",
                    icon: <FaUserCheck />,
                    label: "Driver Assignment"
                },

                {
                    path: "/driver-attendance",
                    icon: <FaUserCheck />,
                    label: "Driver Attendance"
                },

                {
                    path: "/shipments",
                    icon: <FaBoxOpen />,
                    label: "Shipments"
                },

                {
                    path: "/trips",
                    icon: <FaRoute />,
                    label: "Trips"
                },

                {
                    path: "/fuel",
                    icon: <FaGasPump />,
                    label: "Fuel"
                },

                {
                    path: "/maintenance",
                    icon: <FaTools />,
                    label: "Maintenance"
                },

                {
                    path: "/maintenance-alerts",
                    icon: <FaBell />,
                    label: "Maintenance Alerts"
                },

                {
                    path: "/maintenance-reports",
                    icon: <FaClipboardList />,
                    label: "Maintenance Reports"
                }

            ]
        },


        {
            title: "TRACKING",

            items: [

                {
                    path: "/maps",
                    icon: <FaMapMarkedAlt />,
                    label: "Maps"
                },

                {
                    path: "/live-tracking",
                    icon: <FaMapMarkerAlt />,
                    label: "Live Tracking"
                }

            ]
        },


        {
            title: "ANALYTICS",

            items: [

                {
                    path: "/analytics",
                    icon: <FaChartBar />,
                    label: "Dashboard Analytics"
                },

                {
                    path: "/fleet-analytics",
                    icon: <FaChartPie />,
                    label: "Fleet Analytics"
                },

                {
                    path: "/fuel-analytics",
                    icon: <FaChartLine />,
                    label: "Fuel Analytics"
                },

                {
                    path: "/operations-analytics",
                    icon: <FaChartBar />,
                    label: "Operations Analytics"
                }

            ]
        },


        {
            title: "ADMINISTRATION",

            items: [

                {
                    path: "/audit-logs",
                    icon: <FaClipboardList />,
                    label: "Audit Logs"
                }

            ]
        }

    ];


    // =====================================================
    // MANAGER MENU
    // =====================================================

    const managerMenu = [

        {
            title: "MAIN",

            items: [

                {
                    path: "/manager-dashboard",
                    icon: <FaTachometerAlt />,
                    label: "Dashboard"
                }

            ]
        },


        {
            title: "OPERATIONS",

            items: [

                {
                    path: "/vehicles",
                    icon: <FaTruck />,
                    label: "Vehicles"
                },

                {
                    path: "/drivers",
                    icon: <FaUsers />,
                    label: "Drivers"
                },

                {
                    path: "/driver-assignments",
                    icon: <FaUserCheck />,
                    label: "Driver Assignment"
                },

                {
                    path: "/shipments",
                    icon: <FaBoxOpen />,
                    label: "Shipments"
                },

                {
                    path: "/trips",
                    icon: <FaRoute />,
                    label: "Trips"
                },

                {
                    path: "/fuel",
                    icon: <FaGasPump />,
                    label: "Fuel"
                },

                {
                    path: "/maintenance",
                    icon: <FaTools />,
                    label: "Maintenance"
                },

                {
                    path: "/maintenance-alerts",
                    icon: <FaBell />,
                    label: "Alerts"
                },

                {
                    path: "/maintenance-reports",
                    icon: <FaClipboardList />,
                    label: "Reports"
                }

            ]
        },


        {
            title: "TRACKING",

            items: [

                {
                    path: "/maps",
                    icon: <FaMapMarkedAlt />,
                    label: "Maps"
                },

                {
                    path: "/live-tracking",
                    icon: <FaMapMarkerAlt />,
                    label: "Live Tracking"
                }

            ]
        },


        {
            title: "ANALYTICS",

            items: [

                {
                    path: "/analytics",
                    icon: <FaChartBar />,
                    label: "Dashboard Analytics"
                },

                {
                    path: "/fleet-analytics",
                    icon: <FaChartPie />,
                    label: "Fleet Analytics"
                },

                {
                    path: "/fuel-analytics",
                    icon: <FaChartLine />,
                    label: "Fuel Analytics"
                },

                {
                    path: "/operations-analytics",
                    icon: <FaChartBar />,
                    label: "Operations"
                }

            ]
        }

    ];


    // =====================================================
    // USER / DRIVER MENU
    // =====================================================

    const userMenu = [

        {
            title: "MAIN",

            items: [

                {
                    path: "/dashboard",
                    icon: <FaTachometerAlt />,
                    label: "Dashboard"
                }

            ]
        },


        {
            title: "OPERATIONS",

            items: [

                {
                    path: "/shipments",
                    icon: <FaBoxOpen />,
                    label: "Shipments"
                },

                {
                    path: "/trips",
                    icon: <FaRoute />,
                    label: "Trips"
                }

            ]
        },


        {
            title: "TRACKING",

            items: [

                {
                    path: "/maps",
                    icon: <FaMapMarkedAlt />,
                    label: "Maps"
                },

                {
                    path: "/live-tracking",
                    icon: <FaMapMarkerAlt />,
                    label: "Live Tracking"
                }

            ]
        }

    ];


    // =====================================================
    // SELECT MENU BASED ON ROLE
    // =====================================================

    let menu = userMenu;

    if (role === "admin") {

        menu = adminMenu;

    } else if (role === "manager") {

        menu = managerMenu;

    }


    // =====================================================
    // UI
    // =====================================================

    return (

        <aside className="sidebar">

            {/* =================================================
                LOGO
            ================================================= */}

            <div className="logo">

                <h2>
                    🚚 FleetFlow
                </h2>

                <span>
                    {role.toUpperCase()}
                </span>

            </div>


            {/* =================================================
                MENU
            ================================================= */}

            <div className="menu">

                {menu.map((section) => (

                    <div
                        key={section.title}
                    >

                        <p className="section-title">
                            {section.title}
                        </p>


                        {section.items.map((item) => {

                            const isActive =
                                location.pathname === item.path ||
                                (
                                    item.path === "/live-tracking" &&
                                    location.pathname.startsWith("/tracking/")
                                );


                            return (

                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={
                                        isActive
                                            ? "active"
                                            : ""
                                    }
                                >

                                    <span>
                                        {item.icon}
                                    </span>

                                    {item.label}

                                </Link>

                            );

                        })}

                    </div>

                ))}

            </div>


            {/* =================================================
                LOGOUT
            ================================================= */}

            <button
                className="logout-btn"
                onClick={logout}
            >

                <FaSignOutAlt />

                Logout

            </button>

        </aside>

    );

}


export default Sidebar;