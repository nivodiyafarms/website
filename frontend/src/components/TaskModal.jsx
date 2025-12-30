import React, { useState, useEffect } from "react";
import { X, Bot, AlertTriangle } from "lucide-react";
import ChatbotModal from "./ChatbotModal";
import VoiceRecorder from "./VoiceRecorder";

/* ------------------ CATEGORY & SUBCATEGORY ------------------ */

const categories = {
  बुआई: ["खरार", "रोटावेटर", "मल्चर", "पस्टार", "बोइनी", "प्लाउ"],
  सिंचाई: [
    "पलेवा (बीज बोने से पहले)",
    "पहली पानी",
    "दूसरी पानी",
    "तीसरी पानी",
    "चौथी पानी",
    "पाँचवीं पानी",
    "ठेका सिंचाई",
  ],
  खाद: ["बीज उपचार", "डीएपी", "यूरिया", "दवाई", "पोटाश", "जिंक", "सल्फर", "सुपर"],
  कटाई: ["कटाई", "थ्रेसर", "हार्वेस्टर", "पंखा", "ठेका कटाई"],
  ईंधन: ["डीज़ल", "पेट्रोल"],
  बिक्री: ["मंडी बिक्री", "सोसाइटी बिक्री"],
  भंडार: ["खेत क्रमांक", "वेयरहाउस", "अन्य (इनपुट परीक्षण)"],
};

const statusFlow = [
  "नया",
  "प्रगति पर",
  "रोक पर",
  "समाधान किया गया",
  "बंद",
  "विलंबित",
  "रद्द किया गया",
  "पुनः खोला गया",
];

const TaskModal = ({ isOpen, onClose, onSubmit, cropCycleId }) => {
  const [activeTab, setActiveTab] = useState("Notes");
  const [showChatbot, setShowChatbot] = useState(false);

  const [formData, setFormData] = useState({
    task_id: "",
    category: "",
    sub_category: "",
    status: "नया",
    opened_by: "",
    opened_date: "",
    short_description: "",
    description: "",
    notes: "",
    expected_resolution_date: "",
    resolution_notes: "",
  });

  /* ---------------- STATUS BASED LOGIC ---------------- */
  useEffect(() => {
    if (formData.status === "समाधान किया गया") {
      setActiveTab("Resolution Information");
    }
    if (formData.status === "पुनः खोला गया") {
      setActiveTab("Notes");
    }
  }, [formData.status]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  const VoiceTextarea = ({ label, field, rows = 3 }) => (
    <div>
      <label className="font-medium block mb-1">{label}</label>
      <div className="relative">
        <textarea
          rows={rows}
          className="w-full border rounded-xl p-2 pr-12"
          value={formData[field]}
          onChange={(e) =>
            setFormData({ ...formData, [field]: e.target.value })
          }
        />
        <VoiceRecorder
          onRecordingComplete={(blob) =>
            setFormData((p) => ({
              ...p,
              [field]: p[field],
            }))
          }
          customButton
          buttonClassName="absolute top-2 right-2"
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 bg-green-600 text-white rounded-t-3xl">
          <h2 className="text-xl font-bold">🌾 Task Form</h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowChatbot(true)}
              className="bg-white/20 px-3 py-1 rounded flex gap-2"
            >
              <Bot size={18} /> AI
            </button>
            <button type="button" onClick={onClose}>
              <X />
            </button>
          </div>
        </div>

        {/* MAIN FORM (ALWAYS VISIBLE) */}
        <div className="p-6 grid md:grid-cols-2 gap-6">
          <Card title="📌 कार्य विवरण">
            <Input
              label="Task ID"
              value={formData.task_id}
              onChange={(e) =>
                setFormData({ ...formData, task_id: e.target.value })
              }
            />

            <Select
              label="श्रेणी"
              options={Object.keys(categories)}
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value,
                  sub_category: "",
                })
              }
            />

            <Select
              label="उप-श्रेणी"
              options={
                formData.category ? categories[formData.category] : []
              }
              value={formData.sub_category}
              onChange={(e) =>
                setFormData({ ...formData, sub_category: e.target.value })
              }
            />

            <Input
              label="द्वारा खोला गया"
              value={formData.opened_by}
              onChange={(e) =>
                setFormData({ ...formData, opened_by: e.target.value })
              }
            />

            <Input
              label="खोलने की तिथि"
              type="datetime-local"
              value={formData.opened_date}
              onChange={(e) =>
                setFormData({ ...formData, opened_date: e.target.value })
              }
            />

            <Select
              label="स्थिति"
              options={statusFlow}
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            />

            {formData.status === "रद्द किया गया" && (
              <div className="text-sm bg-yellow-100 border p-2 rounded flex gap-2 text-yellow-800">
                <AlertTriangle size={16} />
                7 दिन बाद स्वतः बंद हो जाएगा
              </div>
            )}
          </Card>

          <Card title="📝 विवरण">
            <VoiceTextarea label="संक्षिप्त विवरण" field="short_description" />
            <VoiceTextarea label="विवरण" field="description" rows={4} />
          </Card>
        </div>

        {/* TABS */}
        <div className="px-6">
          {activeTab === "Notes" && (
            <Card title="🗒️ Notes">
              <textarea
                className="w-full border p-4 rounded-xl"
                rows={4}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="नोट्स लिखें..."
              />
            </Card>
          )}

          {activeTab === "Resolution Information" && (
            <Card title="📊 समाधान विवरण">
              <Input
                label="संभावित समाधान तिथि"
                type="datetime-local"
                value={formData.expected_resolution_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expected_resolution_date: e.target.value,
                  })
                }
              />
              <VoiceTextarea
                label="समाधान विवरण"
                field="resolution_notes"
                rows={4}
              />
            </Card>
          )}
        </div>

        {/* TAB BAR */}
        <div className="flex justify-center gap-8 border-t mt-6 pt-4">
          {["Notes", "Resolution Information"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                activeTab === tab
                  ? "border-b-2 border-green-600 font-semibold"
                  : "text-gray-500"
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SUBMIT */}
        <div className="text-center py-6">
          <button className="bg-green-600 text-white px-10 py-3 rounded-2xl">
            💾 दर्ज करे
          </button>
        </div>
      </form>

      {showChatbot && (
        <ChatbotModal isOpen onClose={() => setShowChatbot(false)} />
      )}
    </div>
  );
};

export default TaskModal;

/* ========= UI COMPONENTS ========= */

const Card = ({ title, children }) => (
  <div className="bg-gray-50 border rounded-2xl p-4 space-y-3">
    <h3 className="font-semibold text-green-700">{title}</h3>
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <div>
    <label className="font-medium block mb-1">{label}</label>
    <input {...props} className="w-full border p-2 rounded-xl" />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div>
    <label className="font-medium block mb-1">{label}</label>
    <select {...props} className="w-full border p-2 rounded-xl">
      <option value="">चुनें</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);
