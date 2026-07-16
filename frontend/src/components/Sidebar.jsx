import { NavLink } from "react-router-dom";
import navigation from "../data/navigation";

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 w-72 h-screen bg-slate-900 text-white p-6 flex flex-col overflow-y-auto">

      {/* Logo */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-wide">FleetFlow</h1>
        <p className="text-slate-400 text-sm mt-1">
          Fleet Management Platform
        </p>
      </div>

      {/* Navigation */}
      <div className="space-y-8">
        {navigation.map((section) => (
          <div key={section.title}>
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">
              {section.title}
            </h2>

            <div className="space-y-2">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

    </aside>
  );
}

export default Sidebar;