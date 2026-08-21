import {
    FaSearch,
    FaBell,
    FaUserCircle,
    FaSignOutAlt
} from "react-icons/fa";

import "../styles/navbar.css";

function Navbar() {

    const logout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    return (

        <header className="navbar">

            <div className="navbar-left">

                <h2>FleetFlow Dashboard</h2>

            </div>

            <div className="navbar-center">

                <div className="search-box">

                    <FaSearch className="search-icon" />

                    <input
                        type="text"
                        placeholder="Search vehicles, drivers, trips..."
                    />

                </div>

            </div>

            <div className="navbar-right">

                <button className="icon-btn">

                    <FaBell />

                    <span className="notification-badge">3</span>

                </button>

                <div className="profile">

                    <FaUserCircle size={34} />

                    <div>

                        <strong>
                            {localStorage.getItem("role") || "Admin"}
                        </strong>

                        <p>Fleet Manager</p>

                    </div>

                </div>

                <button
                    className="logout-btn-top"
                    onClick={logout}
                >

                    <FaSignOutAlt />

                    Logout

                </button>

            </div>

        </header>

    );

}

export default Navbar;