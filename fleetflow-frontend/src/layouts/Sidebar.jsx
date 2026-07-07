import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div
      className="sidebar p-3"
      
      style={{
  width: "240px",
  minHeight: "100vh",
  position: "fixed",
  left: 0,
  top: "56px",
  borderRight: "0",
  boxShadow: "none"
}}
    >
      <h3 className="text-center mb-4">FleetFlow</h3>

      <ul className="nav flex-column">

        <li className="nav-item mb-2">
          <Link className="nav-link text-white" to="/dashboard">
            Dashboard
          </Link>
        </li>

        <li className="nav-item mb-2">
          <Link className="nav-link text-white" to="/drivers">
            Drivers
          </Link>
        </li>

        <li className="nav-item mb-2">
          <Link className="nav-link text-white" to="/vehicles">
            Vehicles
          </Link>
        </li>

        <li className="nav-item mb-2">
          <Link className="nav-link text-white" to="/shipments">
            Shipments
          </Link>
        </li>

        <li className="nav-item mb-2">
          <Link className="nav-link text-white" to="/reports">
            Reports
          </Link>
        </li>

      </ul>
    </div>
  );
}

export default Sidebar;