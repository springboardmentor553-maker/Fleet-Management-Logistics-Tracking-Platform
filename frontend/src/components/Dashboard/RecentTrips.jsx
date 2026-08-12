import { useEffect, useState } from "react";
import api from "../../services/api";

function RecentTrips() {

    const [trips, setTrips] = useState([]);

    useEffect(() => {

        fetchTrips();

    }, []);

    const fetchTrips = async () => {

        const response = await api.get("/trips");

        setTrips(response.data.slice(-5).reverse());

    };

    return (

        <div className="dashboard-table">

            <h2>Recent Trips</h2>

            <table>

                <thead>

                    <tr>

                        <th>ID</th>

                        <th>Pickup</th>

                        <th>Destination</th>

                    </tr>

                </thead>

                <tbody>

                    {trips.map((trip) => (

                        <tr key={trip.id}>

                            <td>{trip.id}</td>

                            <td>{trip.pickup_location}</td>

                            <td>{trip.destination}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}

export default RecentTrips;