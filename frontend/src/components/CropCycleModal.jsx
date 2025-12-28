import React, { useState, useEffect } from "react";
import { X, Mic, Bot, Upload } from "lucide-react";

export default function IncidentModal({ isOpen, onClose, onSubmit, fields = [], editing = null }) {
  // ---------------- STATES ----------------
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Notes");

  // Initialize form data
  const [formData, setFormData] = useState({
    khet: "",
    buwaiDate: "",
    katayiDate: "",
    vartman_charan: "",
    varnan: "",
    tipanni: "",
    season: "",
    fasal_naam: "",
    beej_category: "",
    sthiti: "",
    solution: "",
    kharch: "",
    labh: "",
    notes: "",
    resolution: "",
  });

  // Update form data when editing changes
  useEffect(() => {
    if (editing) {
      setFormData({
        khet: editing.field_id || editing.field_code || "",
        buwaiDate: editing.sowing_date ? new Date(editing.sowing_date).toISOString().split('T')[0] : "",
        katayiDate: editing.expected_harvest_date ? new Date(editing.expected_harvest_date).toISOString().split('T')[0] : "",
        vartman_charan: editing.current_stage || "",
        varnan: editing.description || "",
        tipanni: editing.notes || "",
        season: editing.season || "",
        fasal_naam: editing.crop_name || "",
        beej_category: editing.seed_category || editing.crop_variety || "",
        sthiti: editing.status || "",
        solution: "",
        kharch: "",
        labh: "",
        notes: "",
        resolution: "",
      });
    } else {
      // Reset form when not editing
      setFormData({
        khet: "",
        buwaiDate: "",
        katayiDate: "",
        vartman_charan: "",
        varnan: "",
        tipanni: "",
        season: "",
        fasal_naam: "",
        beej_category: "",
        sthiti: "",
        solution: "",
        kharch: "",
        labh: "",
        notes: "",
        resolution: "",
      });
    }
  }, [editing, isOpen]);

  if (!isOpen) return null;

  // ---------------- OPTIONS ----------------
  const tabs = [
    "Notes",
    "Related Records",
    "Vendor Details",
    "Resolution Information",
    "Impacted Details",
    "Location Details",
  ];

  const cropOptions = ["गेहु", "सोयाबीन", "मूंग", "मक्का", "धान", "चना", "मसूर", "बटरी", "तेवारा"];
  const statusOptions = ["खोलना", "समाधान किया", "पुन: खोला गया", "बंद", "रद्द किया गया"];
  const stageOptions = ["बुआई", "वृद्धि", "फूल पर", "फल पर", "कटाई", "भंडार", "बिक्री", "भुगतान"];

  // Use fields from API, fallback to empty array
  const khetOptions = fields && fields.length > 0 
    ? fields.map(field => field.field_id || field.farm_id).filter(Boolean)
    : [];

  // ---------------- HANDLERS ----------------
  const handleChange = (key) => (e) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, sthiti: value }));

    if (value === "समाधान किया") setShowSolutionModal(true);
    if (value === "रद्द किया गया")
      alert("नियम: समाधान के बाद स्थिति 7 दिनों के बाद 'बंद' में बदल दी जाएगी।");
  };

  const handleSubmit = () => onSubmit(formData);

  // ---------------- Small reusable Input ----------------
  const Input = ({ label, placeholder, type = "text" }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full p-2 bg-gray-200 rounded"
      />
    </div>
  );

  // ---------------- TAB CONTENT ----------------
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "Notes":
        return (
          <div className="relative">

            {/* TOOLS — Top Right */}
            <div className="absolute top-2 right-2 flex gap-2 z-10">
              <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
                <Bot size={18} />
              </button>
              <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
                <Upload size={18} />
              </button>
              <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
                <Mic size={18} />
              </button>
            </div>

            {/* TEXTAREA */}
            <textarea
              className="w-full border p-3 pt-14 rounded min-h-[140px] bg-gray-50"
              value={formData.tipanni}
              onChange={handleChange("tipanni")}
              placeholder="Write notes here... (यह वही टिप्पणी फ़ील्ड है)"
            />
          </div>
        );

      case "Resolution Information":
        return (
          <div className="border rounded-xl p-5 bg-gray-50 shadow-sm">

            <h3 className="text-xl font-semibold mb-4">Resolution Information</h3>

            {/* Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* LEFT */}
              <div className="space-y-4">
                <Input label="Defect ID" placeholder="DEF-XXXX" />
                <Input label="Mitigated By" placeholder="Dish - Internal" />
                <Input label="Team" placeholder="DSH - ENGINEERING" />
                <Input label="Resolution Category" placeholder="Software" />
                <Input label="Resolution Sub-Category" placeholder="Known Defect" />
                <Input label="Resolution Code" placeholder="POD Reboot" />
              </div>

              {/* RIGHT */}
              <div className="space-y-4">
                <Input label="Resolved By" placeholder="Arif Mohammed" />
                <Input label="Resolved Date" type="datetime-local" />

                <div>
                  <label className="text-sm font-medium">Change Category</label>
                  <select className="w-full p-2 bg-gray-200 rounded">
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Resolution Notes */}
            <div className="mt-6">
              <label className="text-sm font-medium">Resolution Notes</label>
              <textarea
                rows="3"
                className="w-full p-3 bg-gray-200 rounded mt-1"
                placeholder="Detailed resolution notes..."
              />
            </div>

            {/* IMAGE */}
            <div className="mt-6">
              <label className="text-sm font-medium">Screenshot / Reference</label>
              <img
                src="/images/resolution-info.png"
                alt="Resolution Info"
                className="w-full rounded-lg shadow mt-2 object-contain"
              />
            </div>
          </div>
        );

      case "Related Records":
        return <p className="text-gray-600">No related records found.</p>;

      case "Vendor Details":
        return (
          <input
            type="text"
            className="w-full border p-3 rounded bg-gray-50"
            placeholder="Enter Vendor Name / Contact"
          />
        );

      case "Impacted Details":
        return (
          <input
            className="w-full border p-3 rounded bg-gray-50"
            placeholder="Impacted Systems / Users"
          />
        );

      case "Location Details":
        return (
          <input
            className="w-full border p-3 rounded bg-gray-50"
            placeholder="Exact location details"
          />
        );

      default:
        return null;
    }
  };

  // ---------------- MODAL UI ----------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 md:p-6">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[95vh]">

        {/* HEADER */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b z-20 flex justify-between items-center">
          <button onClick={onClose} className="text-blue-600 font-semibold text-lg">← Back</button>
          <h2 className="text-xl md:text-2xl font-bold">Incident Form</h2>
          <button onClick={onClose} className="text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 md:p-6 overflow-y-auto">

          {/* FORM GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* LEFT CARD */}
            <div className="bg-gray-100 p-4 rounded-xl shadow-inner border space-y-3">
              <h3 className="text-lg font-semibold">घटना विवरण</h3>

              <select
                className="w-full border p-2 rounded bg-white"
                value={formData.khet}
                onChange={handleChange("khet")}
              >
                <option value="">खेत क्रमांक चुनें</option>
                {khetOptions.length > 0 ? (
                  khetOptions.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))
                ) : (
                  <option value="" disabled>Loading fields...</option>
                )}
              </select>

              <input
                type="date"
                className="w-full border p-2 rounded bg-white"
                value={formData.buwaiDate}
                onChange={handleChange("buwaiDate")}
              />

              <input
                type="date"
                className="w-full border p-2 rounded bg-white"
                value={formData.katayiDate}
                onChange={handleChange("katayiDate")}
              />

              <select
                className="w-full border p-2 rounded bg-white"
                value={formData.vartman_charan}
                onChange={handleChange("vartman_charan")}
              >
                <option value="">चरण चुनें</option>
                {stageOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <textarea
                rows="3"
                className="w-full border p-2 rounded bg-white"
                placeholder="विवरण"
                value={formData.varnan}
                onChange={handleChange("varnan")}
              />

              <textarea
                rows="2"
                className="w-full border p-2 rounded bg-white"
                placeholder="टिप्पणी"
                value={formData.tipanni}
                onChange={handleChange("tipanni")}
              />
            </div>

            {/* RIGHT CARD */}
            <div className="bg-gray-100 p-4 rounded-xl shadow-inner border space-y-3">
              <h3 className="text-lg font-semibold">फसल विवरण</h3>

              <select
                className="w-full border p-2 rounded bg-white"
                value={formData.season}
                onChange={handleChange("season")}
              >
                <option value="">सीजन चुनें</option>
                <option value="रबी">रबी</option>
                <option value="खरीफ">खरीफ</option>
                <option value="जायद">जायद</option>
              </select>

              <select
                className="w-full border p-2 rounded bg-white"
                value={formData.fasal_naam}
                onChange={handleChange("fasal_naam")}
              >
                <option value="">फसल चुनें</option>
                {cropOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <input
                className="w-full border p-2 rounded bg-white"
                value={formData.beej_category}
                onChange={handleChange("beej_category")}
                placeholder="बीज कैटेगरी"
              />

              <select
                className="w-full border p-2 rounded bg-white"
                value={formData.sthiti}
                onChange={handleStatusChange}
              >
                <option value="">स्थिति चुनें</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* TABS */}
          <div className="mt-8 border-t pt-4">
            <div className="flex gap-3 overflow-x-auto pb-2 border-b">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm whitespace-nowrap ${
                    activeTab === tab
                      ? "border-b-2 border-green-600 font-semibold text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-4">{renderActiveTabContent()}</div>
          </div>

          {/* SAVE BTN */}
          <div className="text-center mt-6">
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-xl w-full md:w-auto shadow hover:bg-green-700"
              onClick={handleSubmit}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* SOLUTION MODAL */}
      {showSolutionModal && (
        <SolutionModal
          formData={formData}
          handleChange={handleChange}
          onClose={() => setShowSolutionModal(false)}
          onSave={() => setShowSolutionModal(false)}
        />
      )}
    </div>
  );
}

// ---------------- Solution Modal ----------------
function SolutionModal({ formData, handleChange, onClose, onSave }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-3 z-50">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">

        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-xl font-semibold">समाधान + आर्थिक सारांश</h3>
          <button onClick={onClose} className="text-gray-500">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4 mt-4">
          <textarea
            rows="3"
            className="w-full border rounded-xl p-3 bg-gray-50"
            placeholder="समाधान का विवरण लिखें"
            value={formData.solution}
            onChange={handleChange("solution")}
          />

          <input
            type="number"
            className="w-full border rounded-xl p-3 bg-gray-50"
            placeholder="₹ खर्च दर्ज करें"
            value={formData.kharch}
            onChange={handleChange("kharch")}
          />

          <input
            type="number"
            className="w-full border rounded-xl p-3 bg-gray-50"
            placeholder="₹ लाभ / नुकसान"
            value={formData.labh}
            onChange={handleChange("labh")}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button className="px-5 py-2 rounded-xl bg-gray-200" onClick={onClose}>
            बंद
          </button>
          <button className="px-5 py-2 rounded-xl bg-blue-600 text-white" onClick={onSave}>
            सेव करें
          </button>
        </div>
      </div>
    </div>
  );
}
