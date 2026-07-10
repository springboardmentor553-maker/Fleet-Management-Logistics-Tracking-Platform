import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Dashboard.css";

function RecentVehicles() {

    const [vehicles, setVehicles] = useState([]);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {

        try {

            const response = await api.get("/vehicles");

            setVehicles(response.data);

        }

        catch (error) {

            console.log(error);

        }

    };

    return (

        <div className="dashboard-table">

            <h2>Recent Vehicles</h2>

            <table>

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>Vehicle No</th>
                        <th>Type</th>
                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    {vehicles.slice(0,5).map((vehicle)=>(

                        <tr key={vehicle.id}>

                            <td>{vehicle.id}</td>

                            <td>{vehicle.vehicle_number}</td>

                            <td>{vehicle.vehicle_type}</td>

                            <td>{vehicle.status}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}

export default RecentVehicles;