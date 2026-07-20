// import { useEffect, useState } from "react";

// import ShipmentForm from "../components/Shipment/ShipmentForm";
// import ShipmentSearch from "../components/Shipment/ShipmentSearch";
// import ShipmentTable from "../components/Shipment/ShipmentTable";

// import api from "../services/api";

// import "../components/Shipment/Shipment.css";

// function Shipments() {

//     const [shipments, setShipments] = useState([]);

//     const [selectedShipment, setSelectedShipment] = useState(null);

//     const [search, setSearch] = useState("");

//     useEffect(() => {

//         fetchShipments();

//     }, []);

//     const fetchShipments = async () => {

//         try {

//             const response = await api.get("/shipments");

//             setShipments(response.data);

//         }

//         catch (error) {

//             console.error(error);

//         }

//     };

//     const handleDelete = async (id) => {

//         const confirmDelete = window.confirm(

//             "Are you sure you want to delete this shipment?"

//         );

//         if (!confirmDelete) return;

//         try {

//             await api.delete(`/shipments/${id}`);

//             alert("Shipment Deleted Successfully");

//             fetchShipments();

//         }

//         catch (error) {

//             console.error(error);

//             alert("Unable to delete shipment");

//         }

//     };

//     const filteredShipments = shipments.filter((shipment) =>

//         shipment.shipment_name
//             .toLowerCase()
//             .includes(search.toLowerCase()) ||

//         shipment.source
//             .toLowerCase()
//             .includes(search.toLowerCase()) ||

//         shipment.destination
//             .toLowerCase()
//             .includes(search.toLowerCase())

//     );

//     return (

//         <div className="shipment-page">

//             <div className="shipment-header">

//                 <div>

//                     <h1>

//                         Shipment Management

//                     </h1>

//                     <p>

//                         Manage all shipments in your logistics platform.

//                     </p>

//                 </div>

//             </div>

//             <ShipmentSearch

//                 search={search}

//                 setSearch={setSearch}

//             />

//             <ShipmentForm

//                 selectedShipment={selectedShipment}

//                 fetchShipments={fetchShipments}

//                 setSelectedShipment={setSelectedShipment}

//             />

//             <ShipmentTable

//                 shipments={filteredShipments}

//                 onEdit={setSelectedShipment}

//                 onDelete={handleDelete}

//             />

//         </div>

//     );

// }

// export default Shipments;
import { useEffect, useState } from "react";

import api from "../services/api";

import ShipmentForm from "../components/Shipment/ShipmentForm";
import ShipmentTable from "../components/Shipment/ShipmentTable";

import "../components/Shipment/Shipment.css";

function Shipments() {

    const [shipments, setShipments] = useState([]);

    const [selectedShipment, setSelectedShipment] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        fetchShipments();

    }, []);

    const fetchShipments = async () => {

        try {

            setLoading(true);

            const response = await api.get("/shipments");

            setShipments(response.data);

        }

        catch (error) {

            console.error(error);

            alert("Failed to load shipments.");

        }

        finally {

            setLoading(false);

        }

    };

    const handleEdit = (shipment) => {

        setSelectedShipment(shipment);

        window.scrollTo({

            top: 0,

            behavior: "smooth",

        });

    };

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(

            "Are you sure you want to delete this shipment?"

        );

        if (!confirmDelete) return;

        try {

            await api.delete(`/shipments/${id}`);

            alert("Shipment Deleted Successfully");

            fetchShipments();

        }

        catch (error) {

            console.error(error);

            alert("Failed to delete shipment.");

        }

    };

    return (

        <div className="shipment-page">

            <ShipmentForm

                selectedShipment={selectedShipment}

                fetchShipments={fetchShipments}

                setSelectedShipment={setSelectedShipment}

            />

            <div style={{ marginTop: "35px" }}>

                {

                    loading

                    ?

                    (

                        <div className="loading">

                            Loading Shipments...

                        </div>

                    )

                    :

                    (

                        <ShipmentTable

                            shipments={shipments}

                            onEdit={handleEdit}

                            onDelete={handleDelete}

                        />

                    )

                }

            </div>

        </div>

    );

}

export default Shipments;