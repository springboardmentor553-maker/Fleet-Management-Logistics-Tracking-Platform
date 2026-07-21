import "../styles/navbar.css";

function Navbar() {

    return (

        <div className="navbar">

            <h2>Dashboard</h2>

            <button
                onClick={()=>{
                    localStorage.removeItem("token");
                    window.location="/";
                }}
            >
                Logout
            </button>

        </div>

    );
}

export default Navbar;