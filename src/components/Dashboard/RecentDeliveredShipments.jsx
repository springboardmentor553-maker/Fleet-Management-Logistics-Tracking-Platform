import { useEffect, useState } from "react";
import api from "../../services/api";

function RecentDeliveredShipments() {

    const [shipments, setShipments] = useState([]);

    useEffect(() => {
        fetchDeliveredShipments();
    }, []);

    const fetchDeliveredShipments = async () => {

        try {

            const response = await api.get("/shipments");

            const delivered = response.data
                .filter(
                    shipment =>
                        shipment.current_status === "Delivered"
                )
                .slice(-5)
                .reverse();

            setShipments(delivered);

        } catch (error) {

            console.log(error);

        }

    };

    return (

        <div className="dashboard-table">

            <h2>Recent Delivered Shipments</h2>

            <table>

                <thead>

                    <tr>

                        <th>Tracking</th>

                        <th>Sender</th>

                        <th>Receiver</th>

                    </tr>

                </thead>

                <tbody>

                    {shipments.map((shipment) => (

                        <tr key={shipment.id}>

                            <td>{shipment.tracking_number}</td>

                            <td>{shipment.sender_name}</td>

                            <td>{shipment.receiver_name}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}

export default RecentDeliveredShipments;