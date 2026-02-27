// frontend/src/pages/CropCycleManagementComplete.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Plus, ArrowLeft, Edit, Trash2, ClipboardList } from 'lucide-react';
import CropCycleModal from '../components/CropCycleModal';
import TaskModal from '../components/TaskModal';
import NotesInterface from '../components/NotesInterface';
import WorkOrderModal from '../components/WorkOrderModal';
import { cropCycleAPI, fieldAPI, userAPI } from '../services/api';

/* ---------------- SAFE NORMALIZER ---------------- */
const normalizeCycle = (cycle) => ({
  ...cycle,
  incident_id: cycle.crop_cycle_id || cycle.incident_id || cycle.id || null,  // ✅ Map crop_cycle_id to incident_id
});

const CropCycleManagementComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [viewMode, setViewMode] = useState('list');
  const [cropCycles, setCropCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fields, setFields] = useState([]);
  const [users, setUsers] = useState([]);

  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const [editingCycle, setEditingCycle] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  
  // Work Order Modal State
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [selectedWorkOrderTask, setSelectedWorkOrderTask] = useState(null);

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const cycleId = params.get("cycle");
    const taskId = params.get("task");
    const workOrderFlag = params.get("workOrder");

    fetchFieldsAndUsers();

    if (cycleId) {
      loadCycleDetail(cycleId);
    } else {
      loadCropCycles();
    }

    if (cycleId && taskId && workOrderFlag === "true") {
      setSelectedWorkOrderTask(taskId);
      setShowWorkOrderModal(true);
    } else {
      setShowWorkOrderModal(false);
      setSelectedWorkOrderTask(null);
    }
  }, [location.search]);

  const fetchFieldsAndUsers = async () => {
    try {
      const [f, u] = await Promise.all([
        fieldAPI.getAll(),
        userAPI.getAll()
      ]);
      setFields(f.data || []);
      setUsers(u.data || []);
    } catch (err) {
      console.error('Failed to fetch fields/users:', err);
    }
  };

  /* ---------------- LOAD LIST ---------------- */
  const loadCropCycles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cropCycleAPI.getAllCycles();
      console.log("GET ALL CROP CYCLES RESPONSE:", res.data);
      setCropCycles((res.data || []).map(normalizeCycle));
      setViewMode('list');
    } catch (err) {
      console.error('Failed to load crop cycles:', err);
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Cannot connect to server. Please check if the backend is running on http://localhost:8000');
      } else if (err.response?.status === 401) {
        setError('Please login to access crop cycles');
      } else {
        setError(err.response?.data?.detail || 'Failed to load crop cycles');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- LOAD DETAIL (HARD GUARD) ---------------- */
  const loadCycleDetail = async (id) => {
    console.log("loadCycleDetail CALLED WITH:", id);
    if (!id) {
      console.error('Invalid cycle ID:', id);
      setError('Invalid crop cycle ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log("CALLING DETAIL API WITH:", id);
      const [cycleRes, taskRes] = await Promise.all([
        cropCycleAPI.getCycleById(id),
        cropCycleAPI.getTasks(id),
      ]);

      setSelectedCycle(normalizeCycle(cycleRes.data));
      setTasks(taskRes.data || []);
      setViewMode('cycle-detail');
    } catch (err) {
      console.error('Failed to load cycle detail:', err);
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('Cannot connect to server. Please check if the backend is running.');
      } else {
        setError(err.response?.data?.detail || 'Failed to load crop cycle details');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CREATE / UPDATE CYCLE ---------------- */
  const handleSubmitCycle = async (data) => {
    const isUpdate = !!editingCycle;
    const id = editingCycle?.crop_cycle_id;

    setShowCycleModal(false);
    setEditingCycle(null);

    try {
      if (isUpdate) {
        await cropCycleAPI.updateCycle(id, data);
        await loadCycleDetail(id);
      } else {
        const res = await cropCycleAPI.createCycle(data);
        console.log("CREATE RESPONSE FULL:", res);
        console.log("CREATE RESPONSE DATA:", res.data);

        // Backend returns 'id', not 'crop_cycle_id' in response
        const cycleId = res.data.id || res.data.crop_cycle_id;
        if (!cycleId) {
          console.error('No cycle ID in response:', res.data);
          alert('Failed to get crop cycle ID. Please refresh the page.');
          return;
        }

        setCropCycles(prev =>
          prev.filter(
            c =>
              typeof c.crop_cycle_id === 'string' &&
              !c.crop_cycle_id.startsWith('temp-')
          ).concat(normalizeCycle(res.data))
        );

        navigate(`/crop-cycle-management?cycle=${cycleId}`);
      }
    } catch (err) {
      console.error('Failed to save crop cycle', err);
    }
  };

  /* ---------------- TASK SUBMIT ---------------- */
  const handleSubmitTask = async (data) => {
    const isUpdate = !!editingTask;
    const id = editingTask?.task_id;

    setShowTaskModal(false);
    setEditingTask(null);

    if (isUpdate) {
      await cropCycleAPI.updateTask(selectedCycle.incident_id, id, data);
    } else {
      const res = await cropCycleAPI.createTask(selectedCycle.incident_id, data);

      setTasks(prev =>
        prev.filter(
          t => typeof t.task_id === 'string' && !t.task_id.startsWith('temp-')
        ).concat(res.data)
      );
    }

    loadCycleDetail(selectedCycle.incident_id);
  };


  /* ---------------- DELETE CYCLE ---------------- */
  const handleDeleteCycle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this crop cycle?')) {
      return;
    }

    try {
      await cropCycleAPI.deleteCycle(id);
      navigate('/crop-cycle-management');
      loadCropCycles();
    } catch (err) {
      console.error('Failed to delete crop cycle:', err);
      console.error('Error response data:', err?.response?.data);
      console.error('Error detail:', err?.response?.data?.detail);

      // Handle nested detail object
      const detail = err?.response?.data?.detail;
      const message =
        (typeof detail === 'object' && detail?.message) ||  // If detail is object, get message
        (typeof detail === 'string' ? detail : null) ||     // If detail is string, use it
        err?.response?.data?.message ||                      // Fallback: direct message
        "Operation failed.";                                  // Final fallback

      alert(message);
    }
  };

  /* ---------------- HELPER FUNCTIONS ---------------- */
  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase();
    const colors = {
      OPEN: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      RESOLVED: 'bg-green-100 text-green-800',
      REOPENED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[statusUpper] || 'bg-gray-100 text-gray-800';
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && viewMode === 'list') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-semibold">Error</p>
          <p className="text-red-600">{error}</p>
        </div>
        <button
          onClick={loadCropCycles}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crop Cycle Management</h1>
            <p className="text-gray-600 mt-1">Manage crop cycles from sowing to payment</p>
          </div>
          <button
            onClick={() => {
              setEditingCycle(null);
              setShowCycleModal(true);
            }}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span>New Crop Cycle</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cropCycles.map(cycle => {
            console.log("RENDERING CYCLE OBJECT:", cycle);
            return (
            <div
              key={cycle.crop_cycle_id || cycle.id}
              onClick={() => navigate(`/crop-cycle-management?cycle=${cycle.id || cycle.crop_cycle_id}`)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6 border-l-4 border-green-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{cycle.crop_name || 'Unnamed Crop'}</h3>
                  <p className="text-sm text-gray-600">{cycle.field_code || 'No field'} • {cycle.season || 'No season'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(cycle.status)}`}>
                  {cycle.status || 'N/A'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Stage:</span>
                  <span className="font-semibold text-green-600">{cycle.current_stage || 'N/A'}</span>
                </div>
                {cycle.sowing_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sowing:</span>
                    <span>{new Date(cycle.sowing_date).toLocaleDateString()}</span>
                  </div>
                )}
                {cycle.expected_harvest_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Harvest:</span>
                    <span>{new Date(cycle.expected_harvest_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {cycle.short_description && (
                <p className="mt-4 text-sm text-gray-700 line-clamp-2">{cycle.short_description}</p>
              )}
            </div>
            );
          })}
        </div>

        {cropCycles.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No crop cycles yet</p>
            <button
              onClick={() => {
                setEditingCycle(null);
                setShowCycleModal(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
            >
              Create First Crop Cycle
            </button>
          </div>
        )}

        <CropCycleModal
          isOpen={showCycleModal}
          onClose={() => {
            setShowCycleModal(false);
            setEditingCycle(null);
          }}
          onSubmit={handleSubmitCycle}
          fields={fields}
          supervisors={users}
          editing={editingCycle}
        />
      </div>
    );
  }

  // Detail View
  if (!selectedCycle) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Crop cycle not found</p>
        </div>
        <button
          onClick={() => navigate('/crop-cycle-management')}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/crop-cycle-management')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Crop Cycles</span>
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Crop Cycle Details Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="mb-2">
              <p className="text-sm text-gray-500 font-medium">
                {selectedCycle.incident_no || ''}
              </p>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCycle.crop_name || 'Unnamed Crop'}
              {selectedCycle.seed_category && ` - ${selectedCycle.seed_category}`}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedCycle.status)}`}>
              {selectedCycle.status || 'N/A'}
            </span>
            <button
              onClick={() => {
                setEditingCycle(selectedCycle);
                setShowCycleModal(true);
              }}
              className="text-green-600 hover:text-green-800 p-2"
              title="Edit"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDeleteCycle(selectedCycle.crop_cycle_id)}
              className="text-red-600 hover:text-red-800 p-2"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Field</p>
            <p className="text-lg font-semibold">{selectedCycle.field_code || 'N/A'}</p>
          </div>
          {selectedCycle.sowing_date && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Sowing Date</p>
              <p className="text-lg font-semibold">{new Date(selectedCycle.sowing_date).toLocaleDateString()}</p>
            </div>
          )}
          {selectedCycle.expected_harvest_date && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Expected Harvest</p>
              <p className="text-lg font-semibold">{new Date(selectedCycle.expected_harvest_date).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {selectedCycle.description && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600">{selectedCycle.description}</p>
          </div>
        )}

        {selectedCycle.short_description && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Short Description</h3>
            <p className="text-gray-600">{selectedCycle.short_description}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-t pt-4">
        <div className="flex gap-6 mb-4">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center space-x-2 pb-2 ${
              activeTab === 'tasks'
                ? 'border-b-2 border-green-600 font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Tasks ({tasks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-2 ${
              activeTab === 'notes'
                ? 'border-b-2 border-green-600 font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Notes
          </button>
        </div>

        {/* Tasks Section */}
        {activeTab === 'tasks' && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Tasks & Activities</h3>
              <p className="text-sm text-gray-600">{tasks.length} total tasks</p>
            </div>
            <button
              onClick={() => {
                setEditingTask(null);
                setShowTaskModal(true);
              }}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              <span>Add Task</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No tasks yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="divide-y">
              {tasks.map((task) => (
                <div
                  key={task.task_id || task.id}
                  onClick={() => {
                    navigate(`/crop-cycles/${selectedCycle.crop_cycle_id}/tasks/${task.task_id}`);
                  }}
                  className="p-6 hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{task.short_description || 'Untitled Task'}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                        <span>{task.category || 'N/A'}</span>
                        {task.subcategory && <span>• {task.subcategory}</span>}
                        {task.total_expense && <span>₹{Number(task.total_expense).toLocaleString()}</span>}
                        {task.created_at && (
                          <span>{new Date(task.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                      {task.status || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Notes Section */}
        {activeTab === 'notes' && (
          <div className="mb-6">
            <NotesInterface relatedType="crop_cycle" relatedId={selectedCycle?.crop_cycle_id || selectedCycle?.incident_id} />
          </div>
        )}
      </div>

      {/* Modals */}
      <CropCycleModal
        isOpen={showCycleModal}
        onClose={() => {
          setShowCycleModal(false);
          setEditingCycle(null);
        }}
        onSubmit={handleSubmitCycle}
        fields={fields}
        supervisors={users}
        editing={editingCycle}
      />

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSubmit={handleSubmitTask}
        cropCycleId={selectedCycle.incident_id}
        editing={editingTask}
      />

      <WorkOrderModal
        isOpen={showWorkOrderModal}
        onClose={() => {
          setShowWorkOrderModal(false);
          setSelectedWorkOrderTask(null);
        }}
        onSubmit={async (data) => {
          try {
            await cropCycleAPI.createWorkOrder(
              selectedWorkOrderTask,  // task_id goes in URL
              data
            );

            await loadCycleDetail(selectedCycle?.crop_cycle_id);

            setShowWorkOrderModal(false);
            setSelectedWorkOrderTask(null);

          } catch (error) {
            console.error("Failed to create work order:", error);
            alert(
              error.response?.data?.detail ||
              "Failed to create work order"
            );
          }
        }}
        cropCycleId={selectedCycle?.crop_cycle_id}
        taskId={selectedWorkOrderTask}
        workers={users || []}
      />
    </div>
  );
};

export default CropCycleManagementComplete;
