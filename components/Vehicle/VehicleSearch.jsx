import "./Vehicle.css";

function VehicleSearch({ search, setSearch }) {

    return (

        <div className="search-container">

            <input
                type="text"
                placeholder="Search Vehicle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
            />

        </div>

    );

}

export default VehicleSearch;