import React, { useState } from "react";

export default function TaskForm() {
  const [form, setForm] = useState({
    category: "",
    subCategory: "",
    assignedBy: "",
    openingDate: "",
    status: "New",
    holdReason: "",
    cancelReason: "",
    expectedResolutionDate: "",
    actualResolvedDate: "",
    resolutionComments: "",
    observation: "",
    shortDescription: "",
    description: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const subCategories = {
    Electrical: ["Wiring", "Light", "DB Panel"],
    Plumbing: ["Leakage", "Blockage", "Fitting"],
    HVAC: ["AC", "Duct", "Ventilation"],
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Task Form</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <label className="flex flex-col">
          <span className="font-semibold">श्रेणी</span>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="">Select</option>
            {Object.keys(subCategories).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>

        {/* Sub Category */}
        <label className="flex flex-col">
          <span className="font-semibold">उप-श्रेणी</span>
          <select
            name="subCategory"
            value={form.subCategory}
            onChange={handleChange}
            className="border p-2 rounded"
            disabled={!form.category}
          >
            <option value="">Select</option>
            {form.category &&
              subCategories[form.category].map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
          </select>
        </label>

        {/* Assigned By */}
        <label className="flex flex-col">
          <span className="font-semibold">द्वारा खोला गया (नाम)</span>
          <input
            name="assignedBy"
            value={form.assignedBy}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </label>

        {/* Opening Date */}
        <label className="flex flex-col">
          <span className="font-semibold">खोलने की तिथि</span>
          <input
            type="date"
            name="openingDate"
            value={form.openingDate}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </label>
      </div>

      {/* Status */}
      <div className="mt-4">
        <label className="flex flex-col">
          <span className="font-semibold">वर्तमान चरण</span>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option>New</option>
            <option>In Progress</option>
            <option>On Hold</option>
            <option>Resolved</option>
            <option>Reopen</option>
            <option>Closed</option>
            <option>Cancelled</option>
          </select>
        </label>
      </div>

      {/* Conditional fields */}
      {form.status === "On Hold" && (
        <div className="mt-4">
          <label className="flex flex-col">
            <span className="font-semibold">रोक का कारण</span>
            <input
              name="holdReason"
              value={form.holdReason}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </label>
        </div>
      )}

      {form.status === "Cancelled" && (
        <div className="mt-4">
          <label className="flex flex-col">
            <span className="font-semibold">रद्द करने का कारण</span>
            <input
              name="cancelReason"
              value={form.cancelReason}
              onChange={handleChange}
              className="border p-2 rounded"
            />
          </label>
        </div>
      )}

      {/* Expected Resolution */}
      <div className="mt-4">
        <label className="flex flex-col">
          <span className="font-semibold">अनुमानित समाधान तिथि</span>
          <input
            type="date"
            name="expectedResolutionDate"
            value={form.expectedResolutionDate}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </label>
      </div>

      {/* Resolution Block */}
      <div className="mt-6 p-4 bg-pink-100 rounded-lg">
        <h3 className="font-bold mb-2">फील्ड विवरण</h3>

        <label className="flex flex-col">
          <span className="font-semibold">वास्तविक समाधान तिथि</span>
          <input
            type="date"
            name="actualResolvedDate"
            value={form.actualResolvedDate}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </label>

        <label className="flex flex-col mt-2">
          <span className="font-semibold">समाधान टिप्पणियाँ</span>
          <textarea
            name="resolutionComments"
            value={form.resolutionComments}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </label>

        <label className="flex flex-col mt-2">
          <span className="font-semibold">निरीक्षण टिप्पणी</span>
          <textarea
            name="observation"
            value={form.observation}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </label>
      </div>

      {/* Short Description */}
      <div className="mt-6">
        <label className="flex flex-col">
          <span className="font-semibold">संक्षिप्त विवरण</span>
          <input
            name="shortDescription"
            value={form.shortDescription}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </label>
      </div>

      {/* Description */}
      <div className="mt-4">
        <label className="flex flex-col">
          <span className="font-semibold">विवरण</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </label>
      </div>

      <button className="bg-blue-600 text-white px-4 py-2 rounded mt-6">Submit</button>
    </div>
  );
}