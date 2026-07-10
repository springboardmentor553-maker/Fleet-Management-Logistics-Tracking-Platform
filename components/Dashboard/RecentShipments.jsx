import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Dashboard.css";

function RecentShipments() {

    const [shipments, setShipments] = useState([]);

    useEffect(() => {
        fetchShipments();
    }, []);

    const fetchShipments = async () => {

        try {

            const response = await api.get("/shipments");

            setShipments(response.data);

        }

        catch (error) {

            console.log(error);

        }

    };

    return (

        <div className="dashboard-table">

            <h2>Recent Shipments</h2>

            <table>

                <thead>

                    <tr>

                        <th>ID</th>
                        <th>Shipment</th>
                        <th>Source</th>
                        <th>Destination</th>

                    </tr>

                </thead>

                <tbody>

                    {shipments.slice(0,5).map((shipment)=>(

                        <tr key={shipment.id}>

                            <td>{shipment.id}</td>

                            <td>{shipment.shipment_name}</td>

                            <td>{shipment.source}</td>

                            <td>{shipment.destination}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}

export default RecentShipments;