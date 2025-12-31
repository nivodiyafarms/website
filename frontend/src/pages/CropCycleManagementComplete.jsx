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
  const [loadingStates, setLoadingStates] = useState({
    cycles: false,
    cycleDetail: false,
    tasks: false,
    workOrders: false,
  });
  const [breadcrumb, setBreadcrumb] = useState([{ name: 'Crop Cycles', id: null }]);
  
  const [fields, setFields] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Cache for cycle details
  const [cache, setCache] = useState({
    cycles: null,
    cycleDetails: {}, // { cycleId: { cycle, tasks, workOrders, timestamp } }
  });
  const CACHE_TTL = 30000; // 30 seconds
  
  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

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
    // Check cache first
    if (cache.cycles && (Date.now() - cache.cycles.timestamp) < CACHE_TTL) {
      setCropCycles(cache.cycles.data);
      setViewMode('list');
      setBreadcrumb([{ name: 'Crop Cycles', id: null }]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadingStates(prev => ({ ...prev, cycles: true }));
    try {
      const response = await cropCycleIncidentAPI.getAllCycles();
      setCropCycles(response.data);
      setViewMode('list');
      setBreadcrumb([{ name: 'Crop Cycles', id: null }]);
      // Update cache
      setCache(prev => ({
        ...prev,
        cycles: { data: response.data, timestamp: Date.now() }
      }));
    } catch (error) {
      console.error('Failed to load crop cycles:', error);
      // Don't show alert, just log - allow cached data to show if available
    } finally {
      setLoading(false);
      setLoadingStates(prev => ({ ...prev, cycles: false }));
    }
  };

  // Check cache before loading
  const loadCycleDetail = async (id, forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh && cache.cycleDetails[id]) {
      const cached = cache.cycleDetails[id];
      if ((Date.now() - cached.timestamp) < CACHE_TTL) {
        setSelectedCycle(cached.cycle);
        setTasks(cached.tasks);
        setWorkOrders(cached.workOrders);
        setViewMode('cycle-detail');
        setBreadcrumb([
          { name: 'Crop Cycles', id: null },
          { name: `${cached.cycle.crop_name} - ${cached.cycle.field_id}`, id: id }
        ]);
        setLoading(false);
        
        if (taskId) {
          const task = cached.tasks.find(t => t.task_id === taskId);
          if (task) {
            setSelectedTask(task);
            setViewMode('task-detail');
            setBreadcrumb(prev => [...prev, { name: task.short_description, id: taskId }]);
          }
        }
        return;
      }
    }

    setLoading(true);
    setLoadingStates(prev => ({ ...prev, cycleDetail: true, tasks: true, workOrders: true }));
    
    try {
      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        cropCycleIncidentAPI.getCycleById(id),
        cropCycleIncidentAPI.getTasks(id),
        cropCycleIncidentAPI.getWorkOrders(id),
      ]);
      
      // Handle cycle result
      if (results[0].status === 'fulfilled') {
        setSelectedCycle(results[0].value.data);
      } else {
        console.error('Failed to load cycle:', results[0].reason);
        // Don't show alert if we have cached data
        if (!cache.cycleDetails[id]) {
          showToast('Failed to load cycle details', 'error');
        }
      }
      
      // Handle tasks result
      if (results[1].status === 'fulfilled') {
        setTasks(results[1].value.data);
      } else {
        console.error('Failed to load tasks:', results[1].reason);
        // Use cached tasks if available
        if (cache.cycleDetails[id]?.tasks) {
          setTasks(cache.cycleDetails[id].tasks);
        }
      }
      
      // Handle work orders result
      if (results[2].status === 'fulfilled') {
        setWorkOrders(results[2].value.data);
      } else {
        console.error('Failed to load work orders:', results[2].reason);
        // Use cached work orders if available
        if (cache.cycleDetails[id]?.workOrders) {
          setWorkOrders(cache.cycleDetails[id].workOrders);
        }
      }
      
      // Only set view mode if we got the cycle data
      if (results[0].status === 'fulfilled') {
        setViewMode('cycle-detail');
        setBreadcrumb([
          { name: 'Crop Cycles', id: null },
          { name: `${results[0].value.data.crop_name} - ${results[0].value.data.field_id}`, id: id }
        ]);
        
        if (taskId && results[1].status === 'fulfilled') {
          const task = results[1].value.data.find(t => t.task_id === taskId);
          if (task) {
            setSelectedTask(task);
            setViewMode('task-detail');
            setBreadcrumb(prev => [...prev, { name: task.short_description, id: taskId }]);
          }
        }
        
        // Update cache
        setCache(prev => ({
          ...prev,
          cycleDetails: {
            ...prev.cycleDetails,
            [id]: {
              cycle: results[0].value.data,
              tasks: results[1].status === 'fulfilled' ? results[1].value.data : prev.cycleDetails[id]?.tasks || [],
              workOrders: results[2].status === 'fulfilled' ? results[2].value.data : prev.cycleDetails[id]?.workOrders || [],
              timestamp: Date.now()
            }
          }
        }));
      }
    } catch (error) {
      console.error('Failed to load cycle details:', error);
      // Only show toast if no cached data available
      if (!cache.cycleDetails[id]) {
        showToast('Failed to load cycle details', 'error');
      }
    } finally {
      setLoading(false);
      setLoadingStates(prev => ({ ...prev, cycleDetail: false, tasks: false, workOrders: false }));
    }
  };

  // Selective refresh functions
  const refreshTasks = async (cycleId) => {
    setLoadingStates(prev => ({ ...prev, tasks: true }));
    try {
      const response = await cropCycleIncidentAPI.getTasks(cycleId);
      setTasks(response.data);
      // Update cache
      setCache(prev => ({
        ...prev,
        cycleDetails: {
          ...prev.cycleDetails,
          [cycleId]: {
            ...prev.cycleDetails[cycleId],
            tasks: response.data,
            timestamp: Date.now()
          }
        }
      }));
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, tasks: false }));
    }
  };

  const refreshWorkOrders = async (cycleId) => {
    setLoadingStates(prev => ({ ...prev, workOrders: true }));
    try {
      const response = await cropCycleIncidentAPI.getWorkOrders(cycleId);
      setWorkOrders(response.data);
      // Update cache
      setCache(prev => ({
        ...prev,
        cycleDetails: {
          ...prev.cycleDetails,
          [cycleId]: {
            ...prev.cycleDetails[cycleId],
            workOrders: response.data,
            timestamp: Date.now()
          }
        }
      }));
    } catch (error) {
      console.error('Failed to refresh work orders:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, workOrders: false }));
    }
  };

  const refreshCycle = async (cycleId) => {
    setLoadingStates(prev => ({ ...prev, cycleDetail: true }));
    try {
      const response = await cropCycleIncidentAPI.getCycleById(cycleId);
      setSelectedCycle(response.data);
      // Update cache
      setCache(prev => ({
        ...prev,
        cycleDetails: {
          ...prev.cycleDetails,
          [cycleId]: {
            ...prev.cycleDetails[cycleId],
            cycle: response.data,
            timestamp: Date.now()
          }
        }
      }));
    } catch (error) {
      console.error('Failed to refresh cycle:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, cycleDetail: false }));
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
    const isUpdate = !!editingCycle;
    const cycleId = editingCycle?.incident_id;
    
    // Optimistic update
    if (isUpdate) {
      // Update local state immediately
      const optimisticCycle = {
        ...selectedCycle,
        ...data,
        incident_id: selectedCycle.incident_id,
        incident_no: selectedCycle.incident_no,
      };
      setSelectedCycle(optimisticCycle);
      
      // Update in cache
      setCache(prev => ({
        ...prev,
        cycleDetails: {
          ...prev.cycleDetails,
          [cycleId]: {
            ...prev.cycleDetails[cycleId],
            cycle: optimisticCycle,
            timestamp: Date.now()
          }
        }
      }));
    } else {
      // For new cycles, add optimistically to list
      const tempId = `temp-${Date.now()}`;
      const optimisticCycle = {
        incident_id: tempId,
        incident_no: 'IN0000',
        field_id: data.field_id,
        crop_name: data.crop_name,
        crop_variety: data.crop_variety,
        sowing_date: data.sowing_date,
        expected_harvest_date: data.expected_harvest_date,
        current_stage: data.current_stage || 'SOWING',
        status: data.status || 'OPEN',
        ...data,
      };
      setCropCycles(prev => [...prev, optimisticCycle]);
    }
    
    setShowCycleModal(false);
    setEditingCycle(null);
    
    // Sync with server in background
    try {
      if (isUpdate) {
        await cropCycleIncidentAPI.updateCycle(cycleId, data);
        // Refresh to get server data
        refreshCycle(cycleId);
        showToast('Crop cycle updated successfully!', 'success');
      } else {
        const response = await cropCycleIncidentAPI.createCycle(data);
        // Replace optimistic cycle with real data
        setCropCycles(prev => {
          const filtered = prev.filter(c => !c.incident_id.startsWith('temp-'));
          return [...filtered, response.data];
        });
        // Navigate to detail view
        navigate(`/crop-cycle-management?cycle=${response.data.incident_id}`);
        // Load detail (will use cache if available)
        loadCycleDetail(response.data.incident_id, true);
        showToast(`Crop cycle created successfully! ID: ${response.data.incident_no || 'N/A'}`, 'success');
      }
    } catch (error) {
      console.error('Failed to save crop cycle:', error);
      
      // Revert optimistic update
      if (isUpdate) {
        refreshCycle(cycleId);
      } else {
        setCropCycles(prev => prev.filter(c => !c.incident_id.startsWith('temp-')));
      }
      
      showToast(error.response?.data?.detail || 'Failed to save crop cycle', 'error');
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleSubmitTask = async (data) => {
    const isUpdate = !!editingTask;
    const taskId = editingTask?.task_id;
    
    // Optimistic update: Update UI immediately
    if (isUpdate) {
      // Find task in local state
      const taskIndex = tasks.findIndex(t => t.task_id === taskId);
      if (taskIndex !== -1) {
        const oldTask = tasks[taskIndex];
        // Create optimistic updated task
        const optimisticTask = {
          ...oldTask,
          ...data,
          // Keep existing IDs and timestamps
          task_id: oldTask.task_id,
          task_no: oldTask.task_no,
        };
        
        // Update local state immediately
        setTasks(prev => {
          const updated = [...prev];
          updated[taskIndex] = optimisticTask;
          return updated;
        });
        
        // Update selected task if it's the one being edited
        if (selectedTask?.task_id === taskId) {
          setSelectedTask(optimisticTask);
        }
      }
    } else {
      // Create new task optimistically
      const tempId = `temp-${Date.now()}`;
      const optimisticTask = {
        task_id: tempId,
        task_no: 'TA0000', // Temporary, will be replaced
        crop_cycle_id: selectedCycle.incident_id,
        short_description: data.short_description || 'New Task',
        description: data.description || '',
        task_type: data.task_type || 'other',
        status: data.status || 'new',
        total_cost: 0,
        ...data,
      };
      
      // Add to local state immediately
      setTasks(prev => [...prev, optimisticTask]);
    }
    
    // Close modal immediately
    setShowTaskModal(false);
    setEditingTask(null);
    
    // Sync with server in background
    try {
      if (isUpdate) {
        await cropCycleIncidentAPI.updateTask(selectedCycle.incident_id, taskId, data);
        // Refresh tasks to get server data (with proper IDs, timestamps, etc.)
        refreshTasks(selectedCycle.incident_id);
        showToast('Task updated successfully!', 'success');
      } else {
        const response = await cropCycleIncidentAPI.createTask(selectedCycle.incident_id, data);
        // Replace optimistic task with real data from server
        setTasks(prev => {
          const filtered = prev.filter(t => !t.task_id.startsWith('temp-'));
          return [...filtered, response.data];
        });
        // Update cache
        setCache(prev => ({
          ...prev,
          cycleDetails: {
            ...prev.cycleDetails,
            [selectedCycle.incident_id]: {
              ...prev.cycleDetails[selectedCycle.incident_id],
              tasks: [...(prev.cycleDetails[selectedCycle.incident_id]?.tasks || []).filter(t => !t.task_id.startsWith('temp-')), response.data],
              timestamp: Date.now()
            }
          }
        }));
        showToast(`Task created successfully! ID: ${response.data.task_no || 'N/A'}`, 'success');
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      
      // Revert optimistic update on error
      if (isUpdate) {
        // Revert to previous state
        refreshTasks(selectedCycle.incident_id);
      } else {
        // Remove optimistic task
        setTasks(prev => prev.filter(t => !t.task_id.startsWith('temp-')));
      }
      
      showToast(error.response?.data?.detail || 'Failed to save task', 'error');
    }
  };

  const handleUpdateTask = () => {
    setEditingTask(selectedTask);
    setShowTaskModal(true);
  };

  const handleCloseTask = () => {
    // Set task to editing mode with status CLOSED
    // Map to Hindi status for the form, backend will convert it
    setEditingTask({
      ...selectedTask,
      status: 'बंद', // Hindi status for form, will be converted to 'closed' by transformer
    });
    setShowTaskModal(true);
  };

  const handleCreateWorkOrder = () => {
    setEditingWorkOrder(null);
    setShowWorkOrderModal(true);
  };

  const handleSubmitWorkOrder = async (data) => {
    const isUpdate = !!editingWorkOrder;
    const workOrderId = editingWorkOrder?.work_order_id;
    
    // Optimistic update
    if (isUpdate) {
      const workOrderIndex = workOrders.findIndex(wo => wo.work_order_id === workOrderId);
      if (workOrderIndex !== -1) {
        const oldWorkOrder = workOrders[workOrderIndex];
        const optimisticWorkOrder = {
          ...oldWorkOrder,
          ...data,
          work_order_id: oldWorkOrder.work_order_id,
          work_order_no: oldWorkOrder.work_order_no,
        };
        setWorkOrders(prev => {
          const updated = [...prev];
          updated[workOrderIndex] = optimisticWorkOrder;
          return updated;
        });
      }
    } else {
      const tempId = `temp-wo-${Date.now()}`;
      const optimisticWorkOrder = {
        work_order_id: tempId,
        work_order_no: 'WO0000',
        crop_cycle_id: selectedCycle.incident_id,
        title: data.title || data.shortDesc || 'New Work Order',
        description: data.description || '',
        status: data.status || 'open',
        ...data,
      };
      setWorkOrders(prev => [...prev, optimisticWorkOrder]);
    }
    
    setShowWorkOrderModal(false);
    setEditingWorkOrder(null);
    
    // Sync with server in background
    try {
      let response;
      if (isUpdate) {
        response = await cropCycleIncidentAPI.updateWorkOrder(
          selectedCycle.incident_id,
          workOrderId,
          data
        );
        refreshWorkOrders(selectedCycle.incident_id);
        showToast('Work order updated successfully!', 'success');
      } else {
        response = await cropCycleIncidentAPI.createWorkOrder(
          selectedCycle.incident_id,
          data
        );
        
        // Replace optimistic work order with real data
        setWorkOrders(prev => {
          const filtered = prev.filter(wo => !wo.work_order_id.startsWith('temp-wo-'));
          return [...filtered, response.data];
        });
        
        // Open WorkOrderResource screen
        setSelectedWorkOrder(response.data);
        setShowWorkOrderResource(true);
        showToast(`Work order created successfully! ID: ${response.data.work_order_no || 'N/A'}`, 'success');
      }
    } catch (error) {
      console.error("Failed to save work order:", error);
      
      // Revert optimistic update
      if (isUpdate) {
        refreshWorkOrders(selectedCycle.incident_id);
      } else {
        setWorkOrders(prev => prev.filter(wo => !wo.work_order_id.startsWith('temp-wo-')));
      }
      
      showToast(error.response?.data?.detail || "Failed to save work order", 'error');
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

  // Only show full page loading for initial load
  if (loading && viewMode === 'list' && cropCycles.length === 0) {
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
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition">
                          {cycle.crop_name}
                        </h3>
                        {cycle.incident_no && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-mono font-semibold">
                            {cycle.incident_no}
                          </span>
                        )}
                      </div>
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
        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.message}
          </div>
        )}
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
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900">
                  {selectedCycle.crop_name} {selectedCycle.crop_variety && `- ${selectedCycle.crop_variety}`}
                </h2>
                {selectedCycle.incident_no && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-mono font-semibold">
                    {selectedCycle.incident_no}
                  </span>
                )}
              </div>
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

          {loadingStates.tasks ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading tasks...</span>
            </div>
          ) : tasks.length === 0 ? (
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
                    <div className="flex items-center space-x-2 flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm group-hover:text-primary-600">{task.short_description}</h4>
                      {task.task_no && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-mono font-semibold">
                          {task.task_no}
                        </span>
                      )}
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
        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.message}
          </div>
        )}
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
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{selectedTask.short_description}</h2>
                {selectedTask.task_no && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-mono font-semibold">
                    {selectedTask.task_no}
                  </span>
                )}
              </div>
            </div>
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

          {/* Update/Close Task Buttons - Prominently placed near header */}
          {selectedTask.status !== 'closed' && selectedTask.status !== 'CLOSED' && 
           selectedTask.status !== 'cancelled' && selectedTask.status !== 'CANCELLED' && (
            <div className="mb-6 flex items-center justify-end space-x-3 pb-4 border-b">
              <button
                onClick={handleUpdateTask}
                className="px-4 py-2 border-2 border-primary-500 text-primary-700 rounded-lg hover:bg-primary-50 transition flex items-center space-x-2 font-semibold"
              >
                <Edit className="w-5 h-5" />
                <span>Update Task</span>
              </button>
              <button
                onClick={handleCloseTask}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex items-center space-x-2 font-semibold shadow-md"
              >
                <AlertCircle className="w-5 h-5" />
                <span>Close Task</span>
              </button>
            </div>
          )}

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
                      <div className="flex items-center space-x-2 flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600">{order.title}</h4>
                        {order.work_order_no && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-mono font-semibold">
                            {order.work_order_no}
                          </span>
                        )}
                      </div>
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
            {/* Only show Update/Close buttons if task is not already closed/cancelled */}
            {selectedTask.status !== 'closed' && selectedTask.status !== 'CLOSED' && 
             selectedTask.status !== 'cancelled' && selectedTask.status !== 'CANCELLED' && (
              <>
                <button
                  onClick={handleUpdateTask}
                  className="px-4 py-2 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Update Task</span>
                </button>
                <button
                  onClick={handleCloseTask}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex items-center space-x-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Close Task</span>
                </button>
              </>
            )}
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
              Back
            </button>
          </div>
        </div>

        {/* Modals */}
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSubmit={handleSubmitTask}
          cropCycleId={selectedCycle.incident_id}
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



