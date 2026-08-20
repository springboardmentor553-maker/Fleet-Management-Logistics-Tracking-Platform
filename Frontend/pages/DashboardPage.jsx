import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getDashboard } from "../services/dashboardService";
import { jwtDecode } from "jwt-decode";

export default function DashboardPage() {
const token = localStorage.getItem("token");

let userRole = "";

if (token) {
  const decoded = jwtDecode(token);
  userRole = decoded.role;
  console.log("Logged User Role:", userRole);
}

  const [loading, setLoading] = useState(true);


  const [summary, setSummary] = useState({

  vehicles: {
    total: 0,
    available: 0,
    active: 0,
    maintenance: 0,
    inactive: 0,
  },

  drivers: {
    total: 0,
    active: 0,
  },

  routes: {
    total: 0,
  },

  shipments: {
    total: 0,
    active_deliveries: 0,
    delivered: 0,
    delayed: 0,
  },

  maintenance: {
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
  },

  analytics: {
    delivery_success: 0,
    fuel_consumption: 0,
  }

});



  useEffect(() => {

    loadDashboard();

  }, []);



  const loadDashboard = async () => {

  try {

    const data = await getDashboard();

    setSummary(prev => ({
      ...prev,
      ...data,

      maintenance: {
        ...prev.maintenance,
        ...(data.maintenance || {})
      },

      analytics: {
    ...prev.analytics,
    ...(data.operational_analytics || {})
}

    }));

  }

  catch(error){

    console.log(
      "Dashboard Error:",
      error
    );

  }

  finally{

    setLoading(false);

  }

};




  const cardStyle = {

    width:"220px",

    padding:"20px",

    borderRadius:"12px",

    color:"white",

    textAlign:"center",

    fontSize:"18px",

    boxShadow:"0 4px 8px rgba(0,0,0,0.2)"

  };




  if(loading){

    return (

      <>

      <Navbar/>

      <h2 style={{padding:"30px"}}>
        Loading Dashboard...
      </h2>

      </>

    );

  }





  return (

    <>

    <Navbar/>


    <div
  className="container-fluid"
  style={{
    marginLeft: "260px",
    width: "calc(100% - 260px)",
    padding: "25px",
    background: "#f4f6f9",
    minHeight: "100vh",
  }}
>


    <h1>
      Fleet Monitoring Dashboard
    </h1>




    <div
    style={{
      display:"flex",
      gap:"20px",
      flexWrap:"wrap",
      marginTop:"30px"
    }}
    >
    

    {
(userRole === "Admin" || userRole === "Fleet Manager") && (


    <>
    <Card 
    title="Total Vehicles"
    value={summary.vehicles.total}
    color="#1976d2"
    style={cardStyle}
    />



    <Card 
    title="Available Vehicles"
    value={summary.vehicles.available}
    color="green"
    style={cardStyle}
    />



    <Card 
    title="Active Vehicles"
    value={summary.vehicles.active}
    color="orange"
    style={cardStyle}
    />



    <Card 
    title="Maintenance Vehicles"
    value={summary.vehicles.maintenance}
    color="red"
    style={cardStyle}
    />
    </>

)
}

    {
userRole === "Admin" && (

<>

    <Card 
    title="Total Drivers"
    value={summary.drivers.total}
    color="#8e44ad"
    style={cardStyle}
    />



    <Card 
    title="Active Drivers"
    value={summary.drivers.active}
    color="#16a085"
    style={cardStyle}
    />
    </>

)
}



    {
(userRole === "Admin" || 
 userRole === "Fleet Manager" || 
 userRole === "Dispatcher") && (

<Card 
title="Routes"
value={summary.routes.total}
color="#34495e"
style={cardStyle}
/>

)
}



    {userRole !== "Driver" && (
  <Card
    title="Total Shipments"
    value={summary.shipments.total}
    color="#e67e22"
    style={cardStyle}
  />
)}



    <Card 
    title="Active Deliveries"
    value={summary.shipments.active_deliveries}
    color="#3498db"
    style={cardStyle}
    />



    <Card 
    title="Delivered"
    value={summary.shipments.delivered}
    color="#27ae60"
    style={cardStyle}
    />



    <Card 
    title="Delayed"
    value={summary.shipments.delayed}
    color="#e74c3c"
    style={cardStyle}
    />



    </div>




    {/* Milestone 3 Analytics */}


    <div
    style={{
      marginTop:"40px",
      display:"flex",
      gap:"20px"
    }}
    >


      {
(userRole === "Admin" || userRole === "Fleet Manager") && (

<div className="card p-4">

<h3>
Maintenance Summary
</h3>

<p>
Pending:
{summary.maintenance.pending || 0}
</p>

<p>
Completed:
{summary.maintenance.completed || 0}
</p>

</div>

)
}

      {
(userRole === "Admin" || userRole === "Fleet Manager") && (


      <div className="card p-4">


        <h3>
          Operational Analytics
        </h3>


        <p>
          Delivery Success:
          {" "}
          {summary.analytics?.delivery_success || 0}%
        </p>


        <p>
          Fuel Consumption:
          {" "}
          {summary.analytics?.fuel_consumption || 0}
        </p>


      </div>
      )
}


    </div>



    </div>


    </>

  );

}




function Card({
  title,
  value,
  color,
  style
}){


return (

<div
style={{
  ...style,
  background:color
}}
>

<h3>
{title}
</h3>


<h1>
{value}
</h1>


</div>

);


}