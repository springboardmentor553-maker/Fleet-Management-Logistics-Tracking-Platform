// ==========================================================
// SHIPMENT STATUS CONSTANTS
// ==========================================================

export const SHIPMENT_STATUS = {

    CREATED: "Created",

    ASSIGNED: "Assigned",

    PICKED_UP: "Picked Up",

    IN_TRANSIT: "In Transit",

    OUT_FOR_DELIVERY: "Out for Delivery",

    DELIVERED: "Delivered",

    DELAYED: "Delayed",

    CANCELLED: "Cancelled",

};


// ==========================================================
// STATUS LIST
// ==========================================================

export const shipmentStatuses = [

    SHIPMENT_STATUS.CREATED,

    SHIPMENT_STATUS.ASSIGNED,

    SHIPMENT_STATUS.PICKED_UP,

    SHIPMENT_STATUS.IN_TRANSIT,

    SHIPMENT_STATUS.OUT_FOR_DELIVERY,

    SHIPMENT_STATUS.DELIVERED,

    SHIPMENT_STATUS.DELAYED,

    SHIPMENT_STATUS.CANCELLED,

];


// ==========================================================
// NORMALIZE STATUS
// ==========================================================

export const normalizeShipmentStatus = (
    status
) => {

    if (!status) {

        return SHIPMENT_STATUS.CREATED;

    }


    const value =
        String(status)
            .trim()
            .toLowerCase();


    switch (value) {

        case "created":

            return SHIPMENT_STATUS.CREATED;


        case "assigned":

            return SHIPMENT_STATUS.ASSIGNED;


        case "picked up":

        case "picked_up":

        case "pickedup":

            return SHIPMENT_STATUS.PICKED_UP;


        case "in transit":

        case "in_transit":

        case "intransit":

            return SHIPMENT_STATUS.IN_TRANSIT;


        case "out for delivery":

        case "out_for_delivery":

        case "outfordelivery":

            return SHIPMENT_STATUS.OUT_FOR_DELIVERY;


        case "delivered":

            return SHIPMENT_STATUS.DELIVERED;


        case "delayed":

            return SHIPMENT_STATUS.DELAYED;


        case "cancelled":

        case "canceled":

            return SHIPMENT_STATUS.CANCELLED;


        default:

            return SHIPMENT_STATUS.CREATED;

    }

};


// ==========================================================
// GET STATUS CSS CLASS
// ==========================================================

export const getShipmentStatusClass = (
    status
) => {

    const normalizedStatus =
        normalizeShipmentStatus(status);


    switch (normalizedStatus) {

        case SHIPMENT_STATUS.CREATED:

            return "status created";


        case SHIPMENT_STATUS.ASSIGNED:

            return "status assigned";


        case SHIPMENT_STATUS.PICKED_UP:

            return "status picked-up";


        case SHIPMENT_STATUS.IN_TRANSIT:

            return "status in-transit";


        case SHIPMENT_STATUS.OUT_FOR_DELIVERY:

            return "status out-for-delivery";


        case SHIPMENT_STATUS.DELIVERED:

            return "status delivered";


        case SHIPMENT_STATUS.DELAYED:

            return "status delayed";


        case SHIPMENT_STATUS.CANCELLED:

            return "status cancelled";


        default:

            return "status created";

    }

};


// ==========================================================
// STATUS DISPLAY TEXT
// ==========================================================

export const getShipmentStatusText = (
    status
) => {

    return normalizeShipmentStatus(status);

};