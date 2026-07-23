import { useEffect, useState } from "react";
import api from "../../services/api";

function RecentDelayedShipments() {

    const [shipments, setShipments] = useState([]);

    useEffect(() => {
        fetchDelayedShipments();
    }, []);

    const fetchDelayedShipments = async () => {

        try {

            const response = await api.get("/shipments");

            const delayed = response.data
                .filter(
                    shipment =>
                        shipment.current_status === "Delayed"
                )
                .slice(-5)
                .reverse();

            setShipments(delayed);

        } catch (error) {

            console.log(error);

        }

    };

    return (

        <div className="dashboard-table">

            <h2>Recent Delayed Shipments</h2>

            <table>

                <thead>

                    <tr>

                        <th>Tracking</th>

                        <th>Pickup</th>

                        <th>Destination</th>

                    </tr>

                </thead>

                <tbody>

                    {shipments.map((shipment) => (

                        <tr key={shipment.id}>

                            <td>{shipment.tracking_number}</td>

                            <td>{shipment.pickup_location}</td>

                            <td>{shipment.delivery_location}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}

export default RecentDelayedShipments;