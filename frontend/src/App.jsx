import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";


import Layout from "./components/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";


import Register from "./pages/Register";
import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import DriverDashboard from "./pages/DriverDashboard";

import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Shipments from "./pages/Shipments";
import Reports from "./pages/reports";
import LiveTracking from "./pages/Livetracking";
import RoutesPage from "./pages/routes";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Fuel from "./pages/Fuel";
import Analytics from "./pages/Analytics";


import DriverLiveTracking from "./pages/DriverLiveTracking";
import DriverMaintenance from "./pages/DriverMaintenance";
import DriverFuel from "./pages/DriverFuel";
import DriverShipments from "./pages/DriverShipments";


function App() {

  return (

    <BrowserRouter>

      <Routes>


        {/* ==================================================
            LOGIN
        ================================================== */}

        <Route
          path="/"
          element={<Login />}
        />


        {/* ==================================================
            REGISTER
        ================================================== */}

        <Route
          path="/register"
          element={<Register />}
        />


        {/* ==================================================
            FLEET / MANAGER DASHBOARD
        ================================================== */}

        <Route
          path="/dashboard"
          element={

            <ProtectedRoute
              allowedRoles={[
                "admin",
                "fleet manager",
                "dispatcher",
              ]}
            >

              <Layout>
                <Dashboard />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            DRIVER DASHBOARD
        ================================================== */}

        <Route
          path="/driver-dashboard"
          element={

            <ProtectedRoute
              allowedRoles={[
                "driver",
              ]}
            >

              <Layout>
                <DriverDashboard />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            EXISTING LIVE TRACKING
        ================================================== */}

        <Route
          path="/tracking"
          element={

            <ProtectedRoute
              allowedRoles={[
                "admin",
                "fleet manager",
                "dispatcher",
              ]}
            >

              <Layout>
                <LiveTracking />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            DRIVER LIVE TRACKING
        ================================================== */}

        <Route
          path="/driver-tracking"
          element={

            <ProtectedRoute
              allowedRoles={[
                "driver",
              ]}
            >

              <Layout>
                <DriverLiveTracking />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            VEHICLES
        ================================================== */}

        <Route
          path="/vehicles"
          element={

            <ProtectedRoute
              allowedRoles={[
                "admin",
                "fleet manager",
                "dispatcher",
              ]}
            >

              <Layout>
                <Vehicles />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            DRIVERS
        ================================================== */}

        <Route
          path="/drivers"
          element={

            <ProtectedRoute
              allowedRoles={[
                "admin",
                "fleet manager",
                "dispatcher",
              ]}
            >

              <Layout>
                <Drivers />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            EXISTING SHIPMENTS
        ================================================== */}

        <Route
          path="/shipments"
          element={

            <ProtectedRoute
              allowedRoles={[
                "admin",
                "fleet manager",
                "dispatcher",
              ]}
            >

              <Layout>
                <Shipments />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            DRIVER SHIPMENTS
        ================================================== */}

        <Route
          path="/driver-shipments"
          element={

            <ProtectedRoute
              allowedRoles={[
                "driver",
              ]}
            >

              <Layout>
                <DriverShipments />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            TRIPS
        ================================================== */}

        <Route
          path="/trips"
          element={

            <ProtectedRoute
              allowedRoles={[
                "admin",
                "fleet manager",
                "dispatcher",
              ]}
            >

              <Layout>
                <Trips />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            ROUTES
        ================================================== */}

        <Route
          path="/routes"
          element={

            <ProtectedRoute
              allowedRoles={[
                "admin",
                "fleet manager",
                "dispatcher",
              ]}
            >

              <Layout>
                <RoutesPage />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            EXISTING FUEL
        ================================================== */}

        <Route
          path="/fuel"
          element={

            <ProtectedRoute
              allowedRoles={[
                "admin",
                "fleet manager",
                "dispatcher",
              ]}
            >

              <Layout>
                <Fuel />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            DRIVER FUEL
        ================================================== */}

        <Route
          path="/driver-fuel"
          element={

            <ProtectedRoute
              allowedRoles={[
                "driver",
              ]}
            >

              <Layout>
                <DriverFuel />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            EXISTING MAINTENANCE
        ================================================== */}

        <Route
          path="/maintenance"
          element={

            <ProtectedRoute
              allowedRoles={[
                "admin",
                "fleet manager",
              ]}
            >

              <Layout>
                <Maintenance />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            DRIVER MAINTENANCE
        ================================================== */}

        <Route
          path="/driver-maintenance"
          element={

            <ProtectedRoute
              allowedRoles={[
                "driver",
              ]}
            >

              <Layout>
                <DriverMaintenance />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            REPORTS
        ================================================== */}

        <Route
          path="/reports"
          element={

            <ProtectedRoute
              allowedRoles={[
                "admin",
                "fleet manager",
                "dispatcher",
              ]}
            >

              <Layout>
                <Reports />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            ALERTS
        ================================================== */}

        <Route
          path="/alerts"
          element={

            <ProtectedRoute
              allowedRoles={[
                "admin",
                "fleet manager",
                "dispatcher",
              ]}
            >

              <Layout>
                <Alerts />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            SETTINGS
        ================================================== */}

        <Route
          path="/settings"
          element={

            <ProtectedRoute>

              <Layout>
                <Settings />
              </Layout>

            </ProtectedRoute>

          }
        />


        {/* ==================================================
            ANALYTICS
        ================================================== */}

        <Route
          path="/analytics"
          element={

            <ProtectedRoute
              allowedRoles={[
                "admin",
                "fleet manager",
                "dispatcher",
              ]}
            >

              <Layout>
                <Analytics />
              </Layout>

            </ProtectedRoute>

          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;