import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#03181b] via-[#062126] to-[#0a2b30]">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="md:ml-64 min-h-screen min-w-0">

        {/* Navbar */}
        <Navbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>

      </div>

    </div>
  );
}

export default Layout;