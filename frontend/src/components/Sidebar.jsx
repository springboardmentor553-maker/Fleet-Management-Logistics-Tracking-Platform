import { Link, useLocation } from "react-router-dom";

import {
    FaTachometerAlt,
    FaTruck,
    FaUsers,
    FaBoxOpen,
    FaRoute,
    FaGasPump,
    FaTools,
    FaMapMarkedAlt,
    FaSignOutAlt
} from "react-icons/fa";

import "../styles/sidebar.css";

function Sidebar() {

    const location = useLocation();

    const menuItems = [
        {
            path: "/dashboard",
            name: "Dashboard",
            icon: <FaTachometerAlt />
        },
        {
            path: "/vehicles",
            name: "Vehicles",
            icon: <FaTruck />
        },
        {
            path: "/drivers",
            name: "Drivers",
            icon: <FaUsers />
        },
        {
            path: "/shipments",
            name: "Shipments",
            icon: <FaBoxOpen />
        },
        {
            path: "/trips",
            name: "Trips",
            icon: <FaRoute />
        },
        {
            path: "/fuel",
            name: "Fuel",
            icon: <FaGasPump />
        },
        {
            path: "/maintenance",
            name: "Maintenance",
            icon: <FaTools />
        },
        {
            path: "/maps",
            name: "Maps",
            icon: <FaMapMarkedAlt />
        }
    ];

    const logout = () => {

        localStorage.removeItem("token");

        window.location.href = "/";
    };

    return (

        <div className="sidebar">

            <div className="logo">

                <h2>🚚 FleetFlow</h2>

            </div>

            <nav>

                {

                    menuItems.map((item) => (

                        <Link
                            key={item.path}
                            to={item.path}
                            className={
                                location.pathname === item.path
                                    ? "active"
                                    : ""
                            }
                        >

                            <span className="icon">
                                {item.icon}
                            </span>

                            <span>
                                {item.name}
                            </span>

                        </Link>

                    ))

                }

            </nav>

            <button
                className="logout-btn"
                onClick={logout}
            >

                <FaSignOutAlt />

                <span>Logout</span>

            </button>

        </div>

    );
}

export default Sidebar;