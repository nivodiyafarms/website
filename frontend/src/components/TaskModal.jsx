import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, Trash2, Calculator, Bot, Mic, MicOff } from 'lucide-react';
import ChatbotModal from './ChatbotModal';
import VoiceRecorder from './VoiceRecorder';

const TaskModal = ({ isOpen, onClose, onSubmit, cropCycleId, workers, editing = null }) => {
  // Voice recording removed; only manual entry is available
  const [formData, setFormData] = useState({
    task_type: 'OTHER',
    short_description: '',
    description: '',
    assigned_to_id: '',
    occurred_at: '',
    labor_count: '',
    labor_hours: '',
    outcome_observation: '',
    gps_lat: '',
    gps_lng: '',
  });

  const [resources, setResources] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [showChatbot, setShowChatbot] = useState(false);

  const taskTypes = [
    'IRRIGATION', 'FERTILIZER', 'PESTICIDE', 'FUNGICIDE', 'HERBICIDE',
    'WEEDING', 'LABOR', 'SPRAY', 'SCOUTING', 'TRANSPORT',
    'HARVEST', 'STORAGE_IN', 'STORAGE_OUT', 'SALE', 'PAYMENT', 'OTHER'
  ];

  const resourceTypes = ['LABOR', 'EQUIPMENT', 'MATERIAL', 'WATER', 'FUEL'];

  useEffect(() => {
    if (editing) {
      setFormData({
        task_type: editing.task_type || 'OTHER',
        short_description: editing.short_description || '',
        description: editing.description || '',
        assigned_to_id: editing.assigned_to_id || '',
        occurred_at: editing.occurred_at ? editing.occurred_at.split('T')[0] : '',
        labor_count: editing.labor_count || '',
        labor_hours: editing.labor_hours || '',
        outcome_observation: editing.outcome_observation || '',
        gps_lat: editing.gps_lat || '',
        gps_lng: editing.gps_lng || '',
      });
      setResources(editing.resources || []);
    }
  }, [editing]);

  useEffect(() => {
    const total = resources.reduce((sum, r) => sum + (parseFloat(r.total_cost) || 0), 0);
    setTotalCost(total);
  }, [resources]);

  const addResource = () => {
    setResources([
      ...resources,
      {
        resource_type: 'MATERIAL',
        name: '',
        quantity: '',
        unit: '',
        cost_per_unit: '',
        total_cost: 0,
      },
    ]);
  };

  const removeResource = (index) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const updateResource = (index, field, value) => {
    const updated = [...resources];
    updated[index][field] = value;
    
    // Auto-calculate total cost
    if (field === 'quantity' || field === 'cost_per_unit') {
      const qty = parseFloat(updated[index].quantity) || 0;
      const cost = parseFloat(updated[index].cost_per_unit) || 0;
      updated[index].total_cost = qty * cost;
    }
    
    setResources(updated);
  };

  const getSeverityFromCost = (cost) => {
    if (cost >= 50000) return { level: 'SEV-1', color: 'bg-red-500', label: 'Critical' };
    if (cost >= 20000) return { level: 'SEV-2', color: 'bg-orange-500', label: 'High' };
    if (cost >= 5000) return { level: 'SEV-3', color: 'bg-yellow-500', label: 'Medium' };
    return { level: 'SEV-4', color: 'bg-green-500', label: 'Low' };
  };

  const severity = getSeverityFromCost(totalCost);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      crop_cycle_id: cropCycleId,
      ...formData,
      labor_count: formData.labor_count ? parseInt(formData.labor_count) : null,
      labor_hours: formData.labor_hours ? parseFloat(formData.labor_hours) : null,
      gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
      gps_lng: formData.gps_lng ? parseFloat(formData.gps_lng) : null,
      occurred_at: formData.occurred_at || null,
      resources: resources.map(r => ({
        ...r,
        quantity: parseFloat(r.quantity),
        cost_per_unit: parseFloat(r.cost_per_unit) || 0,
        total_cost: parseFloat(r.total_cost),
      })),
    };
    
    onSubmit(payload);
  };

  const handleChatbotComplete = (data) => {
    // Update form data with chatbot results
    setFormData({
      task_type: data.form_data.task_type || 'OTHER',
      short_description: data.form_data.short_description || '',
      description: data.form_data.description || '',
      assigned_to_id: data.form_data.assigned_to_id || '',
      occurred_at: data.form_data.occurred_at || '',
      labor_count: data.form_data.labor_count || '',
      labor_hours: data.form_data.labor_hours || '',
      outcome_observation: data.form_data.outcome_observation || '',
      gps_lat: data.form_data.gps_lat || '',
      gps_lng: data.form_data.gps_lng || '',
    });
    setResources(data.form_data.resources || []);
    setShowChatbot(false);
  };

  // Voice recording handler for textareas
  const handleVoiceRecordingComplete = async (blob, fieldName) => {
    try {
      const formData = new FormData();
      formData.append('file', blob, 'recording.wav');
      
      // Use the voice upload endpoint to transcribe
      const response = await fetch('http://localhost:8000/crop-cycle-incidents/' + cropCycleId + '/tasks/voice/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.transcript) {
        // Append transcript to the existing text in the field
        setFormData(prev => ({
          ...prev,
          [fieldName]: (prev[fieldName] + ' ' + result.transcript).trim()
        }));
      }
    } catch (error) {
      console.error('Failed to process voice recording:', error);
      alert('Failed to process voice recording. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {editing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <div className="flex items-center space-x-2">
            {!editing && (
              <button
                onClick={() => setShowChatbot(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Bot className="w-4 h-4" />
                <span>AI Assistant</span>
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Voice recording tab removed */}

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.task_type}
                    onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  >
                    {taskTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.assigned_to_id}
                    onChange={(e) => setFormData({ ...formData, assigned_to_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  >
                    <option value="">Select Worker</option>
                    {workers.map((worker) => (
                      <option key={worker.user_id} value={worker.user_id}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="One-line summary of the task"
                    maxLength="200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occurred At (Date/Time)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.occurred_at}
                    onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Labor Count
                  </label>
                  <input
                    type="number"
                    value={formData.labor_count}
                    onChange={(e) => setFormData({ ...formData, labor_count: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Number of workers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Labor Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.labor_hours}
                    onChange={(e) => setFormData({ ...formData, labor_hours: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Hours worked"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (What was done - detailed)
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      rows="4"
                      placeholder="Detailed description of what was done..."
                    ></textarea>
                    <VoiceRecorder
                      onRecordingComplete={(blob) => handleVoiceRecordingComplete(blob, 'description')}
                      customButton={true}
                      buttonClassName="absolute top-2 right-2 p-2 rounded-lg transition"
                      iconClassName="w-5 h-5"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outcome / Observation
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.outcome_observation}
                      onChange={(e) => setFormData({ ...formData, outcome_observation: e.target.value })}
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      rows="3"
                      placeholder="Results, observations, or outcomes..."
                    ></textarea>
                    <VoiceRecorder
                      onRecordingComplete={(blob) => handleVoiceRecordingComplete(blob, 'outcome_observation')}
                      customButton={true}
                      buttonClassName="absolute top-2 right-2 p-2 rounded-lg transition"
                      iconClassName="w-5 h-5"
                    />
                  </div>
                </div>
              </div>

              {/* Resources Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
                    <p className="text-sm text-gray-600">Labor, Equipment, Materials, Water, Fuel</p>
                  </div>
                  <button
                    type="button"
                    onClick={addResource}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Resource</span>
                  </button>
                </div>

                {resources.length > 0 && (
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cost/Unit</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {resources.map((resource, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2">
                              <select
                                value={resource.resource_type}
                                onChange={(e) => updateResource(index, 'resource_type', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                {resourceTypes.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={resource.name}
                                onChange={(e) => updateResource(index, 'name', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Resource name"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.1"
                                value={resource.quantity}
                                onChange={(e) => updateResource(index, 'quantity', e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={resource.unit}
                                onChange={(e) => updateResource(index, 'unit', e.target.value)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="kg/L/hr"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={resource.cost_per_unit}
                                onChange={(e) => updateResource(index, 'cost_per_unit', e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-green-600">
                              ₹{(resource.total_cost || 0).toLocaleString()}
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeResource(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Total Cost & Severity */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calculator className="w-6 h-6 text-primary-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="text-2xl font-bold text-gray-900">₹{totalCost.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Auto-Severity</p>
                    <span className={`px-4 py-2 rounded-lg text-white font-bold ${severity.color}`}>
                      {severity.level} - {severity.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* GPS Location (Optional) */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">GPS Location (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.gps_lat}
                      onChange={(e) => setFormData({ ...formData, gps_lat: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="23.515"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.gps_lng}
                      onChange={(e) => setFormData({ ...formData, gps_lng: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="78.303"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition font-semibold"
                >
                  {editing ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
        </div>
      </div>

      {/* Chatbot Modal */}
      <ChatbotModal
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        formType="task"
        cropCycleId={cropCycleId}
        workers={workers}
        onFormComplete={handleChatbotComplete}
      />
    </div>
  );
};

export default TaskModal;



