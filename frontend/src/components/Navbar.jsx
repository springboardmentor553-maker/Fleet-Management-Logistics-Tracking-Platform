import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-heading">Logistics Portal</h1>
      </div>
      <div className="navbar-right">
        <div className="user-info">
          <span className="user-avatar">👤</span>
          <div className="user-details">
            <span className="user-name">{user.name}</span>
            <span className="user-email">{user.email}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default Navbar;
