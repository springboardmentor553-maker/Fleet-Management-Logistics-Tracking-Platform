import "./FleetChart.css";

import {

BarChart,

Bar,

XAxis,

YAxis,

Tooltip,

CartesianGrid,

ResponsiveContainer

} from "recharts";

function FleetChart({ dashboard }) {

const data=[

{

name:"Drivers",

count:dashboard.total_drivers

},

{

name:"Vehicles",

count:dashboard.total_vehicles

},

{

name:"Shipments",

count:dashboard.total_shipments

}

];

return(

<div className="chart-container">

<h2>Fleet Statistics</h2>

<ResponsiveContainer width="100%" height={320}>

<BarChart data={data}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="name"/>

<YAxis/>

<Tooltip/>

<Bar

dataKey="count"

fill="#1976d2"

/>

</BarChart>

</ResponsiveContainer>

</div>

);

}

export default FleetChart;