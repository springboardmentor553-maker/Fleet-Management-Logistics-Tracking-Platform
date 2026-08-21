import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import "../styles/layout.css";

function Layout({ children }) {
    return (
        <div className="app-layout">

            <Sidebar />

            <div className="main-content">

                <Navbar />

                <div className="page-content">
                    {children}
                </div>

            </div>

        </div>
    );
}

export default Layout;