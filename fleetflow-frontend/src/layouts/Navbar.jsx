import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark bg-primary shadow"
      style={{
        height: "60px",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <div className="container-fluid">

        <h3 className="text-white m-0">
          FleetFlow
        </h3>

        <button
          className="btn btn-light"
          onClick={logout}
        >
          Logout
        </button>

      </div>
    </nav>
  );
}

export default Navbar;