import { useEffect, useState } from "react";

import api from "../../services/api";

import "./Dashboard.css";

function RecentDrivers(){

const[drivers,setDrivers]=useState([]);

useEffect(()=>{

fetchDrivers();

},[]);

const fetchDrivers=async()=>{

try{

const response=await api.get("/drivers");

setDrivers(response.data);

}

catch(error){

console.log(error);

}

};

return(

<div className="dashboard-table">

<h2>Recent Drivers</h2>

<table>

<thead>

<tr>

<th>ID</th>

<th>Name</th>

<th>Phone</th>

<th>Status</th>

</tr>

</thead>

<tbody>

{

drivers.slice(0,5).map((driver)=>(

<tr key={driver.id}>

<td>{driver.id}</td>

<td>{driver.name}</td>

<td>{driver.phone}</td>

<td>{driver.status}</td>

</tr>

))

}

</tbody>

</table>

</div>

);

}

export default RecentDrivers;