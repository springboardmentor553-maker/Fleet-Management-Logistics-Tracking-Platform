import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Shipments from "./pages/Shipments";
import Trips from "./pages/Trips";
import Drivers from "./pages/Drivers";
import Maps from "./pages/Maps";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                <Route path="/" element={<Login />} />

                <Route path="/register" element={<Register />} />

                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/shipments" element={<Shipments />} />
                <Route path="/trips" element={<Trips />} />
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/maps" element={<Maps />} />
            </Routes>

        </BrowserRouter>
    );
}

export default App;