import { FaBell, FaUserCircle } from "react-icons/fa";

function Navbar() {
  return (
    <header className="bg-white h-20 shadow-sm flex items-center justify-between px-8">

      <div>
        <h1 className="text-2xl font-bold text-darkblue-800">
          Logistics Management Platform
        </h1>

        <p className="text-sm text-slate-500">
          Welcome back, Admin
        </p>
      </div>

      <div className="flex items-center gap-6">

        <button className="text-slate-600 hover:text-blue-600">
          <FaBell size={20} />
        </button>

        <div className="flex items-center gap-2">

          <FaUserCircle
            size={34}
            className="text-slate-700"
          />

          <div>

            <p className="font-semibold">
              Admin
            </p>

            <p className="text-sm text-slate-500">
              Fleet Manager
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}

export default Navbar;