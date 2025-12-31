import React, { useState, useEffect } from "react";
import { X, Bot, AlertTriangle } from "lucide-react";
import ChatbotModal from "./ChatbotModal";
import VoiceRecorder from "./VoiceRecorder";
import { transformTaskRequest } from "../utils/apiTransformers";

// Reverse mapping: English status → Hindi status (for form display)
const STATUS_REVERSE_MAPPING = {
  "new": "नया",
  "NEW": "नया",
  "in_progress": "प्रगति पर",
  "IN_PROGRESS": "प्रगति पर",
  "on_hold": "रोक पर",
  "ON_HOLD": "रोक पर",
  "resolved": "समाधान किया गया",
  "RESOLVED": "समाधान किया गया",
  "closed": "बंद",
  "CLOSED": "बंद",
  "delayed": "विलंबित",
  "DELAYED": "विलंबित",
  "cancelled": "रद्द किया गया",
  "CANCELLED": "रद्द किया गया",
  "reopened": "पुनः खोला गया",
  "REOPENED": "पुनः खोला गया",
};

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

// Reverse mapping: task_type (English) → category (Hindi)
// This helps map backend task_type back to form category when editing
const TASK_TYPE_TO_CATEGORY = {
  "irrigation": "सिंचाई",
  "fertilizer": "खाद",
  "pesticide": "खाद", // Pesticide is under खाद category
  "harvest": "कटाई",
  "transport": "ईंधन",
  "sale": "बिक्री",
  "storage_in": "भंडार",
  "storage_out": "भंडार",
  "other": "बुआई", // Default fallback
};

// Helper function to find category from task_type and sub_type
function findCategoryFromTaskType(taskType, subType) {
  if (!taskType) return "";
  
  // First try direct mapping
  if (TASK_TYPE_TO_CATEGORY[taskType]) {
    return TASK_TYPE_TO_CATEGORY[taskType];
  }
  
  // Try to find category by checking sub_type in categories
  if (subType) {
    for (const [category, subCategories] of Object.entries(categories)) {
      if (subCategories.includes(subType)) {
        return category;
      }
    }
  }
  
  return ""; // Return empty if not found
}

const TaskModal = ({ isOpen, onClose, onSubmit, cropCycleId, editing = null }) => {
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
    update_notes: "", // For task updates/closes
  });

  // Load edit data when editing prop changes
  useEffect(() => {
    if (editing) {
      // Map backend status (English) to Hindi for form display
      const backendStatus = editing.status || "";
      const hindiStatus = STATUS_REVERSE_MAPPING[backendStatus] || backendStatus || "नया";
      
      // Map task_type back to category for form display
      const taskType = editing.task_type || editing.type || "";
      const subType = editing.sub_type || editing.sub_category || "";
      const mappedCategory = editing.category || findCategoryFromTaskType(taskType, subType);
      
      // Map backend response to frontend form format
      setFormData({
        task_id: editing.task_id || editing.id || "",
        category: mappedCategory,
        sub_category: subType,
        status: hindiStatus, // Convert English status to Hindi for form
        opened_by: editing.opened_by || editing.created_by_id || "",
        opened_date: editing.opened_date || editing.occurred_at || "",
        short_description: editing.short_description || "",
        description: editing.description || "",
        notes: editing.notes || "",
        expected_resolution_date: editing.expected_resolution_date || editing.resolved_at || "",
        resolution_notes: editing.resolution_notes || "",
        update_notes: "", // Always start empty for new updates
      });
    } else {
      // Reset form when not editing
      setFormData({
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
        update_notes: "",
      });
    }
  }, [editing, isOpen]);

  /* ---------------- STATUS BASED LOGIC ---------------- */
  useEffect(() => {
    if (formData.status === "समाधान किया गया" || formData.status === "resolved" || formData.status === "RESOLVED") {
      setActiveTab("Resolution Information");
    }
    if (formData.status === "पुनः खोला गया" || formData.status === "reopened" || formData.status === "REOPENED") {
      setActiveTab("Notes");
    }
    // If editing and status is closed, ensure Notes tab is active to show update notes
    if (editing && (formData.status === "बंद" || formData.status === "closed" || formData.status === "CLOSED")) {
      setActiveTab("Notes");
    }
  }, [formData.status, editing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate update_notes when updating/closing
    const isClosing = formData.status === "बंद" || formData.status === "समाधान किया गया";
    const isUpdating = editing !== null;
    
    if ((isClosing || isUpdating) && !formData.update_notes?.trim()) {
      alert("कृपया अपडेट/बंद करने का कारण दर्ज करें (Please provide a reason for updating/closing this task)");
      return;
    }
    
    // Transform form data to match backend schema
    const transformedData = transformTaskRequest(formData);
    onSubmit(transformedData);
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
          <h2 className="text-xl font-bold">{editing ? "✏️ Edit Task" : "🌾 Task Form"}</h2>
          <div className="flex gap-3">
            {!editing && (
              <button
                type="button"
                onClick={() => setShowChatbot(true)}
                className="bg-white/20 px-3 py-1 rounded flex gap-2"
              >
                <Bot size={18} /> AI
              </button>
            )}
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

          {/* Update Notes - Required when updating or closing */}
          {(editing || formData.status === "बंद" || formData.status === "समाधान किया गया") && (
            <Card title="📝 अपडेट नोट्स (अनिवार्य)">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ कृपया इस कार्य को अपडेट/बंद करने का कारण दर्ज करें
                </p>
              </div>
              <textarea
                className="w-full border p-4 rounded-xl"
                rows={3}
                value={formData.update_notes}
                onChange={(e) =>
                  setFormData({ ...formData, update_notes: e.target.value })
                }
                placeholder="अपडेट/बंद करने का कारण लिखें..."
                required
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
