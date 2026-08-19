import { useNavigate } from "react-router-dom";

function Navbar({ onMenuClick }) {
  const navigate = useNavigate();

  const role = localStorage.getItem("role") || "User";
  const email = localStorage.getItem("email") || "";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    navigate("/");
  };

  const firstLetter = role.charAt(0).toUpperCase();

  return (
    <header className="h-24 w-full px-6 lg:px-8 flex items-center justify-between bg-[#03181b]/90 backdrop-blur-xl border-b border-teal-900/60 min-w-0">

      {/* ================= LEFT SIDE ================= */}

      <div className="flex items-center gap-4 min-w-0 shrink-0">

        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-10 h-10 flex-shrink-0 rounded-xl bg-[#0a2b30] hover:bg-teal-900/60 text-teal-50 text-xl transition"
          aria-label="Open navigation menu"
        >
          ☰
        </button>

        {/* Logo Icon */}
        <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-900/30">
          🚚
        </div>

        {/* Logo Text */}
        <div className="min-w-0">

          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent truncate">
            FleetFlow
          </h1>

          <p className="text-xs text-teal-200/50 truncate">
            Fleet Management System
          </p>

        </div>

      </div>


      {/* ================= RIGHT SIDE ================= */}

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">

        {/* System Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-400/20 shrink-0">

          <span className="w-2 h-2 bg-teal-300 rounded-full animate-pulse"></span>

          <span className="text-sm text-teal-300 whitespace-nowrap">
            System Online
          </span>

        </div>


        {/* User */}
        <button
          onClick={() => navigate("/profile")}
          className="hidden md:flex items-center gap-2 lg:gap-3 text-left hover:bg-[#0a2b30] px-2 lg:px-3 py-2 rounded-xl transition shrink-0 min-w-0"
        >

          {/* Avatar */}
          <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-[#03181b] font-bold">
            {firstLetter}
          </div>

          {/* User Information */}
          <div className="min-w-0">

            <p className="text-sm text-teal-50 font-medium truncate max-w-[100px]">
              {role}
            </p>

            <p className="text-xs text-teal-200/50 truncate max-w-[130px]">
              {email}
            </p>

          </div>

        </button>


        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-2 shrink-0 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-400/20 hover:border-teal-300/40 text-teal-300 hover:text-teal-100 px-3 lg:px-4 py-2 rounded-xl transition-all duration-200"
        >

          <span>↪</span>

          <span className="hidden sm:inline">
            Logout
          </span>

        </button>

      </div>

    </header>
  );
}

export default Navbar;