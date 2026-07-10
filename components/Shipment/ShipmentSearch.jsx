import "./Shipment.css";

function ShipmentSearch({ search, setSearch }) {

    return (

        <div className="search-container">

            <input
                type="text"
                placeholder="Search Shipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
            />

        </div>

    );

}

export default ShipmentSearch;