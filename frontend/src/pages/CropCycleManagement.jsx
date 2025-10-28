import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ArrowLeft, Edit, Trash2, FileText, Mic, CheckCircle, Clock } from 'lucide-react';
import WorkflowBar from '../components/WorkflowBar';
import BreadcrumbNav from '../components/BreadcrumbNav';
import NotesInterface from '../components/NotesInterface';
import api from '../services/api';

const CropCycleManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cycleId = searchParams.get('cycle');
  const taskId = searchParams.get('task');
  
  const [viewMode, setViewMode] = useState('list'); // 'list', 'cycle-detail', 'task-detail'
  const [cropCycles, setCropCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [breadcrumb, setBreadcrumb] = useState([{ name: 'Crop Cycles', id: null }]);
  
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    
    if (cycleId) {
      loadCycleDetail(cycleId);
    } else {
      loadCropCycles();
    }
  }, [cycleId, taskId]);

  const loadCropCycles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/crop-cycle-incidents/');
      setCropCycles(response.data);
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
        api.get(`/crop-cycle-incidents/${id}`),
        api.get(`/crop-cycle-incidents/${id}/tasks`)
      ]);
      
      setSelectedCycle(cycleRes.data);
      setTasks(tasksRes.data);
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
    navigate(`/crop-cycle-management?cycle=${cycle.incident_id}`);
  };

  const handleOpenTask = (task) => {
    navigate(`/crop-cycle-management?cycle=${selectedCycle.incident_id}&task=${task.task_id}`);
  };

  const handleBack = () => {
    if (viewMode === 'task-detail') {
      navigate(`/crop-cycle-management?cycle=${selectedCycle.incident_id}`);
    } else if (viewMode === 'cycle-detail') {
      navigate('/crop-cycle-management');
    }
  };

  const updateStage = async (newStage) => {
    try {
      await api.put(`/crop-cycle-incidents/${selectedCycle.incident_id}`, {
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
            <h1 className="text-3xl font-bold text-gray-900">Crop Cycle Management</h1>
            <p className="text-gray-600 mt-1">Manage crop cycles from sowing to payment</p>
          </div>
          <button
            onClick={() => {/* Open create modal */}}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span>New Crop Cycle</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cropCycles.map((cycle) => (
            <div
              key={cycle.incident_id}
              onClick={() => handleOpenCycle(cycle)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6 border-l-4 border-primary-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{cycle.crop_name}</h3>
                  <p className="text-sm text-gray-600">{cycle.field_id} • {cycle.crop_variety || 'No variety'}</p>
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
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
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

        {/* Crop Cycle Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCycle.crop_name} {selectedCycle.crop_variety && `- ${selectedCycle.crop_variety}`}
            </h2>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedCycle.status)}`}>
                {selectedCycle.status}
              </span>
              <button className="text-primary-600 hover:text-primary-800">
                <Edit className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Field</p>
              <p className="text-lg font-semibold">{selectedCycle.field_id}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Sowing Date</p>
              <p className="text-lg font-semibold">{new Date(selectedCycle.sowing_date).toLocaleDateString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Expected Harvest</p>
              <p className="text-lg font-semibold">
                {selectedCycle.expected_harvest_date 
                  ? new Date(selectedCycle.expected_harvest_date).toLocaleDateString()
                  : 'Not set'}
              </p>
            </div>
          </div>

          {selectedCycle.description && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600">{selectedCycle.description}</p>
            </div>
          )}

          {selectedCycle.notes && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-gray-600">{selectedCycle.notes}</p>
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Tasks & Activities</h3>
              <p className="text-sm text-gray-600">{tasks.length} total tasks</p>
            </div>
            <button
              onClick={() => {/* Open create task modal */}}
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
            <div className="divide-y">
              {tasks.map((task) => (
                <div
                  key={task.task_id}
                  onClick={() => handleOpenTask(task)}
                  className="p-6 hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{task.short_description}</h4>
                        {task.is_voice_recorded === 'true' && (
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
                        <span>₹{task.total_cost.toLocaleString()}</span>
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

        {/* Notes Section */}
        <NotesInterface cropCycleId={selectedCycle.incident_id} />
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
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Crop Cycle</span>
        </button>

        {/* Task Details */}
        <div className="bg-white rounded-lg shadow p-6">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Task Type</p>
              <p className="text-lg font-semibold">{selectedTask.task_type}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-lg font-semibold text-green-600">₹{selectedTask.total_cost.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Labor</p>
              <p className="text-lg font-semibold">
                {selectedTask.labor_count} workers × {selectedTask.labor_hours}hrs
              </p>
            </div>
          </div>

          {selectedTask.description && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{selectedTask.description}</p>
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

          {/* Resources */}
          {selectedTask.resources && selectedTask.resources.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 mb-4">Resources Used</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedTask.resources.map((resource) => (
                      <tr key={resource.resource_id}>
                        <td className="px-4 py-2 text-sm">{resource.resource_type}</td>
                        <td className="px-4 py-2 text-sm font-medium">{resource.name}</td>
                        <td className="px-4 py-2 text-sm text-right">{resource.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right">{resource.unit}</td>
                        <td className="px-4 py-2 text-sm text-right font-semibold text-green-600">
                          ₹{resource.total_cost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default CropCycleManagement;


