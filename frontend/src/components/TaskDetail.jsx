import React, { useState, useEffect } from "react";
import { X, FileText, Paperclip, ArrowRight, CheckCircle, Clock, AlertCircle, XCircle, Ban } from "lucide-react";
import { cropCycleAPI } from "../services/api";
import { transformTaskRequest } from "../utils/apiTransformers";

// Status mapping: English → Hindi
const STATUS_MAPPING = {
  "new": "नया",
  "in_progress": "प्रगति पर",
  "on_hold": "रोक पर",
  "resolved": "समाधान किया गया",
  "reopened": "पुनः खोला गया",
  "closed": "बंद",
  "cancelled": "रद्द किया गया",
};

const STATUS_REVERSE_MAPPING = {
  "नया": "new",
  "प्रगति पर": "in_progress",
  "रोक पर": "on_hold",
  "समाधान किया गया": "resolved",
  "पुनः खोला गया": "reopened",
  "बंद": "closed",
  "रद्द किया गया": "cancelled",
};

// Status flow for visual display
const STATUS_FLOW = [
  { value: "new", label: "नया", icon: FileText, color: "bg-blue-100 text-blue-800" },
  { value: "in_progress", label: "प्रगति पर", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  { value: "on_hold", label: "रोक पर", icon: AlertCircle, color: "bg-orange-100 text-orange-800" },
  { value: "resolved", label: "समाधान किया गया", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { value: "closed", label: "बंद", icon: XCircle, color: "bg-gray-100 text-gray-800" },
  { value: "cancelled", label: "रद्द किया गया", icon: Ban, color: "bg-red-100 text-red-800" },
];

const TaskDetail = ({ isOpen, onClose, task, cropCycleId, onUpdate, onNavigateToWorkOrder }) => {
  const [form, setForm] = useState({
    short_description: "",
    description: "",
    status: "new",
    resolution_comments: "",
    observation: "",
    on_hold_reason: "",
  });
  const [saving, setSaving] = useState(false);

  // Work Orders state
  const [taskWorkOrders, setTaskWorkOrders] = useState([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);

  useEffect(() => {
    if (task) {
      // Map backend English status to form state (keep English for API)
      const backendStatus = task.status || "new";
      setForm({
        short_description: task.short_description || "",
        description: task.description || "",
        status: backendStatus, // Keep English status for API compatibility
        resolution_comments: task.resolution_comments || "",
        observation: task.observation || "",
        on_hold_reason: task.on_hold_reason || "",
      });
    }
  }, [task]);

  // Fetch work orders when modal opens
  useEffect(() => {
    if (isOpen && task?.task_id) {
      loadTaskWorkOrders(task.task_id);
    } else {
      // Reset when modal closes
      setTaskWorkOrders([]);
    }
  }, [isOpen, task?.task_id]);

  // Function to load work orders
  const loadTaskWorkOrders = async (taskId) => {
    setLoadingWorkOrders(true);
    try {
      const res = await cropCycleAPI.getWorkOrders(taskId);
      setTaskWorkOrders(res.data || []);
    } catch (error) {
      console.error("Failed to load work orders:", error);
      setTaskWorkOrders([]);
    } finally {
      setLoadingWorkOrders(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!task || !cropCycleId) return;

    setSaving(true);
    try {
      // Form already has English status, just transform for API
      const transformedData = transformTaskRequest({
        ...form,
        // status is already in English format
      });
      
      console.log("UPDATE TASK PAYLOAD:", transformedData);
      console.log("CYCLE ID:", cropCycleId);
      console.log("TASK ID:", task.task_id);
      
      await cropCycleAPI.updateTask(cropCycleId, task.task_id, transformedData);
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      alert("Failed to update task: " + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  // Helper function to get work order status color
  const getWorkOrderStatusColor = (status) => {
    const statusUpper = status?.toUpperCase();
    const colors = {
      OPEN: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      ON_HOLD: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      PARTIAL: 'bg-purple-100 text-purple-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[statusUpper] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen || !task) return null;

  const currentStatusIndex = STATUS_FLOW.findIndex(s => s.value === form.status);
  const isResolved = form.status === "resolved";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto task-detail-container">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold">कार्य विवरण</h2>
            <p className="text-sm text-amber-100">Task #{task.task_number || task.task_id?.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Flow Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="font-semibold text-gray-700 block mb-3">वर्तमान चरण</label>
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_FLOW.map((statusItem, index) => {
                const Icon = statusItem.icon;
                const isActive = statusItem.value === form.status;
                const isPast = index < currentStatusIndex;
                
                return (
                  <div key={statusItem.value} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleChange("status", statusItem.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                        isActive
                          ? statusItem.color + " ring-2 ring-amber-500"
                          : isPast
                          ? "bg-gray-200 text-gray-600"
                          : "bg-white border border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-sm font-medium">{statusItem.label}</span>
                    </button>
                    {index < STATUS_FLOW.length - 1 && (
                      <ArrowRight size={16} className="mx-1 text-gray-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task Information */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-gray-700 block mb-2">
                  संक्षिप्त विवरण
                </label>
                <textarea
                  value={form.short_description}
                  onChange={(e) => handleChange("short_description", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={3}
                  placeholder="संक्षिप्त विवरण दर्ज करें..."
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-2">
                  विवरण
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={5}
                  placeholder="विवरण दर्ज करें..."
                />
              </div>

              {form.status === "on_hold" && (
                <div>
                  <label className="font-semibold text-gray-700 block mb-2">
                    रोक का कारण
                  </label>
                  <textarea
                    value={form.on_hold_reason}
                    onChange={(e) => handleChange("on_hold_reason", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    rows={3}
                    placeholder="रोक का कारण दर्ज करें..."
                  />
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">कार्य जानकारी</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">श्रेणी:</span>
                    <span className="font-medium">{task.category || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">उप-श्रेणी:</span>
                    <span className="font-medium">{task.subcategory || "N/A"}</span>
                  </div>
                  {task.assigned_to_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">नियुक्त:</span>
                      <span className="font-medium">{task.assigned_to_id?.slice(0, 8)}...</span>
                    </div>
                  )}
                  {task.created_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">बनाया गया:</span>
                      <span className="font-medium">
                        {new Date(task.created_at).toLocaleDateString("hi-IN")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution Section - Only when resolved */}
              {isResolved && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-green-800">समाधान विवरण</h3>
                  
                  <div>
                    <label className="font-semibold text-gray-700 block mb-2">
                      वास्तविक समाधान तिथि
                    </label>
                    <input
                      type="date"
                      value={task.resolved_date ? new Date(task.resolved_date).toISOString().split('T')[0] : ""}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-2">
                      समाधान टिप्पणियाँ
                    </label>
                    <textarea
                      value={form.resolution_comments}
                      onChange={(e) => handleChange("resolution_comments", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={4}
                      placeholder="समाधान टिप्पणियाँ दर्ज करें..."
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-2">
                      निरीक्षण टिप्पणी
                    </label>
                    <textarea
                      value={form.observation}
                      onChange={(e) => handleChange("observation", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={4}
                      placeholder="निरीक्षण टिप्पणी दर्ज करें..."
                    />
                  </div>
                </div>
              )}

              {/* Attachments Placeholder */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Paperclip size={18} />
                    संलग्नक
                  </h3>
                </div>
                <button
                  type="button"
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-amber-500 hover:text-amber-600 transition"
                  disabled
                >
                  <Paperclip size={20} className="mx-auto mb-2" />
                  <span className="text-sm">Attach (Photos, Audio, Docs)</span>
                  <span className="block text-xs mt-1 text-gray-400">Coming Soon</span>
                </button>
              </div>
            </div>
          </div>

          {/* Work Orders Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 text-lg">
                कार्य आदेश ({taskWorkOrders.length})
              </h3>
            </div>

            {loadingWorkOrders ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">कार्य आदेश लोड हो रहे हैं...</p>
              </div>
            ) : taskWorkOrders.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">अभी तक कोई कार्य आदेश नहीं</p>
              </div>
            ) : (
              <div className="space-y-3">
                {taskWorkOrders.map((workOrder) => (
                  <div
                    key={workOrder.work_order_id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {workOrder.work_order_number || 'N/A'}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getWorkOrderStatusColor(workOrder.status)}`}>
                            {workOrder.status || 'N/A'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {workOrder.short_description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {workOrder.due_date && (
                            <span>
                              अंतिम तिथि: {new Date(workOrder.due_date).toLocaleDateString()}
                            </span>
                          )}
                          {workOrder.created_at && (
                            <span>
                              बनाया गया: {new Date(workOrder.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("OPEN WORK ORDER CLICK DETECTED");
                onNavigateToWorkOrder && onNavigateToWorkOrder(task.task_id);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <ArrowRight size={18} />
              <span>कार्य आदेश खोलें</span>
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {saving ? "सaving..." : "💾 सहेजें"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
