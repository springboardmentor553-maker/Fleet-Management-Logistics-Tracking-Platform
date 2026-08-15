import {
    FaSearch,
    FaTimes,
} from "react-icons/fa";

import "./Shipment.css";


function ShipmentSearch({
    search,
    setSearch,
}) {

    const clearSearch = () => {
        setSearch("");
    };


    return (

        <div className="shipment-search-wrapper">

            <div className="shipment-search-box">

                <FaSearch
                    className="shipment-search-icon"
                />


                <input
                    type="text"
                    placeholder="Search by tracking number, sender, receiver, location or status..."
                    value={search}
                    onChange={(event) =>
                        setSearch(
                            event.target.value
                        )
                    }
                    className="search-input"
                    aria-label="Search shipments"
                />


                {search && (

                    <button
                        type="button"
                        className="clear-search-btn"
                        onClick={clearSearch}
                        aria-label="Clear search"
                    >
                        <FaTimes />
                    </button>

                )}

            </div>


            {search && (

                <div className="search-result-label">

                    Searching for:{" "}

                    <strong>
                        "{search}"
                    </strong>

                </div>

            )}

        </div>

    );
}


export default ShipmentSearch;