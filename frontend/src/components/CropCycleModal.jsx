import React, { useState, useEffect } from "react";
import { X, Mic, Bot } from "lucide-react";
import { transformCropCycleRequest } from "../utils/apiTransformers";

export default function CropCycleModal({ isOpen, onClose, onSubmit, editing, fields, supervisors }) {
  const [activeTab, setActiveTab] = useState("Notes");
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  const [formData, setFormData] = useState({
    incidentId: "",
    khet: "",
    buwaiDate: "",
    katayiDate: "",
    vartman_charan: "",
    varnan: "",
    season: "",
    fasal: "",
    rakba: "",
    beej_category: "",
    seed_quantity: "",  // ✅ Added seed_quantity field
    sthiti: "",
    status: "",
    resolvedDate: null,
    tipanni: "",
    notes: "",
    attachment: null,
    totalExpense: "",
    totalRevenue: "",
    profit: "",
    actualHarvestDate: "",
    resolutionComments: "",
    observation: "",
  });
  
  const [showResolvedPopup, setShowResolvedPopup] = useState(false);  // ✅ Added popup state

  const isResolutionStatus =
    formData.sthiti === "समाधान किया" ||
    formData.sthiti === "रद्द किया गया" ||
    formData.status === "resolved" ||
    formData.status === "cancelled";

  // Preload editing data - map backend English fields to Hindi form fields
  useEffect(() => {
    if (editing && editing.crop_cycle_id) {
      setFormData({
        khet: editing.field_code || '',
        fasal: editing.crop_name || '',
        beej_category: editing.seed_category || '',
        season: editing.season || '',
        rakba: editing.cultivated_area || '',
        seed_quantity: editing.seed_quantity || '',
        buwaiDate: editing.sowing_date || '',
        katayiDate: editing.expected_harvest_date || '',
        vartman_charan: editing.current_stage || '',
        sthiti: editing.status || '',
        status: editing.status || '',
        varnan: editing.short_description || '',
        tipanni: editing.description || '',
        notes: editing.observation || '',
        totalExpense: editing.total_expense || '',
        totalRevenue: editing.total_revenue || '',
        profit: editing.profit || '',
        actualHarvestDate: editing.actual_harvest_date || '',
      });
    }
  }, [editing]);

  const handleChange = (key) => (e) =>
    setFormData((p) => ({ ...p, [key]: e.target.value }));
  const handleCalcChange = (key) => (e) => {
  const value = Number(e.target.value) || 0;

  setFormData((p) => {
    const updated = { ...p, [key]: value };

    const expense =
      key === "totalExpense" ? value : Number(updated.totalExpense) || 0;

    const revenue =
      key === "totalRevenue" ? value : Number(updated.totalRevenue) || 0;

    return {
      ...updated,
      profit: revenue - expense,
    };
  });
};

  const handleFileUpload = (e) =>
    setFormData((p) => ({ ...p, attachment: e.target.files[0] }));

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setFormData((p) => ({
      ...p,
      sthiti: value,
      resolvedDate:
        value === "समाधान किया" ? new Date().toISOString() : p.resolvedDate,
    }));
    // ✅ Show popup when status changes to RESOLVED
    if (value === "समाधान किया" || value === "resolved" || value === "RESOLVED") {
      setShowResolvedPopup(true);
      setActiveTab("Resolution Information");
    }
  };
  
  const handleCloseResolvedPopup = () => {
    setShowResolvedPopup(false);
  };

  useEffect(() => {
    if (formData.sthiti === "समाधान किया" && formData.resolvedDate) {
      const timer = setInterval(() => {
        const diff =
          (new Date() - new Date(formData.resolvedDate)) /
          (1000 * 60 * 60 * 24);
        if (diff >= 7 && formData.sthiti !== "पुन: खोला गया") {
          setFormData((p) => ({ ...p, sthiti: "बंद" }));
        }
      }, 3600000);
      return () => clearInterval(timer);
    }
  }, [formData.sthiti, formData.resolvedDate]);

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.khet) {
      alert('Please select a field (खेत)');
      return;
    }
    if (!formData.fasal) {
      alert('Please enter crop name (फसल)');
      return;
    }
    if (!formData.buwaiDate) {
      alert('Please select sowing date (बुआई की तारीख)');
      return;
    }
    if (!formData.season) {
      alert('Please select season (सीजन)');
      return;
    }

    // Transform form data from Hindi field names to English backend field names
    const transformedData = transformCropCycleRequest(formData);
    
    // Double-check required fields after transformation
    if (!transformedData.field_code || !transformedData.crop_name || !transformedData.sowing_date || !transformedData.season) {
      alert('Missing required fields. Please fill all required fields.');
      return;
    }

    if (
      formData.sthiti === "समाधान किया" ||
      formData.sthiti === "रद्द किया गया"
    ) {
      if (!formData.resolutionComments?.trim()) {
        alert("समाधान टिप्पणियाँ आवश्यक हैं");
        return;
      }
      if (!formData.totalExpense && formData.totalExpense !== 0) {
        alert("कुल व्यय आवश्यक है");
        return;
      }
      if (!formData.totalRevenue && formData.totalRevenue !== 0) {
        alert("कुल आय आवश्यक है");
        return;
      }
      if (!formData.resolvedDate) {
        alert("समाधान तिथि आवश्यक है");
        return;
      }
    }
    
    onSubmit(transformedData);
  };

  /* ================= OPTIONS ================= */
  const khetOptions = (fields || [])
    .sort((a, b) => (a.field_id || "").localeCompare(b.field_id || ""))
    .map((f) => ({
      value: f.field_id,
      label: `${f.field_id} - ${f.name || f.field_id}`,
    }));

  const seasonOptions = ["खरीफ", "रबी", "जायद"];
  const fasalOptions = [
    "सोयाबीन","मक्का","मूंग","गेहू","धान","चना","मसूर","बटरी","तेवरा"
  ];
  const charanOptions = [
    "बुआई","वृद्धि","फूल पर","कटाई","भंडार","बिक्री","भुगतान"
  ];
  const sthitiOptions = [
    "खोलना","समाधान किया","पुन: खोला गया","बंद","रद्द किया गया"
  ];

  const tabs = [
    ...(isResolutionStatus ? ["Resolution Information"] : [])
  ];

  const renderActiveTabContent = () => {
    if (activeTab === "Resolution Information") {
      return isResolutionStatus ? (
        <div className="bg-pink-50 p-6 rounded-2xl border space-y-6">
          <h3 className="text-lg font-bold text-purple-700">
            📊 फील्ड समाधान विवरण
          </h3>

          {/* EXPENSE & REVENUE */}
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="कुल व्यय (₹)"
              type="number"
              value={formData.totalExpense}
              onChange={handleCalcChange("totalExpense")}
              placeholder="कुल खर्च दर्ज करें"
            />

            <Input
              label="कुल आय (₹)"
              type="number"
              value={formData.totalRevenue}
              onChange={handleCalcChange("totalRevenue")}
              placeholder="कुल आय दर्ज करें"
            />
          </div>

          {/* PROFIT */}
          <Input
            label="लाभ (₹)"
            type="number"
            value={formData.profit}
            disabled
          />

          {/* DATES */}
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="समाधान तिथि"
              type="date"
              value={
                formData.resolvedDate
                  ? formData.resolvedDate.split("T")[0]
                  : ""
              }
              disabled
            />

            <Input
              label="वास्तविक कटाई तिथि"
              type="date"
              value={formData.actualHarvestDate}
              onChange={handleChange("actualHarvestDate")}
            />
          </div>

          {/* COMMENTS */}
          <Textarea
            label="समाधान टिप्पणियाँ"
            placeholder="समाधान से संबंधित विवरण लिखें..."
            value={formData.resolutionComments}
            onChange={handleChange("resolutionComments")}
          />

          <Textarea
            label="निरीक्षण"
            rows={1}
            placeholder="निरीक्षण लिखें..."
            value={formData.observation}
            onChange={handleChange("observation")}
          />
        </div>
      ) : null;
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ✅ RESOLVED Status Popup */}
      {showResolvedPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-orange-700 mb-4">
              ⚠️ समाधान जानकारी आवश्यक है
            </h3>
            <p className="text-gray-700 mb-4">
              जब स्थिति "समाधान किया" पर सेट होती है, तो कृपया निम्नलिखित जानकारी भरें:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>समाधान टिप्पणियाँ (Resolution Comments)</li>
              <li>कुल व्यय और आय (Total Expense & Revenue)</li>
              <li>निरीक्षण (Observation)</li>
            </ul>
            <button
              onClick={handleCloseResolvedPopup}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              समझ गया (Got it)
            </button>
          </div>
        </div>
      )}
      
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl">

        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 bg-green-600 text-white rounded-t-3xl">
          <h2 className="text-xl font-bold">🌾 Incident Form</h2>
          <button onClick={onClose}><X /></button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">

          {/* ID Display (read-only when editing) or info message */}
          {formData.incidentId ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <label className="text-sm font-medium text-blue-900">Incident ID (Auto-generated)</label>
              <p className="text-lg font-semibold text-blue-700">{formData.incidentId}</p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Note:</span> ID will be auto-generated (e.g., IN0001)
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">

            {/* LEFT */}
            <Card title="📌 घटना विवरण">
              <div>
                <label className="font-medium">
                  खेत * <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  name="khet"
                  value={formData.khet}
                  onChange={handleChange("khet")}
                  className="w-full border p-2 rounded-xl"
                  required
                >
                  <option value="">चुनें</option>
                  {khetOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="बुआई की तारीख *" type="date" value={formData.buwaiDate} onChange={handleChange("buwaiDate")} required />
              <Input label="संभावित कटाई तारीख" type="date" value={formData.katayiDate} onChange={handleChange("katayiDate")} />
              <Select label="वर्तमान चरण" value={formData.vartman_charan} onChange={handleChange("vartman_charan")} options={charanOptions} />
              <Textarea
  label="विवरण"
  placeholder="विवरण लिखें..."
  value={formData.tipanni}
  onChange={handleChange("tipanni")}
  rows={1}
/>

              <Textarea
  label="संक्षिप्त विवरण"
  placeholder="संक्षिप्त विवरण लिखें..."
  value={formData.varnan}
  onChange={handleChange("varnan")}
/>

            </Card>

            {/* RIGHT */}
            <Card title="🌱 फसल विवरण">
              <Input label="रक़बा (एकड़)" value={formData.rakba} onChange={handleChange("rakba")} />
              <Select label="सीजन *" value={formData.season} onChange={handleChange("season")} options={seasonOptions} required />
              <Select label="फसल *" value={formData.fasal} onChange={handleChange("fasal")} options={fasalOptions} required />
              <Input
                label="बीज कैटेगरी (English में लिखें)"
                value={formData.beej_category || ""}
                onChange={handleChange("beej_category")}
                translate="no"
                autoComplete="off"
                spellCheck={false}
              />
              <Input
                label="बीज मात्रा (Seed Quantity)"
                type="number"
                value={formData.seed_quantity}
                onChange={handleChange("seed_quantity")}
                placeholder="बीज की मात्रा दर्ज करें"
              />

              <Select label="स्थिति" value={formData.sthiti} onChange={handleStatusChange} options={sthitiOptions} />

              {formData.sthiti === "रद्द किया गया" && (
                <p className="text-sm bg-orange-50 border p-2 rounded text-orange-700">
                  ℹ️ समाधान के 7 दिन बाद स्वतः बंद हो जाएगा
                </p>
              )}

              
            </Card>
          </div>

          {/* TABS */}
          <div className="border-t pt-4">
            <div className="flex gap-6">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={
                    activeTab === t
                      ? "border-b-2 border-green-600 font-semibold"
                      : "text-gray-500"
                  }
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-4">{renderActiveTabContent()}</div>
          </div>

          <div className="text-center">
            <button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl"
            >
              💾 दर्ज करे
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

/* ========= UI COMPONENTS ========= */

const Card = ({ title, children }) => (
  <div className="bg-gray-50 border rounded-2xl p-4 space-y-3">
    <h3 className="font-semibold text-green-700">{title}</h3>
    {children}
  </div>
);

const Input = ({ label, required, ...props }) => (
  <div>
    {label && (
      <label className="font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <input {...props} className="w-full border p-2 rounded-xl" required={required} />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div>
    {label && <label className="font-medium">{label}</label>}
    <textarea {...props} rows={3} className="w-full border p-2 rounded-xl" />
  </div>
);

const Select = ({ label, options, required, ...props }) => (
  <div>
    {label && (
      <label className="font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <select {...props} className="w-full border p-2 rounded-xl" required={required}>
      <option value="">चुनें</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  </div>
);
