import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6"
];

function ShipmentPieChart({ data }) {

    return (

        <ResponsiveContainer width="100%" height={320}>

            <PieChart>

                <Pie
                    data={data}
                    dataKey="count"
                    nameKey="status"
                    outerRadius={110}
                    label
                >

                    {data.map((entry, index) => (

                        <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                        />

                    ))}

                </Pie>

                <Tooltip />

                <Legend />

            </PieChart>

        </ResponsiveContainer>

    );

}

export default ShipmentPieChart;