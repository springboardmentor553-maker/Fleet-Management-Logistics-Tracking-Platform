import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";


const API_URL =
"https://fleetflow-backend-90o5.onrender.com/analytics";



function FuelAnalyticsPage() {


    const [fuelRecords, setFuelRecords] = useState([]);

    const [summary, setSummary] = useState({

    total_fuel_consumed: 0,
    total_fuel_cost: 0,
    average_consumption: 0,
    highest_vehicle: "-",
    lowest_vehicle: "-"

});


    const [loading, setLoading] = useState(true);



    useEffect(() => {

        fetchFuelAnalytics();

    }, []);




    const fetchFuelAnalytics = async () => {


        try {


            const response =
            await axios.get(API_URL + "/fuel");



            setSummary({
    total_fuel_consumed: response.data.total_fuel_consumed || 0,
    total_fuel_cost: response.data.total_fuel_cost || 0,
    average_consumption: response.data.average_fuel_consumption || 0,
    highest_vehicle: response.data.highest_fuel_usage_vehicle || "-",
    lowest_vehicle: response.data.lowest_fuel_usage_vehicle || "-"
});

setFuelRecords(response.data.fuel_records || []);


        }

        catch(error){


            console.error(error);

            alert(
                "Unable to load fuel analytics"
            );


        }

        finally{


            setLoading(false);


        }


    };





    if(loading){


        return (

        <>

        <Navbar />

        <div
  className="container mt-4"
  style={{
    marginLeft: "280px",
    padding: "20px",
    width: "calc(100% - 300px)"
  }}
>

            <h4>
                Loading Fuel Analytics...
            </h4>

        </div>

        </>

        );


    }





    return (

    <>


    <Navbar />


    <div
  className="container mt-4"
  style={{
    marginLeft: "280px",
    padding: "20px",
    width: "calc(100% - 300px)"
  }}
>


        <h2 className="mb-4">

            Fuel Monitoring Analytics

        </h2>





        <div className="row mb-4">

    {/* Total Fuel Consumed */}
    <div className="col-md-4">

        <div className="card shadow text-center border-primary">

            <div className="card-body">

                <h5>
                    Total Fuel Consumed
                </h5>

                <h2 className="text-primary">
                    {summary.total_fuel_consumed} L
                </h2>

            </div>

        </div>

    </div>


    {/* Total Fuel Cost */}
    <div className="col-md-4">

        <div className="card shadow text-center border-success">

            <div className="card-body">

                <h5>
                    Total Fuel Cost
                </h5>

                <h2 className="text-success">
                    ₹ {summary.total_fuel_cost}
                </h2>

            </div>

        </div>

    </div>


    {/* Average Consumption */}
    <div className="col-md-4">

        <div className="card shadow text-center border-warning">

            <div className="card-body">

                <h5>
                    Average Consumption
                </h5>

                <h2 className="text-warning">
                    {summary.average_consumption} km/L
                </h2>

            </div>

        </div>

    </div>


    {/* Highest Fuel Usage Vehicle */}
    <div className="col-md-4">

        <div className="card shadow text-center border-danger">

            <div className="card-body">

                <h5>
                    Highest Fuel Usage Vehicle
                </h5>

                <h4 className="text-danger">
                    {summary.highest_vehicle}
                </h4>

            </div>

        </div>

    </div>



    {/* Lowest Fuel Usage Vehicle */}
    <div className="col-md-4">

        <div className="card shadow text-center border-info">

            <div className="card-body">

                <h5>
                    Lowest Fuel Usage Vehicle
                </h5>

                <h4 className="text-info">
                    {summary.lowest_vehicle}
                </h4>

            </div>

        </div>

    </div>


</div>







        <div className="card shadow">


            <div className="card-header bg-dark text-white">


                Fuel Consumption Records


            </div>




            <div className="card-body table-responsive">


            <table className="table table-bordered table-hover">


            <thead className="table-dark">


            <tr>


                <th>
                    Vehicle ID
                </th>


                <th>
                    Fuel Date
                </th>


                <th>
                    Fuel Amount
                </th>


                <th>
                    Cost
                </th>


                <th>
                    Mileage
                </th>


            </tr>


            </thead>





            <tbody>



            {
            fuelRecords.length === 0 ?


            (

            <tr>

                <td
                colSpan="5"
                className="text-center"
                >

                No Fuel Records Found

                </td>


            </tr>


            )


            :


            fuelRecords.map(

            (fuel,index)=>(


            <tr key={index}>


                <td>
                    {fuel.vehicle_id}
                </td>


                <td>
                    {fuel.fuel_date}
                </td>


                <td>
                    {fuel.fuel_amount} L
                </td>


                <td>
                    ₹ {fuel.fuel_cost}
                </td>


                <td>
                    {fuel.mileage}
                </td>


            </tr>


            )


            )


            }



            </tbody>


            </table>


            </div>


        </div>




    </div>


    </>

    );


}



export default FuelAnalyticsPage;