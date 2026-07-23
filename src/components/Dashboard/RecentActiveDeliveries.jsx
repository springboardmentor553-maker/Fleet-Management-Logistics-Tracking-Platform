import { useEffect, useState } from "react";
import api from "../../services/api";

function RecentActiveDeliveries() {

    const [shipments, setShipments] = useState([]);

    useEffect(() => {

        load();

    }, []);

    const load = async () => {

        const res = await api.get("/shipments");

        setShipments(

            res.data.filter(

                s =>

                    s.current_status === "Assigned" ||

                    s.current_status === "Picked Up" ||

                    s.current_status === "In Transit" ||

                    s.current_status === "Out for Delivery"

            ).slice(-5).reverse()

        );

    };

    return (

        <div className="dashboard-table">

            <h3>Recent Active Deliveries</h3>

            <table>

                <thead>

                    <tr>

                        <th>Tracking</th>

                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    {shipments.map((item)=>(

                        <tr key={item.id}>

                            <td>{item.tracking_number}</td>

                            <td>{item.current_status}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}

export default RecentActiveDeliveries;