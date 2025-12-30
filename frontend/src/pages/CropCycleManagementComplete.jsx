import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Edit, Trash2, FileText, Mic, ClipboardList, Package, AlertCircle } from 'lucide-react';
import WorkflowBar from '../components/WorkflowBar';
import BreadcrumbNav from '../components/BreadcrumbNav';
import CropCycleModal from '../components/CropCycleModal';
import TaskModal from '../components/TaskModal';
import WorkOrderModal from '../components/WorkOrderModal';
import WorkOrderResource from '../components/WorkOrderResoucre';
import NotesInterface from '../components/NotesInterface';
import { cropCycleIncidentAPI, fieldAPI, userAPI } from '../services/api';

const CropCycleManagementComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cycleId = searchParams.get('cycle');
  const taskId = searchParams.get('task');
  
  const [viewMode, setViewMode] = useState('list');
  const [cropCycles, setCropCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [breadcrumb, setBreadcrumb] = useState([{ name: 'Crop Cycles', id: null }]);
  
  const [fields, setFields] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Modal states
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [showWorkOrderResource, setShowWorkOrderResource] = useState(false);


  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    fetchFieldsAndUsers();
    
    if (cycleId) {
      loadCycleDetail(cycleId);
    } else {
      loadCropCycles();
    }
  }, [cycleId, taskId]);

  const fetchFieldsAndUsers = async () => {
    try {
      const [fieldsRes, usersRes] = await Promise.all([
        fieldAPI.getAll(),
        userAPI.getAll(),
      ]);
      setFields(fieldsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch fields/users:', error);
    }
  };

  const loadCropCycles = async () => {
    setLoading(true);
    try {
      const response = await cropCycleIncidentAPI.getAllCycles();
      setCropCycles(response.data);
      setViewMode('list');
      setBreadcrumb([{ name: 'Crop Cycles', id: null }]);
    } catch (error) {
      console.error('Failed to load crop cycles:', error);
      alert('Failed to load crop cycles');
    } finally {
      setLoading(false);
    }
  };

  const loadCycleDetail = async (id) => {
    setLoading(true);
    try {
      const [cycleRes, tasksRes, ordersRes] = await Promise.all([
        cropCycleIncidentAPI.getCycleById(id),
        cropCycleIncidentAPI.getTasks(id),
        cropCycleIncidentAPI.getWorkOrders(id),
      ]);
      
      setSelectedCycle(cycleRes.data);
      setTasks(tasksRes.data);
      setWorkOrders(ordersRes.data);
      setViewMode('cycle-detail');
      setBreadcrumb([
        { name: 'Crop Cycles', id: null },
        { name: `${cycleRes.data.crop_name} - ${cycleRes.data.field_id}`, id: id }
      ]);
      
      if (taskId) {
        const task = tasksRes.data.find(t => t.task_id === taskId);
        if (task) {
          setSelectedTask(task);
          setViewMode('task-detail');
          setBreadcrumb(prev => [...prev, { name: task.short_description, id: taskId }]);
        }
      }
    } catch (error) {
      console.error('Failed to load cycle details:', error);
      alert('Failed to load cycle details');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (id, index) => {
    if (!id) {
      navigate('/crop-cycle-management');
      loadCropCycles();
    } else if (index === 1) {
      navigate(`/crop-cycle-management?cycle=${id}`);
      setViewMode('cycle-detail');
      setSelectedTask(null);
    }
  };

  const handleOpenCycle = (cycle) => {
    navigate(`/crop-cycle-management?cycle=${cycle.incident_id}`);
  };

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setViewMode('task-detail');
    setBreadcrumb(prev => [...prev, { name: task.short_description, id: task.task_id }]);
  };

  const handleBack = () => {
    if (viewMode === 'task-detail') {
      setViewMode('cycle-detail');
      setSelectedTask(null);
      setBreadcrumb(prev => prev.slice(0, -1));
    } else if (viewMode === 'cycle-detail') {
      navigate('/crop-cycle-management');
    }
  };

  // Modal handlers
  const handleCreateCycle = () => {
    setEditingCycle(null);
    setShowCycleModal(true);
  };

  const handleEditCycle = (cycle) => {
    setEditingCycle(cycle);
    setShowCycleModal(true);
  };

  const handleSubmitCycle = async (data) => {
    try {
      if (editingCycle) {
        await cropCycleIncidentAPI.updateCycle(editingCycle.incident_id, data);
      } else {
        await cropCycleIncidentAPI.createCycle(data);
      }
      setShowCycleModal(false);
      setEditingCycle(null);
      
      if (viewMode === 'list') {
        loadCropCycles();
      } else {
        loadCycleDetail(selectedCycle.incident_id);
      }
    } catch (error) {
      console.error('Failed to save crop cycle:', error);
      alert(error.response?.data?.detail || 'Failed to save crop cycle');
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleSubmitTask = async (data) => {
    try {
      await cropCycleIncidentAPI.createTask(selectedCycle.incident_id, data);
      setShowTaskModal(false);
      loadCycleDetail(selectedCycle.incident_id);
    } catch (error) {
      console.error('Failed to create task:', error);
      alert(error.response?.data?.detail || 'Failed to create task');
    }
  };

  const handleCreateWorkOrder = () => {
    setEditingWorkOrder(null);
    setShowWorkOrderModal(true);
  };

  const handleSubmitWorkOrder = async (data) => {
  try {
    const response = await cropCycleIncidentAPI.createWorkOrder(
      selectedCycle.incident_id,
      data
    );

    // ✅ Close WorkOrder modal
    setShowWorkOrderModal(false);

    // ✅ Open WorkOrderResource screen
    setSelectedWorkOrder(response.data);
    setShowWorkOrderResource(true);

    // Refresh cycle data
    loadCycleDetail(selectedCycle.incident_id);
  } catch (error) {
    console.error("Failed to create work order:", error);
    alert(error.response?.data?.detail || "Failed to create work order");
  }
};


  const handleDeleteCycle = async (id) => {
    if (window.confirm('Are you sure? This will delete the crop cycle and all its tasks!')) {
      try {
        await cropCycleIncidentAPI.deleteCycle(id);
        loadCropCycles();
      } catch (error) {
        console.error('Failed to delete:', error);
        alert('Failed to delete crop cycle');
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      try {
        await cropCycleIncidentAPI.deleteTask(selectedCycle.incident_id, taskId);
        loadCycleDetail(selectedCycle.incident_id);
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task');
      }
    }
  };

  const updateStage = async (newStage) => {
    try {
      await cropCycleIncidentAPI.updateCycle(selectedCycle.incident_id, {
        current_stage: newStage
      });
      loadCycleDetail(selectedCycle.incident_id);
    } catch (error) {
      console.error('Failed to update stage:', error);
      alert('Failed to update stage');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      OPEN: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      NEW: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      ON_HOLD: 'bg-orange-100 text-orange-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
            <h1 className="text-3xl font-bold text-gray-900">🌾 Crop Cycle Management</h1>
            <p className="text-gray-600 mt-1">Track crops from sowing to payment - Complete lifecycle management</p>
          </div>
          <button
            onClick={handleCreateCycle}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>New Crop Cycle</span>
          </button>
        </div>

        {cropCycles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No crop cycles yet. Create one to get started!</p>
            <button
              onClick={handleCreateCycle}
              className="mt-4 text-primary-600 hover:text-primary-700 font-semibold"
            >
              Create Your First Crop Cycle →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cropCycles.map((cycle) => (
              <div
                key={cycle.incident_id}
                className="bg-white rounded-lg shadow hover:shadow-xl transition cursor-pointer border-l-4 border-primary-500 group"
              >
                <div onClick={() => handleOpenCycle(cycle)} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition">
                        {cycle.crop_name}
                      </h3>
                      <p className="text-sm text-gray-600">{cycle.field_id} • {cycle.crop_variety || 'No variety'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(cycle.status)}`}>
                      {cycle.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Current Stage:</span>
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
                    <p className="text-sm text-gray-700 line-clamp-2 mb-4">{cycle.short_description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(['SOWING', 'GERMINATION', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'HARVEST', 'STORAGE', 'SALE', 'PAYMENT'].indexOf(cycle.current_stage) + 1) / 9 * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditCycle(cycle); }}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCycle(cycle.incident_id); }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        <CropCycleModal
          isOpen={showCycleModal}
          onClose={() => { setShowCycleModal(false); setEditingCycle(null); }}
          onSubmit={handleSubmitCycle}
          fields={fields}
          supervisors={users.filter(u => u.role === 'SUPERVISOR' || u.role === 'ADMIN')}
          editing={editingCycle}
        />
      </div>
    );
  }

  // ========== CYCLE DETAIL VIEW ==========
  if (viewMode === 'cycle-detail' && selectedCycle) {
    return (
      <div className="p-6">
        <BreadcrumbNav path={breadcrumb} onNavigate={handleNavigate} />
        
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Crop Cycles</span>
        </button>

        {/* Workflow Progress Bar */}
        <WorkflowBar 
          currentStage={selectedCycle.current_stage} 
          onStageChange={updateStage}
          editable={true}
        />

        {/* Crop Cycle Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {selectedCycle.crop_name} {selectedCycle.crop_variety && `- ${selectedCycle.crop_variety}`}
              </h2>
              <p className="text-gray-600 mt-1">{selectedCycle.short_description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedCycle.status)}`}>
                {selectedCycle.status}
              </span>
              <button 
                onClick={() => handleEditCycle(selectedCycle)}
                className="text-primary-600 hover:text-primary-800 p-2 hover:bg-primary-50 rounded transition"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">Field</p>
              <p className="text-2xl font-bold text-blue-900">{selectedCycle.field_id}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-medium">Sowing Date</p>
              <p className="text-lg font-bold text-green-900">{new Date(selectedCycle.sowing_date).toLocaleDateString()}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700 font-medium">Expected Harvest</p>
              <p className="text-lg font-bold text-purple-900">
                {selectedCycle.expected_harvest_date 
                  ? new Date(selectedCycle.expected_harvest_date).toLocaleDateString()
                  : 'Not set'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 font-medium">Total Tasks</p>
              <p className="text-2xl font-bold text-orange-900">{tasks.length}</p>
            </div>
          </div>

          {selectedCycle.description && (
            <div className="mb-4 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{selectedCycle.description}</p>
            </div>
          )}

          {selectedCycle.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">📝 Notes</h3>
              <p className="text-yellow-800">{selectedCycle.notes}</p>
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">📋 Tasks & Activities</h3>
            <button
              onClick={handleCreateTask}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              <span>Add Task</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No tasks yet. Create your first task to get started!</p>
              <button
                onClick={handleCreateTask}
                className="mt-4 text-primary-600 hover:text-primary-700 font-semibold"
              >
                Create Your First Task →
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.task_id}
                  onClick={() => handleOpenTask(task)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900 text-sm group-hover:text-primary-600">{task.short_description}</h4>
                      {task.is_voice_recorded === 'true' && (
                        <Mic className="w-3 h-3 text-blue-600" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.severity && (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSeverityColor(task.severity)}`}>
                          {task.severity}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-600">
                    <span>{task.task_type}</span>
                    <span>•</span>
                    <span className="font-semibold text-green-600">₹{task.total_cost.toLocaleString()}</span>
                    {task.occurred_at && (
                      <>
                        <span>•</span>
                        <span>{new Date(task.occurred_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="mt-6">
          <NotesInterface cropCycleId={selectedCycle.incident_id} />
        </div>

        {/* Modals */}
        <CropCycleModal
          isOpen={showCycleModal}
          onClose={() => { setShowCycleModal(false); setEditingCycle(null); }}
          onSubmit={handleSubmitCycle}
          fields={fields}
          supervisors={users.filter(u => u.role === 'SUPERVISOR' || u.role === 'ADMIN')}
          editing={editingCycle}
        />

        <TaskModal
          isOpen={showTaskModal}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSubmit={handleSubmitTask}
          cropCycleId={selectedCycle?.incident_id}
          workers={users}
          editing={editingTask}
        />

        <WorkOrderModal
          isOpen={showWorkOrderModal}
          onClose={() => { setShowWorkOrderModal(false); setEditingWorkOrder(null); }}
          onSubmit={handleSubmitWorkOrder}
          cropCycleId={selectedCycle?.incident_id}
          workers={users}
          editing={editingWorkOrder}
        />
      </div>
    );
  }

  // ========== TASK DETAIL VIEW ==========
  if (viewMode === 'task-detail' && selectedTask) {
    return (
      <div className="p-6">
        <BreadcrumbNav path={breadcrumb} onNavigate={handleNavigate} />
        
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Crop Cycle</span>
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{selectedTask.short_description}</h2>
            <div className="flex items-center space-x-2">
              {selectedTask.severity && (
                <span className={`px-3 py-1 rounded text-sm font-bold ${getSeverityColor(selectedTask.severity)}`}>
                  {selectedTask.severity}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedTask.status)}`}>
                {selectedTask.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">Task Type</p>
              <p className="text-lg font-semibold text-blue-900">{selectedTask.task_type}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700">Total Cost</p>
              <p className="text-xl font-bold text-green-900">₹{selectedTask.total_cost.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-700">Labor</p>
              <p className="text-lg font-semibold text-purple-900">
                {selectedTask.labor_count || 0} workers × {selectedTask.labor_hours || 0}hrs
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-700">Status</p>
              <p className="text-lg font-semibold text-orange-900">{selectedTask.status}</p>
            </div>
          </div>

          {selectedTask.description && (
            <div className="mb-4 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{selectedTask.description}</p>
            </div>
          )}

          {selectedTask.outcome_observation && (
            <div className="mb-4 bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">✅ Outcome / Observation</h3>
              <p className="text-green-800">{selectedTask.outcome_observation}</p>
            </div>
          )}

          {selectedTask.transcript && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Mic className="w-4 h-4 mr-2" />
                Voice Transcript
              </h3>
              <p className="text-sm text-blue-800">{selectedTask.transcript}</p>
            </div>
          )}

          {/* Resources Table */}
          {selectedTask.resources && selectedTask.resources.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 mb-4 text-lg">📦 Resources Used</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost/Unit</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedTask.resources.map((resource) => (
                      <tr key={resource.resource_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{resource.resource_type}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{resource.name}</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">{resource.quantity}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{resource.unit}</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">
                          {resource.cost_per_unit ? `₹${resource.cost_per_unit.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                          ₹{resource.total_cost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-green-50 font-bold">
                      <td colSpan="5" className="px-6 py-4 text-right text-gray-900">TOTAL COST:</td>
                      <td className="px-6 py-4 text-right text-xl text-green-700">
                        ₹{selectedTask.total_cost.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Work Orders Section */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">📋 Work Orders</h3>
              <button
                onClick={handleCreateWorkOrder}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                <span>Create Work Order</span>
              </button>
            </div>

            {(() => {
              // Filter work orders that are linked to this task
              const taskWorkOrders = workOrders.filter(order => {
                if (!order.linked_task_ids) return false;
                try {
                  const linkedTasks = typeof order.linked_task_ids === 'string' 
                    ? JSON.parse(order.linked_task_ids) 
                    : order.linked_task_ids;
                  return Array.isArray(linkedTasks) && linkedTasks.includes(selectedTask.task_id);
                } catch {
                  return false;
                }
              });

              return taskWorkOrders.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No work orders yet for this task</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {taskWorkOrders.map((order) => (
                  <div
                    key={order.work_order_id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600">{order.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-600 mb-2">
                      {order.due_date && (
                        <>
                          <span>Due: {new Date(order.due_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    {order.description && (
                      <p className="text-sm text-gray-700 line-clamp-2">{order.description}</p>
                    )}
                    <div className="mt-2 flex items-center space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingWorkOrder(order); setShowWorkOrderModal(true); }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Edit className="w-4 h-4 inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={async (e) => { 
                          e.stopPropagation(); 
                          if (window.confirm('Delete this work order?')) {
                            try {
                              await cropCycleIncidentAPI.deleteWorkOrder(selectedCycle.incident_id, order.work_order_id);
                              loadCycleDetail(selectedCycle.incident_id);
                            } catch (error) {
                              console.error('Failed to delete work order:', error);
                              alert('Failed to delete work order');
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4 inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              );
            })()}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              onClick={() => handleDeleteTask(selectedTask.task_id)}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition"
            >
              Delete Task
            </button>
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Modals */}
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSubmit={handleSubmitTask}
          cropCycleId={selectedCycle.incident_id}
          workers={users}
          editing={editingTask}
        />

        <WorkOrderModal
          isOpen={showWorkOrderModal}
          onClose={() => { setShowWorkOrderModal(false); setEditingWorkOrder(null); }}
          onSubmit={handleSubmitWorkOrder}
          cropCycleId={selectedCycle.incident_id}
          workers={users}
          editing={editingWorkOrder}
        />
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default CropCycleManagementComplete;



