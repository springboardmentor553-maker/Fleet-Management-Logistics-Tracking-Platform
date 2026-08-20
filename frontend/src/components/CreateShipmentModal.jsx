import { useState } from "react";

function CreateShipmentModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    sender_name: "",
    receiver_name: "",
    pickup_location: "",
    delivery_location: "",
    status: "Created",
    weight: "",
    assigned_driver_id: "",
    assigned_vehicle_id: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);

    const shipmentData = {
      sender_name: formData.sender_name,
      receiver_name: formData.receiver_name,
      pickup_location: formData.pickup_location,
      delivery_location: formData.delivery_location,
      status: formData.status,
      weight: Number(formData.weight),
      assigned_driver_id: formData.assigned_driver_id
        ? Number(formData.assigned_driver_id)
        : null,
      assigned_vehicle_id: formData.assigned_vehicle_id
        ? Number(formData.assigned_vehicle_id)
        : null,
    };

    try {
      await onSubmit(shipmentData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">

      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">

          <div>
            <h2 className="text-2xl font-bold text-white">
              Create Shipment
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Enter the shipment details below.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl transition"
          >
            ×
          </button>

        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Sender */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sender Name
              </label>

              <input
                type="text"
                name="sender_name"
                value={formData.sender_name}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter sender name"
              />
            </div>

            {/* Receiver */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Receiver Name
              </label>

              <input
                type="text"
                name="receiver_name"
                value={formData.receiver_name}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter receiver name"
              />
            </div>

            {/* Pickup */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Pickup Location
              </label>

              <input
                type="text"
                name="pickup_location"
                value={formData.pickup_location}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter pickup location"
              />
            </div>

            {/* Delivery */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Delivery Location
              </label>

              <input
                type="text"
                name="delivery_location"
                value={formData.delivery_location}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter delivery location"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Created">Created</option>
                <option value="Assigned">Assigned</option>
                <option value="Picked Up">Picked Up</option>
                <option value="In Transit">In Transit</option>
                <option value="Out for Delivery">
                  Out for Delivery
                </option>
                <option value="Delivered">Delivered</option>
                <option value="Delayed">Delayed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Weight
              </label>

              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
                min="0"
                step="0.1"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter weight"
              />
            </div>

            {/* Driver ID */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Assigned Driver ID
                <span className="text-slate-500 font-normal">
                  {" "}
                  (Optional)
                </span>
              </label>

              <input
                type="number"
                name="assigned_driver_id"
                value={formData.assigned_driver_id}
                onChange={handleChange}
                min="1"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Driver ID"
              />
            </div>

            {/* Vehicle ID */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Assigned Vehicle ID
                <span className="text-slate-500 font-normal">
                  {" "}
                  (Optional)
                </span>
              </label>

              <input
                type="number"
                name="assigned_vehicle_id"
                value={formData.assigned_vehicle_id}
                onChange={handleChange}
                min="1"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 outline-none placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Vehicle ID"
              />
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-slate-700 bg-slate-900">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-slate-600 text-slate-300 font-medium hover:bg-slate-800 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Shipment"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

export default CreateShipmentModal;