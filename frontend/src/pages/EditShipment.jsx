import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function EditShipment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState({
    shipment_type: "",
    weight: "",
    driver_id: "",
    vehicle_id: "",
    eta: "",
    tracking_number: "",
    sender_name: "",
    receiver_name: "",
    pickup_location: "",
    delivery_location: "",
    current_status: "Assigned",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ================= LOAD SHIPMENT =================

  useEffect(() => {
    loadShipment();
  }, [id]);

  const loadShipment = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/shipments/${id}`);

      console.log("Shipment loaded:", res.data);

      setShipment({
        shipment_type: res.data.shipment_type || "",
        weight: res.data.weight ?? "",
        driver_id: res.data.driver_id ?? "",
        vehicle_id: res.data.vehicle_id ?? "",
        eta: res.data.eta || "",
        tracking_number: res.data.tracking_number || "",
        sender_name: res.data.sender_name || "",
        receiver_name: res.data.receiver_name || "",
        pickup_location: res.data.pickup_location || "",
        delivery_location: res.data.delivery_location || "",
        current_status: getStatusValue(
          res.data.current_status
        ),
      });
    } catch (err) {
      console.error(
        "Load shipment error:",
        err.response?.data || err
      );

      showError(err, "Failed to load shipment");
    } finally {
      setLoading(false);
    }
  };

  // ================= STATUS HELPER =================

  const getStatusValue = (status) => {
    if (!status) {
      return "Assigned";
    }

    // If backend returns enum object
    if (typeof status === "object") {
      return (
        status.value ||
        status.name ||
        "Assigned"
      );
    }

    return status;
  };

  // ================= HANDLE CHANGE =================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setShipment((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ================= UPDATE SHIPMENT =================

  const updateShipment = async (e) => {
  e.preventDefault();

  try {
    setSaving(true);

    const params = {
      shipment_type: shipment.shipment_type,
      weight: Number(shipment.weight),
      driver_id: Number(shipment.driver_id),
      vehicle_id: Number(shipment.vehicle_id),
      eta: shipment.eta,
      tracking_number: shipment.tracking_number,
      sender_name: shipment.sender_name,
      receiver_name: shipment.receiver_name,
      pickup_location: shipment.pickup_location,
      delivery_location: shipment.delivery_location,
      current_status: shipment.current_status,
    };

    console.log("Updating shipment:", params);

    const response = await api.put(
      `/shipments/${id}`,
      null,
      {
        params: params,
      }
    );

    console.log("Update successful:", response.data);

    alert("Shipment Updated Successfully");

    navigate("/shipments");

  } catch (err) {
    console.error("Shipment update error:", err);
    console.error("Status:", err.response?.status);
    console.error("Backend error:", err.response?.data);

    const detail = err.response?.data?.detail;

    if (Array.isArray(detail)) {
      alert(
        detail
          .map((item) => {
            const field =
              item.loc?.[item.loc.length - 1] || "";
            return `${field}: ${item.msg}`;
          })
          .join("\n")
      );
    } else if (typeof detail === "string") {
      alert(detail);
    } else if (detail) {
      alert(JSON.stringify(detail));
    } else {
      alert(
        `Failed to update shipment\nHTTP ${
          err.response?.status || "Unknown"
        }`
      );
    }

  } finally {
    setSaving(false);
  }
};
  // ================= ERROR HANDLER =================

  const showError = (err, defaultMessage) => {
    const data = err.response?.data;
    const detail = data?.detail;

    console.log(
      "Full backend error:",
      data
    );

    // FastAPI validation errors
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (item?.loc && item?.msg) {
            const field =
              item.loc[item.loc.length - 1];

            return `${field}: ${item.msg}`;
          }

          if (item?.msg) {
            return item.msg;
          }

          return JSON.stringify(item);
        })
        .join("\n");

      alert(messages || defaultMessage);
      return;
    }

    // Normal backend string
    if (typeof detail === "string") {
      alert(detail);
      return;
    }

    // Object error
    if (
      detail &&
      typeof detail === "object"
    ) {
      alert(
        JSON.stringify(
          detail,
          null,
          2
        )
      );
      return;
    }

    // Response itself is string
    if (typeof data === "string") {
      alert(data);
      return;
    }

    alert(defaultMessage);
  };

  // ================= LOADING =================

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <p className="text-blue-400 text-lg">
            Loading shipment...
          </p>
        </div>
      </Layout>
    );
  }

  // ================= PAGE =================

  return (
    <Layout>

      {/* HEADER */}

      <div className="mb-8">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
          Edit Shipment
        </h1>

        <p className="text-slate-400 mt-2">
          Update shipment information and delivery status
        </p>

      </div>


      {/* FORM */}

      <form
        onSubmit={updateShipment}
        className="bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl p-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* SHIPMENT TYPE */}

          <FormField
            label="Shipment Type"
            name="shipment_type"
            value={shipment.shipment_type}
            placeholder="Enter shipment type"
            onChange={handleChange}
            required
          />


          {/* WEIGHT */}

          <FormField
            label="Weight"
            name="weight"
            type="number"
            value={shipment.weight}
            placeholder="Enter weight"
            onChange={handleChange}
            required
          />


          {/* DRIVER */}

          <FormField
            label="Driver ID"
            name="driver_id"
            type="number"
            value={shipment.driver_id}
            placeholder="Enter driver ID"
            onChange={handleChange}
            required
          />


          {/* VEHICLE */}

          <FormField
            label="Vehicle ID"
            name="vehicle_id"
            type="number"
            value={shipment.vehicle_id}
            placeholder="Enter vehicle ID"
            onChange={handleChange}
            required
          />


          {/* ETA */}

          <FormField
            label="ETA"
            name="eta"
            value={shipment.eta}
            placeholder="Enter ETA"
            onChange={handleChange}
            required
          />


          {/* TRACKING NUMBER */}

          <FormField
            label="Tracking Number"
            name="tracking_number"
            value={shipment.tracking_number}
            placeholder="Enter tracking number"
            onChange={handleChange}
            required
          />


          {/* SENDER */}

          <FormField
            label="Sender Name"
            name="sender_name"
            value={shipment.sender_name}
            placeholder="Enter sender name"
            onChange={handleChange}
            required
          />


          {/* RECEIVER */}

          <FormField
            label="Receiver Name"
            name="receiver_name"
            value={shipment.receiver_name}
            placeholder="Enter receiver name"
            onChange={handleChange}
            required
          />


          {/* PICKUP */}

          <FormField
            label="Pickup Location"
            name="pickup_location"
            value={shipment.pickup_location}
            placeholder="Enter pickup location"
            onChange={handleChange}
            required
          />


          {/* DELIVERY */}

          <FormField
            label="Delivery Location"
            name="delivery_location"
            value={shipment.delivery_location}
            placeholder="Enter delivery location"
            onChange={handleChange}
            required
          />


          {/* STATUS */}

          <div>
  <label className="block text-sm font-medium text-slate-300 mb-2">
    Shipment Status
  </label>

  <select
    name="current_status"
    value={shipment.current_status}
    onChange={handleChange}
    required
    className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
  >
    <option value="Created">
      Created
    </option>

    <option value="Assigned">
      Assigned
    </option>

    <option value="Picked Up">
      Picked Up
    </option>

    <option value="In Transit">
      In Transit
    </option>

    <option value="Out for Delivery">
      Out for Delivery
    </option>

    <option value="Delivered">
      Delivered
    </option>

    <option value="Delayed">
      Delayed
    </option>

    <option value="Cancelled">
      Cancelled
    </option>
  </select>
</div>

        </div>


        {/* BUTTONS */}

        <div className="flex justify-end gap-4 mt-8">

          <button
            type="button"
            onClick={() =>
              navigate("/shipments")
            }
            disabled={saving}
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>


          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-900/20 transition disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Update Shipment"}
          </button>

        </div>

      </form>

    </Layout>
  );
}


/* ================= FORM FIELD ================= */

function FormField({
  label,
  name,
  type = "text",
  value,
  placeholder,
  onChange,
  required = false,
}) {
  return (
    <div>

      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        required={required}
        className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-500 px-4 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
      />

    </div>
  );
}

export default EditShipment;