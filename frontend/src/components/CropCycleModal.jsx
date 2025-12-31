import React, { useState, useEffect } from "react";
import { X, Mic, Bot } from "lucide-react";
import { transformCropCycleRequest } from "../utils/apiTransformers";

export default function IncidentModal({ isOpen, onClose, onSubmit }) {
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
    sthiti: "",
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
  // --------- ENGLISH → HINDI TRANSLITERATION (BASIC) ----------
const transliterateToHindi = (text) => {
  const map = {
    a: "अ", aa: "आ", i: "इ", ii: "ई", u: "उ", uu: "ऊ",
    e: "ए", ai: "ऐ", o: "ओ", au: "औ",
    k: "क", kh: "ख", g: "ग", gh: "घ",
    ch: "च", j: "ज", t: "त", th: "थ",
    d: "द", dh: "ध", n: "न",
    p: "प", ph: "फ", b: "ब", bh: "भ",
    m: "म", y: "य", r: "र", l: "ल",
    v: "व", s: "स", h: "ह"
  };

  return text
    .toLowerCase()
    .split(" ")
    .map(word => {
      let result = "";
      let i = 0;
      while (i < word.length) {
        if (map[word.slice(i, i + 2)]) {
          result += map[word.slice(i, i + 2)];
          i += 2;
        } else if (map[word[i]]) {
          result += map[word[i]];
          i += 1;
        } else {
          result += word[i];
          i += 1;
        }
      }
      return result;
    })
    .join(" ");
};


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

const handleBeejCategoryChange = (e) => {
  const englishText = e.target.value;
  const hindiText = transliterateToHindi(englishText);

  setFormData((p) => ({
    ...p,
    beej_category: hindiText,
  }));
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
    if (value === "समाधान किया") setActiveTab("Resolution Information");
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
    // Transform form data from Hindi field names to English backend field names
    const transformedData = transformCropCycleRequest(formData);
    onSubmit(transformedData);
  };

  /* ================= OPTIONS ================= */
  const khetOptions = [
    "HQ0001","NIB001","NIA001","NID005","NID006","NID001","NID002","NID003",
    "NID004","NID007","NID008","NID009","BAD010","BAD011","NIA002","NIA003"
  ];

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

  const tabs = ["Notes", "Resolution Information"];

  const renderActiveTabContent = () => {
    if (activeTab === "Resolution Information") {
  return (
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
  );
}

    return (
      <div className="relative">
        <button
          onClick={() => setShowAiAssistant(true)}
          className="absolute right-0 top-0 bg-purple-600 text-white px-4 py-2 rounded-xl flex gap-2 shadow"
        >
          <Bot size={18} /> AI Assist
        </button>

        <textarea
          className="w-full border p-4 rounded-xl mt-12"
          rows={4}
          value={formData.notes}
          onChange={handleChange("notes")}
          placeholder="नोट्स लिखें..."
        />

        <input type="file" className="mt-4" onChange={handleFileUpload} />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
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
              <Select label="खेत" value={formData.khet} onChange={handleChange("khet")} options={khetOptions} />
              <Input label="बुआई की तारीख" type="date" value={formData.buwaiDate} onChange={handleChange("buwaiDate")} />
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
              <Select label="सीजन" value={formData.season} onChange={handleChange("season")} options={seasonOptions} />
              <Select label="फसल" value={formData.fasal} onChange={handleChange("fasal")} options={fasalOptions} />
              <Input
  label="बीज कैटेगरी (English में लिखें)"
  value={formData.beej_category}
  onChange={handleBeejCategoryChange}
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
  );
}

/* ========= UI COMPONENTS ========= */

const Card = ({ title, children }) => (
  <div className="bg-gray-50 border rounded-2xl p-4 space-y-3">
    <h3 className="font-semibold text-green-700">{title}</h3>
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="font-medium">{label}</label>}
    <input {...props} className="w-full border p-2 rounded-xl" />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div>
    {label && <label className="font-medium">{label}</label>}
    <textarea {...props} rows={3} className="w-full border p-2 rounded-xl" />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div>
    {label && <label className="font-medium">{label}</label>}
    <select {...props} className="w-full border p-2 rounded-xl">
      <option value="">चुनें</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  </div>
);
