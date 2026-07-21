import "../styles/statcard.css";

function StatCard({ title, value, color }) {
    return (
        <div
            className="stat-card"
            style={{ borderTop: `6px solid ${color}` }}
        >
            <h3>{title}</h3>
            <h1>{value}</h1>
        </div>
    );
}

export default StatCard;