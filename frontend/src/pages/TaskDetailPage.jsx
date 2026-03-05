import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Paperclip, CheckCircle, Clock, AlertCircle, XCircle, Ban, X } from "lucide-react";
import { cropCycleAPI, userAPI } from "../services/api";
import { transformTaskRequest } from "../utils/apiTransformers";
import NotesInterface from "../components/NotesInterface";
import { useAuth } from "../contexts/AuthContext";
import WorkOrderModal from "../components/WorkOrderModal";

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

// Status flow for visual display
const STATUS_FLOW = [
  { value: "new", label: "नया", icon: FileText, color: "bg-blue-100 text-blue-800" },
  { value: "in_progress", label: "प्रगति पर", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  { value: "on_hold", label: "रोक पर", icon: AlertCircle, color: "bg-orange-100 text-orange-800" },
  { value: "resolved", label: "समाधान किया गया", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  { value: "closed", label: "बंद", icon: XCircle, color: "bg-gray-100 text-gray-800" },
  { value: "cancelled", label: "रद्द किया गया", icon: Ban, color: "bg-red-100 text-red-800" },
];

// Category (Hindi) → subcategory options. Used for create-mode dropdowns and ALL_SUBCATEGORIES.
const TASK_CATEGORIES = {
  बुआई: ["खरार", "रोटावेटर", "मल्चर", "पस्टार", "बोइनी", "प्लाउ"],
  सिंचाई: ["पलेवा (बीज बोने से पहले)", "पहली पानी", "दूसरी पानी", "तीसरी पानी", "चौथी पानी", "पाँचवीं पानी", "ठेका सिंचाई"],
  खाद: ["बीज उपचार", "डीएपी", "यूरिया", "दवाई", "पोटाश", "जिंक", "सल्फर", "सुपर"],
  कटाई: ["कटाई", "थ्रेसर", "हार्वेस्टर", "पंखा", "ठेका कटाई"],
  ईंधन: ["डीज़ल", "पेट्रोल"],
  बिक्री: ["मंडी बिक्री", "सोसाइटी बिक्री"],
  भंडार: ["खेत क्रमांक", "वेयरहाउस", "अन्य (इनपुट परीक्षण)"],
};
const ALL_SUBCATEGORIES = Object.entries(TASK_CATEGORIES).flatMap(([category, subs]) =>
  subs.map((subcategory) => ({ category, subcategory }))
);

const TaskDetailPage = () => {
  const { cycleId, taskId } = useParams();
  const isCreateMode = taskId === "new";
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const defaultTaskState = {
    category: "",
    subcategory: "",
    short_description: "",
    description: "",
    status: "new",
    opened_by: currentUser?.user_id || "",
    opened_date: new Date().toISOString().split("T")[0],
    resolution_comments: "",
    resolved_date: null,
    observation: "",
    on_hold_reason: "",
  };

  const [task, setTask] = useState(null);
  const [form, setForm] = useState({
    ...defaultTaskState,
  });
  const didInitCreateForm = useRef(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Work Orders state
  const [taskWorkOrders, setTaskWorkOrders] = useState([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);
  
  // Active work order for drawer
  const [activeWorkOrder, setActiveWorkOrder] = useState(null);
  const [activeWorkOrderTab, setActiveWorkOrderTab] = useState("resources");
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState(null);
  const [users, setUsers] = useState([]);

  // Work Order Resources state
  const [workOrderResources, setWorkOrderResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Add Resource Modal state
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  // Resource form state
  const [resourceForm, setResourceForm] = useState({
    resource_type: "",
    name: "",
    qty: "",
    unit: "",
    rate: "",
    cost: ""
  });

  const unitMap = {
    labor: "दिन",
    fuel: "लीटर",
    material: "किलो",
    machine: "घंटा",
    water: "घंटा",
    service: "दिन",
    contract: "एकमुश्त",
    construction: "दिन",
  };

  // Fetch task details and work orders on mount
  useEffect(() => {
    if (isCreateMode) {
      setLoading(false);
      if (!didInitCreateForm.current) {
        didInitCreateForm.current = true;
        setForm((prev) => ({
          ...defaultTaskState,
          on_hold_reason: prev.on_hold_reason,
        }));
      }
      return;
    }

    if (cycleId && taskId) {
      loadTaskData();
    }
  }, [cycleId, taskId]);

  // Sync opened_by when currentUser loads in create mode
  useEffect(() => {
    if (isCreateMode && currentUser?.user_id) {
      setForm((prev) => ({ ...prev, opened_by: currentUser.user_id }));
    }
  }, [isCreateMode, currentUser?.user_id]);

  // Load resources when active work order changes
  useEffect(() => {
    if (activeWorkOrder?.work_order_id) {
      loadResources(activeWorkOrder.work_order_id);
    } else {
      setWorkOrderResources([]);
    }
  }, [activeWorkOrder?.work_order_id]);

  useEffect(() => {
    userAPI.getAll().then((res) => setUsers(res.data || [])).catch(() => setUsers([]));
  }, []);

  const loadTaskData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all tasks for the cycle and find the specific task
      // TODO: Replace with GET /api/tasks/{taskId} when backend endpoint is available
      const [tasksRes, workOrdersRes] = await Promise.all([
        cropCycleAPI.getTasks(cycleId),
        cropCycleAPI.getWorkOrders(taskId),
      ]);

      const tasks = tasksRes.data || [];
      const foundTask = tasks.find(t => t.task_id === taskId || t.id === taskId);

      if (!foundTask) {
        setError("Task not found");
        setLoading(false);
        return;
      }

      setTask(foundTask);
      
      // Set form data from task
      const backendStatus = foundTask.status || "new";
      setForm({
        category: foundTask.category || "",
        subcategory: foundTask.subcategory || "",
        short_description: foundTask.short_description || "",
        description: foundTask.description || "",
        status: backendStatus,
        resolution_comments: foundTask.resolution_comments || "",
        observation: foundTask.observation || "",
        on_hold_reason: foundTask.on_hold_reason || "",
        opened_by: foundTask.opened_by || foundTask.assigned_to_id || "",
        opened_date: foundTask.opened_date ? String(foundTask.opened_date).split("T")[0] : new Date().toISOString().split("T")[0],
        resolved_date: foundTask.resolved_date || null,
      });

      // Set work orders
      setTaskWorkOrders(workOrdersRes.data || []);
    } catch (err) {
      console.error("Failed to load task data:", err);
      setError(err.response?.data?.detail || "Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

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

  // Function to load work order resources
  const loadResources = async (workOrderId) => {
    setLoadingResources(true);
    try {
      const res = await cropCycleAPI.getWorkOrderResources(workOrderId);
      setWorkOrderResources(res.data || []);
    } catch (error) {
      console.error("Failed to load resources:", error);
      setWorkOrderResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  // Helper to calculate preview cost
  const previewCost =
    resourceForm.rate && resourceForm.qty
      ? Number(resourceForm.qty) * Number(resourceForm.rate)
      : resourceForm.cost;

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!cycleId) return;

    setSaving(true);
    try {
      const transformedData = transformTaskRequest({
        ...form,
      });

      if (isCreateMode) {
        await cropCycleAPI.createTask(cycleId, transformedData);
        navigate(`/crop-cycle-management?cycle=${cycleId}`);
      } else {
        if (!task) return;
        await cropCycleAPI.updateTask(cycleId, task.task_id, transformedData);
        // Reload task data after update
        await loadTaskData();
        alert("Task updated successfully");
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!isCreateMode && (error || !task)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error || "Task not found"}</p>
        </div>
        <button
          onClick={() => navigate(`/crop-cycle-management?cycle=${cycleId}`)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          Back to Tasks
        </button>
      </div>
    );
  }

  const currentStatusIndex = STATUS_FLOW.findIndex(s => s.value === form.status);
  const showResolutionBlock = form.status === "resolved" || form.status === "cancelled";

  const formData = isCreateMode ? form : task;
  const filteredSubCategories = ALL_SUBCATEGORIES.filter(
    (s) => s.category === (formData?.category || "")
  );

  // Debug: Log modal state
  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(`/crop-cycle-management?cycle=${cycleId}`)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Tasks</span>
      </button>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold">कार्य विवरण</h2>
            <p className="text-sm text-amber-100">{isCreateMode ? "New Task" : (task.task_number || task.task_id?.slice(0, 8) || "—")}</p>
          </div>
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
                      <ArrowLeft size={16} className="mx-1 text-gray-400 rotate-180" />
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
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-600">श्रेणी:</span>
                    {isCreateMode ? (
                      <select
                        value={formData?.category || ""}
                        onChange={(e) => {
                          handleChange("category", e.target.value);
                          handleChange("subcategory", "");
                        }}
                        className="flex-1 max-w-[200px] border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">चुनें</option>
                        {Object.keys(TASK_CATEGORIES).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-medium">{formData?.category || "N/A"}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-600">उप-श्रेणी:</span>
                    {isCreateMode ? (
                      <select
                        value={formData?.subcategory || ""}
                        onChange={(e) => handleChange("subcategory", e.target.value)}
                        className="flex-1 max-w-[200px] border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
                        disabled={!formData?.category}
                      >
                        <option value="">चुनें</option>
                        {filteredSubCategories.map((s) => (
                          <option key={s.subcategory} value={s.subcategory}>{s.subcategory}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-medium">{formData?.subcategory || "N/A"}</span>
                    )}
                  </div>
                  {!isCreateMode && task?.assigned_to_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">नियुक्त:</span>
                      <span className="font-medium">{task?.assigned_to_id?.slice(0, 8)}...</span>
                    </div>
                  )}
                  {!isCreateMode && task?.created_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">बनाया गया:</span>
                      <span className="font-medium">
                        {new Date(task?.created_at).toLocaleDateString("hi-IN")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution / Closure Section - when resolved or cancelled */}
              {showResolutionBlock && (
                <div className={form.status === "cancelled" ? "bg-red-50 border border-red-200 p-4 rounded-lg space-y-4" : "bg-green-50 border border-green-200 p-4 rounded-lg space-y-4"}>
                  <h3 className={form.status === "cancelled" ? "font-semibold text-red-800" : "font-semibold text-green-800"}>
                    {form.status === "cancelled" ? "रद्द करने का कारण" : "समाधान विवरण"}
                  </h3>
                  
                  {form.status !== "cancelled" && (
                    <div>
                      <label className="font-semibold text-gray-700 block mb-2">
                        वास्तविक समाधान तिथि
                      </label>
                      <input
                        type="date"
                        value={formData?.resolved_date ? new Date(formData.resolved_date).toISOString().split('T')[0] : ""}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        readOnly
                      />
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-gray-700 block mb-2">
                      {form.status === "cancelled" ? "रद्द करने का कारण / टिप्पणियाँ" : "समाधान टिप्पणियाँ"}
                    </label>
                    <textarea
                      value={form.resolution_comments || ""}
                      onChange={(e) => handleChange("resolution_comments", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      rows={4}
                      placeholder={form.status === "cancelled" ? "रद्द करने का कारण दर्ज करें..." : "समाधान टिप्पणियाँ दर्ज करें..."}
                    />
                  </div>

                  {form.status !== "cancelled" && (
                    <div>
                      <label className="font-semibold text-gray-700 block mb-2">
                        निरीक्षण टिप्पणी
                      </label>
                      <textarea
                        value={form.observation || ""}
                        onChange={(e) => handleChange("observation", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        rows={4}
                        placeholder="निरीक्षण टिप्पणी दर्ज करें..."
                      />
                    </div>
                  )}
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

          {/* Work Orders + Notes side by side */}
          <div className="border-t pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Work Orders Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700 text-lg">
                  कार्य आदेश ({taskWorkOrders.length})
                </h3>
              <button
                type="button"
                disabled={isCreateMode}
                onClick={() => {
                  setEditingWorkOrder(null);
                  setShowWorkOrderModal(true);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Work Order
              </button>
              </div>
              {isCreateMode && (
                <p className="text-sm text-gray-500 mb-3">Save task first to add work orders.</p>
              )}
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
                      onClick={() => setActiveWorkOrder(workOrder)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition cursor-pointer"
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

            {/* Notes Section - beside Work Orders, only for saved task */}
            {!isCreateMode && task?.task_id && (
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 min-h-[200px]">
                <h3 className="font-semibold text-gray-700 text-lg mb-3">Notes</h3>
                <NotesInterface relatedType="task" relatedId={task.task_id} />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
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

      {showWorkOrderModal && task?.task_id && (
        <WorkOrderModal
          isOpen={showWorkOrderModal}
          onClose={() => {
            setShowWorkOrderModal(false);
            setEditingWorkOrder(null);
          }}
          editing={editingWorkOrder}
          onSubmit={async (data) => {
            try {
              if (editingWorkOrder?.work_order_id) {
                await cropCycleAPI.updateWorkOrder(task.task_id, editingWorkOrder.work_order_id, data);
              } else {
                await cropCycleAPI.createWorkOrder(task.task_id, data);
              }
              setShowWorkOrderModal(false);
              setEditingWorkOrder(null);
              loadTaskData();
            } catch (err) {
              console.error("Failed to save work order:", err);
              alert(err.response?.data?.detail || "Failed to save work order");
            }
          }}
          cropCycleId={cycleId}
          taskId={task.task_id}
          workers={users || []}
        />
      )}

      {/* Work Order Drawer */}
      {activeWorkOrder && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => {
              setActiveWorkOrder(null);
              setActiveWorkOrderTab("resources");
            }}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-white shadow-2xl z-50 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-b">
              <div>
                <h3 className="text-lg font-bold">कार्य आदेश विवरण</h3>
                <p className="text-sm text-blue-100">{activeWorkOrder.work_order_number || 'N/A'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingWorkOrder(activeWorkOrder);
                    setShowWorkOrderModal(true);
                  }}
                  className="text-white hover:bg-white/20 px-3 py-2 rounded-lg transition text-sm font-medium"
                >
                  संपादित करें
                </button>
                <button
                  onClick={() => {
                    setActiveWorkOrder(null);
                    setActiveWorkOrderTab("resources");
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-4">
              {/* Work Order Number */}
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">
                  कार्य आदेश संख्या
                </label>
                <p className="text-lg font-bold text-gray-900">
                  {activeWorkOrder.work_order_number || 'N/A'}
                </p>
              </div>

              {/* Short Description */}
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">
                  संक्षिप्त विवरण
                </label>
                <p className="text-gray-900">
                  {activeWorkOrder.short_description || 'No description'}
                </p>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">
                  स्थिति
                </label>
                <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${getWorkOrderStatusColor(activeWorkOrder.status)}`}>
                  {activeWorkOrder.status || 'N/A'}
                </span>
              </div>

              {/* Due Date */}
              {activeWorkOrder.due_date && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1">
                    अंतिम तिथि
                  </label>
                  <p className="text-gray-900">
                    {new Date(activeWorkOrder.due_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Created At */}
              {activeWorkOrder.created_at && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1">
                    बनाया गया
                  </label>
                  <p className="text-gray-900">
                    {new Date(activeWorkOrder.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Description (if available) */}
              {activeWorkOrder.description && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 block mb-1">
                    विवरण
                  </label>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {activeWorkOrder.description}
                  </p>
                </div>
              )}

              <div className="mt-6 border-b border-gray-200">
                <div className="flex space-x-8">
                  <button
                    type="button"
                    onClick={() => setActiveWorkOrderTab("resources")}
                    className={`pb-3 text-sm font-medium ${
                      activeWorkOrderTab === "resources"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    संसाधन
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkOrderTab("notes")}
                    className={`pb-3 text-sm font-medium ${
                      activeWorkOrderTab === "notes"
                        ? "border-b-2 border-blue-600 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Notes
                  </button>
                </div>
              </div>

              {activeWorkOrderTab === "resources" && (
                <>
                  {/* Resources Section */}
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">संसाधन</h4>
                      {activeWorkOrder && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingResource(null);
                            setResourceForm({
                              resource_type: "",
                              name: "",
                              qty: "",
                              unit: "",
                              rate: "",
                              cost: ""
                            });
                            setShowAddResourceModal(true);
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                        >
                          + संसाधन जोड़ें
                        </button>
                      )}
                    </div>
                    
                    {loadingResources ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">संसाधन लोड हो रहे हैं...</p>
                      </div>
                    ) : workOrderResources.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-500 text-sm">अभी तक कोई संसाधन नहीं जोड़ा गया</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">प्रकार</th>
                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">नाम</th>
                                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">मात्रा</th>
                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700">इकाई</th>
                                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">दर</th>
                                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700">लागत</th>
                                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-700 w-24">कार्रवाई</th>
                              </tr>
                            </thead>
                            <tbody>
                              {workOrderResources.map((resource) => (
                                <tr
                                  key={resource.work_order_resources_id}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                  <td className="py-2 px-3 text-sm text-gray-700">
                                    {resource.resource_type || 'N/A'}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-900 font-medium">
                                    {resource.name || 'N/A'}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-700 text-right">
                                    {resource.qty?.toLocaleString() || '0'}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-700">
                                    {resource.unit || 'N/A'}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-700 text-right">
                                    {resource.rate ? `₹${resource.rate.toLocaleString()}` : '-'}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-900 font-semibold text-right">
                                    ₹{Number(resource.cost || 0).toLocaleString()}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-right">
                                    <div className="flex justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingResource(resource);
                                          setResourceForm({
                                            resource_type: resource.resource_type || "",
                                            name: resource.name || "",
                                            qty: resource.qty != null ? String(resource.qty) : "",
                                            unit: resource.unit || "",
                                            rate: resource.rate != null ? String(resource.rate) : "",
                                            cost: resource.cost != null ? String(resource.cost) : ""
                                          });
                                          setShowAddResourceModal(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 font-medium"
                                      >
                                        संपादित
                                      </button>
                                      <button
                                        type="button"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (!window.confirm("क्या आप इस संसाधन को हटाना चाहते हैं?")) return;
                                          try {
                                            await cropCycleAPI.deleteWorkOrderResource(
                                              activeWorkOrder.work_order_id,
                                              resource.work_order_resources_id
                                            );
                                            await loadResources(activeWorkOrder.work_order_id);
                                          } catch (err) {
                                            console.error("Failed to delete resource:", err);
                                            alert(err.response?.data?.detail || "संसाधन हटाने में विफल");
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-800 font-medium"
                                      >
                                        हटाएं
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">कुल लागत:</span>
                            <span className="text-lg font-bold text-gray-900">
                              ₹{workOrderResources.reduce(
                                (sum, r) => sum + Number(r.cost || 0),
                                0
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {activeWorkOrderTab === "notes" && activeWorkOrder?.work_order_id && (
                <div className="p-6">
                  <NotesInterface
                    relatedType="work_order"
                    relatedId={activeWorkOrder.work_order_id}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Resource Modal - Outside drawer with higher z-index */}
      {showAddResourceModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]"
            onClick={() => {
              setShowAddResourceModal(false);
              setEditingResource(null);
              setResourceForm({
                resource_type: "",
                name: "",
                qty: "",
                unit: "",
                rate: "",
                cost: ""
              });
            }}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingResource ? "संसाधन संपादित करें" : "संसाधन जोड़ें"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddResourceModal(false);
                    setEditingResource(null);
                    setResourceForm({
                      resource_type: "",
                      name: "",
                      qty: "",
                      unit: "",
                      rate: "",
                      cost: ""
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Resource Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    संसाधन प्रकार
                  </label>
                  <select
                    value={resourceForm.resource_type}
                    onChange={(e) => {
                      const selectedType = e.target.value;
                      setResourceForm({
                        ...resourceForm,
                        resource_type: selectedType,
                        unit: unitMap[selectedType] || ""
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">चुनें</option>
                    <option value="labor">मज़दूर</option>
                    <option value="material">सामग्री</option>
                    <option value="fuel">ईंधन</option>
                    <option value="machine">मशीन</option>
                    <option value="service">परिवहन / सेवा</option>
                    <option value="water">पानी</option>
                    <option value="contract">ठेका</option>
                    <option value="construction">निर्माण</option>
                    <option value="other">अन्य</option>
                  </select>
                </div>

                {/* Name - only for other */}
                {resourceForm.resource_type === "other" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      नाम
                    </label>
                    <input
                      type="text"
                      value={resourceForm.name}
                      onChange={(e) => setResourceForm({...resourceForm, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2"
                      placeholder="संसाधन का नाम दर्ज करें"
                    />
                  </div>
                )}

                {/* Qty and Unit Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Qty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      मात्रा
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={resourceForm.qty}
                      onChange={(e) => setResourceForm({...resourceForm, qty: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                      required
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      इकाई
                    </label>
                    <input
                      type="text"
                      value={resourceForm.unit}
                      onChange={(e) => setResourceForm({...resourceForm, unit: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="kg, litre, hour, etc."
                      required
                    />
                  </div>
                </div>

                {/* Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    दर (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={resourceForm.rate}
                    onChange={(e) => setResourceForm({...resourceForm, rate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    दर दर्ज करने पर लागत स्वचालित रूप से गणना की जाएगी
                  </p>
                </div>

                {/* Preview Cost */}
                {(resourceForm.rate && resourceForm.qty) || resourceForm.cost ? (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">अनुमानित लागत:</p>
                    <p className="text-lg font-bold text-green-700">
                      ₹{previewCost ? Number(previewCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </p>
                  </div>
                ) : null}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddResourceModal(false);
                      setEditingResource(null);
                      setResourceForm({
                        resource_type: "",
                        name: "",
                        qty: "",
                        unit: "",
                        rate: "",
                        cost: ""
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition font-medium"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        !resourceForm.resource_type ||
                        !resourceForm.qty ||
                        !resourceForm.unit ||
                        (resourceForm.resource_type === "other" && !resourceForm.name)
                      ) {
                        alert("कृपया आवश्यक फ़ील्ड भरें");
                        return;
                      }

                      // Validate: either rate or cost must be provided
                      if (!resourceForm.rate && !resourceForm.cost) {
                        alert("कृपया दर या लागत दर्ज करें");
                        return;
                      }

                      try {
                        const payload = {
                          resource_type: resourceForm.resource_type,
                          name:
                            resourceForm.resource_type === "other"
                              ? resourceForm.name
                              : resourceForm.resource_type,
                          qty: Number(resourceForm.qty),
                          unit: resourceForm.unit,
                          rate: resourceForm.rate ? Number(resourceForm.rate) : null,
                        };

                        // Only send cost if rate is not provided (for fixed costs)
                        if (!resourceForm.rate) {
                          payload.cost = Number(resourceForm.cost);
                        }

                        if (editingResource?.work_order_resources_id) {
                          await cropCycleAPI.updateWorkOrderResource(
                            activeWorkOrder.work_order_id,
                            editingResource.work_order_resources_id,
                            payload
                          );
                        } else {
                          await cropCycleAPI.createWorkOrderResource(
                            activeWorkOrder.work_order_id,
                            payload
                          );
                        }

                        // Reload resources
                        await loadResources(activeWorkOrder.work_order_id);

                        // Close modal and reset form
                        setShowAddResourceModal(false);
                        setEditingResource(null);
                        setResourceForm({
                          resource_type: "",
                          name: "",
                          qty: "",
                          unit: "",
                          rate: "",
                          cost: ""
                        });

                        alert("संसाधन सफलतापूर्वक जोड़ा गया");
                      } catch (error) {
                        console.error("Failed to create resource:", error);
                        alert("संसाधन जोड़ने में विफल: " + (error.response?.data?.detail || error.message));
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                  >
                    सहेजें
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TaskDetailPage;
