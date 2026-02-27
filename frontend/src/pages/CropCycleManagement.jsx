// frontend/src/pages/CropCycleManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ArrowLeft, Edit, FileText, Mic } from 'lucide-react';
import WorkflowBar from '../components/WorkflowBar';
import NotesInterface from '../components/NotesInterface';
import { cropCycleAPI, fieldAPI, userAPI } from '../services/api';
import CropCycleModal from '../components/CropCycleModal';

const CropCycleManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cycleId = searchParams.get('cycle');

  const [viewMode, setViewMode] = useState('list'); // 'list', 'cycle-detail'
  const [cropCycles, setCropCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [breadcrumb, setBreadcrumb] = useState([{ name: 'Crop Cycles', id: null }]);
  const [activeTab, setActiveTab] = useState('tasks');

  const [currentUser, setCurrentUser] = useState(null);
  const [fields, setFields] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);

  const fetchFieldsAndUsers = async () => {
    try {
      const [f, u] = await Promise.all([
        fieldAPI.getAll(),
        userAPI.getAll(),
      ]);
      setFields(f.data || []);
      setUsers(u.data || []);
    } catch (err) {
      console.error('Failed to fetch fields/users:', err);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    fetchFieldsAndUsers();
    if (cycleId) {
      loadCycleDetail(cycleId);
    } else {
      loadCropCycles();
    }
  }, [cycleId]);

  const loadCropCycles = async () => {
    setLoading(true);
    try {
      const response = await cropCycleAPI.getAllCycles();
      setCropCycles(response.data || []);
      setViewMode('list');
      setBreadcrumb([{ name: 'Crop Cycles', id: null }]);
    } catch (error) {
      console.error('Failed to load crop cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCycleDetail = async (id) => {
    setLoading(true);
    try {
      const [cycleRes, tasksRes] = await Promise.all([
        cropCycleAPI.getCycleById(id),
        cropCycleAPI.getTasks(id)
      ]);
      const cycle = cycleRes.data;
      const taskList = tasksRes.data || [];
      setSelectedCycle(cycle);
      setTasks(taskList);
      setViewMode('cycle-detail');
      setBreadcrumb([
        { name: 'Crop Cycles', id: null },
        { name: `${cycle.crop_name} - ${cycle.field_code}`, id: id }
      ]);
    } catch (error) {
      console.error('Failed to load cycle details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (id, index) => {
    if (!id) {
      // Navigate to root (list view)
      navigate('/crop-cycle-management');
      loadCropCycles();
    } else if (index === 1) {
      // Navigate to cycle detail
      navigate(`/crop-cycle-management?cycle=${id}`);
    }
    // Add more navigation levels as needed
  };

  const handleOpenCycle = (cycle) => {
    navigate(`/crop-cycle-management?cycle=${cycle.crop_cycle_id}`);
  };

  const handleOpenTask = (task) => {
    navigate(`/crop-cycles/${selectedCycle.crop_cycle_id}/tasks/${task.task_id}`);
  };

  const handleBack = () => {
    navigate('/crop-cycle-management');
  };

  const handleSaveCycle = async (data) => {
    try {
      if (editingCycle) {
        await cropCycleAPI.updateCycle(editingCycle.crop_cycle_id, data);
        setShowCycleModal(false);
        setEditingCycle(null);
        if (viewMode === 'cycle-detail' && selectedCycle?.crop_cycle_id === editingCycle?.crop_cycle_id) {
          loadCycleDetail(editingCycle.crop_cycle_id);
        } else {
          loadCropCycles();
        }
      } else {
        await cropCycleAPI.createCycle(data);
        setShowCycleModal(false);
        loadCropCycles();
      }
    } catch (err) {
      console.error("BACKEND ERROR FULL RESPONSE:", err.response?.data);
      alert(JSON.stringify(err.response?.data));
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this crop cycle?"
    );
    if (!confirmDelete) return;
    try {
      await cropCycleAPI.deleteCycle(selectedCycle.crop_cycle_id);
      navigate('/crop-cycle-management');
    } catch (error) {
      console.error("Delete failed", error);
      alert("Delete failed");
    }
  };

  const updateStage = async (newStage) => {
    const stageLower = typeof newStage === 'string'
      ? newStage.toLowerCase()
      : newStage;

    try {
      await cropCycleAPI.updateCycle(selectedCycle.crop_cycle_id, {
        current_stage: stageLower
      });

      // Optimistic update (no reload)
      setSelectedCycle(prev => ({
        ...prev,
        current_stage: stageLower
      }));
    } catch (error) {
      console.error('Failed to update stage:', error);
      alert('Failed to update stage');
    }
  };

  const getStatusColor = (status) => {
    // Normalize status to uppercase for lookup (handles both lowercase and uppercase)
    const statusUpper = status?.toUpperCase();
    const colors = {
      OPEN: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      NEW: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      ON_HOLD: 'bg-orange-100 text-orange-800',
      RESOLVED: 'bg-green-100 text-green-800',
      REOPENED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[statusUpper] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      SEV_1: 'bg-red-500 text-white',
      SEV_2: 'bg-orange-500 text-white',
      SEV_3: 'bg-yellow-500 text-white',
      SEV_4: 'bg-green-500 text-white',
    };
    return colors[severity] || 'bg-gray-500 text-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // ========== LIST VIEW ==========
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
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span>New Crop Cycle</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cropCycles.map((cycle) => (
            <div
              key={cycle.crop_cycle_id}
              onClick={() => handleOpenCycle(cycle)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6 border-l-4 border-primary-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{cycle.crop_name}</h3>
                  <p className="text-sm text-gray-600">{cycle.field_code} • {cycle.seed_category || 'No variety'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(cycle.status)}`}>
                  {cycle.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Stage:</span>
                  <span className="font-semibold text-primary-600">{cycle.current_stage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sowing:</span>
                  <span>{new Date(cycle.sowing_date).toLocaleDateString()}</span>
                </div>
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
          ))}
        </div>

        <CropCycleModal
          isOpen={showCycleModal}
          onClose={() => {
            setShowCycleModal(false);
            setEditingCycle(null);
          }}
          onSubmit={handleSaveCycle}
          fields={fields}
          supervisors={users}
          editing={editingCycle}
        />
      </div>
    );
  }

  // ========== CYCLE DETAIL VIEW ==========
  if (viewMode === 'cycle-detail' && selectedCycle) {
    return (
      <div className="max-w-7xl mx-auto p-6">

        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Crop Cycles</span>
        </button>

        {/* Executive Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">

          <div className="px-8 py-6 flex justify-between items-start border-b border-gray-100">
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">
                CROP CYCLE ID: {selectedCycle.incident_no ?? selectedCycle.crop_cycle_id ?? '—'}
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">
                {selectedCycle.crop_name}
                {selectedCycle.seed_category && ` - ${selectedCycle.seed_category}`}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Field {selectedCycle.field_code}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-4 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedCycle.status)}`}>
                {selectedCycle.status}
              </span>
              {["open", "reopened"].includes(
                selectedCycle.status?.toLowerCase()
              ) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCycle(selectedCycle);
                    setShowCycleModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit crop cycle"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 px-8 py-6">
            <WorkflowBar
              currentStage={selectedCycle.current_stage}
              onStageChange={updateStage}
              editable={true}
            />
          </div>

        </div>

        {/* Meta Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Sowing Date</p>
            <p className="text-xl font-semibold mt-1">
              {new Date(selectedCycle.sowing_date).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Expected Harvest</p>
            <p className="text-xl font-semibold mt-1">
              {selectedCycle.expected_harvest_date
                ? new Date(selectedCycle.expected_harvest_date).toLocaleDateString()
                : "Not set"}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Current Stage</p>
            <p className="text-xl font-semibold text-green-600 mt-1 capitalize">
              {selectedCycle.current_stage}
            </p>
          </div>

        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === "tasks"
                ? "border-b-2 border-green-600 text-green-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Tasks ({tasks.length})
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`ml-6 px-6 py-3 text-sm font-medium ${
              activeTab === "notes"
                ? "border-b-2 border-green-600 text-green-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Notes
          </button>
        </div>

        {activeTab === "tasks" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Tasks & Activities</h3>
                <p className="text-sm text-gray-500 mt-0.5">{tasks.length} total tasks</p>
              </div>
              <button
                onClick={() => {
                  navigate(`/crop-cycles/${selectedCycle.crop_cycle_id}/tasks/new`);
                }}
                className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
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
              <div className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <div
                    key={task.task_id}
                    onClick={() => handleOpenTask(task)}
                    className="p-6 hover:bg-gray-50/50 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{task.short_description}</h4>
                          {task.is_voice_recorded === "true" && (
                            <Mic className="w-4 h-4 text-blue-600" />
                          )}
                          {task.severity && (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityColor(task.severity)}`}>
                              {task.severity}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            {task.task_type}
                          </span>
                          <span>₹{(task.total_cost || 0).toLocaleString()}</span>
                          {task.occurred_at && (
                            <span>{new Date(task.occurred_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <NotesInterface
              relatedType="crop_cycle"
              relatedId={selectedCycle.crop_cycle_id}
            />
          </div>
        )}

        <CropCycleModal
          isOpen={showCycleModal}
          onClose={() => {
            setShowCycleModal(false);
            setEditingCycle(null);
          }}
          onSubmit={handleSaveCycle}
          fields={fields}
          supervisors={users}
          editing={editingCycle}
        />
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default CropCycleManagement;


