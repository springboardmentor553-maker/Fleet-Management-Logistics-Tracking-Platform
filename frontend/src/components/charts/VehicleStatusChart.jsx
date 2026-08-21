import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

function VehicleStatusChart({ data }) {

    return (

        <div
            style={{
                width: "100%",
                height: 350,
                background: "#fff",
                borderRadius: "10px",
                padding: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,.1)"
            }}
        >

            <h3>Vehicle Status</h3>

            <ResponsiveContainer width="100%" height="90%">

                <BarChart data={data}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="status" />

                    <YAxis />

                    <Tooltip />

                    <Bar
                        dataKey="count"
                        fill="#2563eb"
                    />

                </BarChart>

            </ResponsiveContainer>

        </div>

    );
}

export default VehicleStatusChart;