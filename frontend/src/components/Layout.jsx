import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
    return (
        <>
            <Sidebar />
            <Navbar />

            {children}
        </>
    );
}

export default Layout;