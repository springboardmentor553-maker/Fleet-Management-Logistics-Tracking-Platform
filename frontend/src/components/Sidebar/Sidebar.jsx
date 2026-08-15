import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

import { FaMapMarkedAlt } from "react-icons/fa";

import {
    FaBars,
    FaTimes,
    FaHome,
    FaUserTie,
    FaTruck,
    FaBoxOpen,
    FaRoute,
    FaBell,
    FaUserCircle,
    FaCog,
} from "react-icons/fa";

import "./Sidebar.css";

function Sidebar() {

    const [sidebarOpen, setSidebarOpen] =
        useState(false);

    const [userRole, setUserRole] =
        useState("user");


    // ==========================================================
    // LOAD CURRENT USER
    // ==========================================================

    useEffect(() => {

        const loadUser = () => {

            try {

                /*
                 * IMPORTANT:
                 *
                 * First check sessionStorage because the current
                 * login system stores the authenticated user there.
                 *
                 * localStorage is kept as a fallback so existing
                 * functionality is not broken.
                 */

                let storedUser =
                    sessionStorage.getItem("user");


                if (!storedUser) {

                    storedUser =
                        localStorage.getItem("user");
                }


                if (!storedUser) {

                    setUserRole("user");

                    return;
                }


                const user =
                    JSON.parse(
                        storedUser
                    );


                console.log(
                    "FleetFlow Sidebar User:",
                    user
                );


                /*
                 * Normalize the role.
                 *
                 * "Admin" -> "admin"
                 * "User"  -> "user"
                 */

                const role =
                    String(
                        user?.role || "user"
                    )
                        .trim()
                        .toLowerCase();


                console.log(
                    "FleetFlow Sidebar Role:",
                    role
                );


                setUserRole(
                    role
                );

            } catch (error) {

                console.error(
                    "Unable to read user:",
                    error
                );

                setUserRole(
                    "user"
                );
            }
        };


        // Load immediately
        loadUser();


        // Existing storage functionality
        window.addEventListener(
            "storage",
            loadUser
        );


        /*
         * Custom event support.
         *
         * This allows Sidebar to update immediately
         * if the login page dispatches a user update event.
         */

        window.addEventListener(
            "fleetflow-user-updated",
            loadUser
        );


        return () => {

            window.removeEventListener(
                "storage",
                loadUser
            );


            window.removeEventListener(
                "fleetflow-user-updated",
                loadUser
            );
        };

    }, []);


    // ==========================================================
    // MOBILE
    // ==========================================================

    const closeSidebar = () => {

        if (
            window.innerWidth <= 768
        ) {

            setSidebarOpen(false);
        }
    };


    useEffect(() => {

        const handleResize = () => {

            if (
                window.innerWidth > 768
            ) {

                setSidebarOpen(false);
            }
        };


        window.addEventListener(
            "resize",
            handleResize
        );


        return () => {

            window.removeEventListener(
                "resize",
                handleResize
            );
        };

    }, []);


    // ==========================================================
    // MENU DEFINITIONS
    // ==========================================================

    const allMenus = [

        {
            name: "Dashboard",
            path: "/dashboard",
            icon: <FaHome />,
            roles: [
                "admin",
                "user",
            ],
        },

        {
            name: "Drivers",
            path: "/drivers",
            icon: <FaUserTie />,
            roles: [
                "admin",
            ],
        },

        {
            name: "Vehicles",
            path: "/vehicles",
            icon: <FaTruck />,
            roles: [
                "admin",
            ],
        },

        {
            name: "Shipments",
            path: "/shipments",
            icon: <FaBoxOpen />,
            roles: [
                "admin",
                "user",
            ],
        },

        {
            name: "Trips",
            path: "/trips",
            icon: <FaRoute />,
            roles: [
                "admin",
                "user",
            ],
        },

        {
            name: "Live Map",
            path: "/map",
            icon: <FaMapMarkedAlt />,
            roles: [
                "admin",
                "user",
            ],
        },

        {
            name: "Notifications",
            path: "/notifications",
            icon: <FaBell />,
            roles: [
                "admin",
                "user",
            ],
        },

        {
            name: "Profile",
            path: "/profile",
            icon: <FaUserCircle />,
            roles: [
                "admin",
                "user",
            ],
        },

        {
            name: "Settings",
            path: "/settings",
            icon: <FaCog />,
            roles: [
                "admin",
            ],
        },
    ];


    // ==========================================================
    // FILTER MENUS
    // ==========================================================

    const menus =
        allMenus.filter(
            (item) =>
                item.roles.includes(
                    userRole
                )
        );


    // ==========================================================
    // DEBUG
    // ==========================================================

    console.log(
        "FleetFlow Sidebar menus:",
        menus.map(
            (menu) =>
                menu.name
        )
    );


    // ==========================================================
    // JSX
    // ==========================================================

    return (

        <>

            {/* Mobile Menu Button */}

            <button
                className="menu-btn"
                onClick={() =>
                    setSidebarOpen(true)
                }
            >
                <FaBars />
            </button>


            {/* Overlay */}

            {sidebarOpen && (

                <div
                    className="sidebar-overlay"
                    onClick={() =>
                        setSidebarOpen(false)
                    }
                />

            )}


            {/* Sidebar */}

            <aside
                className={`sidebar ${
                    sidebarOpen
                        ? "show-sidebar"
                        : ""
                }`}
            >

                {/* Close Button */}

                <button
                    className="close-btn"
                    onClick={() =>
                        setSidebarOpen(false)
                    }
                >
                    <FaTimes />
                </button>


                {/* Logo */}

                <div className="sidebar-logo">

                    <h2>
                        FleetFlow
                    </h2>

                    <p>
                        Fleet Management
                    </p>

                </div>


                {/* Navigation */}

                <nav className="sidebar-menu">

                    <ul>

                        {menus.map(
                            (item) => (

                                <li
                                    key={
                                        item.path
                                    }
                                >

                                    <NavLink
                                        to={
                                            item.path
                                        }
                                        onClick={
                                            closeSidebar
                                        }
                                        className={({
                                            isActive,
                                        }) =>
                                            isActive
                                                ? "active"
                                                : ""
                                        }
                                    >

                                        <span className="menu-icon">

                                            {
                                                item.icon
                                            }

                                        </span>


                                        <span className="menu-text">

                                            {
                                                item.name
                                            }

                                        </span>

                                    </NavLink>

                                </li>

                            )
                        )}

                    </ul>

                </nav>


                {/* Footer */}

                <div className="sidebar-footer">

                    <small>
                        FleetFlow v1.0
                    </small>

                </div>

            </aside>

        </>
    );
}


export default Sidebar;