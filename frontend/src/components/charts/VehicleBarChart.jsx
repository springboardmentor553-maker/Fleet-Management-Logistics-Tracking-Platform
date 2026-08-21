import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from "recharts";

function VehicleBarChart({ data }) {

    return (

        <ResponsiveContainer width="100%" height={320}>

            <BarChart data={data}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="status" />

                <YAxis />

                <Tooltip />

                <Bar
                    dataKey="count"
                    fill="#2563EB"
                    radius={[8,8,0,0]}
                />

            </BarChart>

        </ResponsiveContainer>

    );

}

export default VehicleBarChart;