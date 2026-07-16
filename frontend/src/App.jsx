import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Shipments from "./pages/Shipments";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Layout wrapping the sidebar and navbar around protected routes
const GeneralLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content-layout">
        <Navbar />
        <main className="content-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Login />} />

          {/* Protected Area Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<GeneralLayout />}>
              {/* Role Restricted Routes */}
              <Route element={<ProtectedRoute allowedRoles={["Admin", "Fleet Manager"]} />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={["Admin", "Fleet Manager", "Dispatcher"]} />}>
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/shipments" element={<Shipments />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["Admin", "Fleet Manager", "Dispatcher", "Driver"]} />}>
                <Route path="/vehicles" element={<Vehicles />} />
              </Route>

              {/* Accessible to any authenticated role */}
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;