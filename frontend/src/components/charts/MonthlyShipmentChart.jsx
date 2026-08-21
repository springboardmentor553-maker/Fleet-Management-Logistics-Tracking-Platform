import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from "recharts";

function MonthlyShipmentChart({ data }) {

    return (

        <ResponsiveContainer width="100%" height={350}>

            <LineChart data={data}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip />

                <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10B981"
                    strokeWidth={3}
                />

            </LineChart>

        </ResponsiveContainer>

    );

}

export default MonthlyShipmentChart;