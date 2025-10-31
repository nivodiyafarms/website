import React, { useState, useEffect } from 'react';
import { X, ClipboardList, Bot, Mic } from 'lucide-react';
import ChatbotModal from './ChatbotModal';
import VoiceRecorder from './VoiceRecorder';

const WorkOrderModal = ({ isOpen, onClose, onSubmit, cropCycleId, workers, editing = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    assigned_to_id: '',
    due_date: '',
  });
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    if (editing) {
      setFormData({
        title: editing.title || '',
        description: editing.description || '',
        instructions: editing.instructions || '',
        assigned_to_id: editing.assigned_to_id || '',
        due_date: editing.due_date ? editing.due_date.split('T')[0] : '',
      });
    }
  }, [editing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      crop_cycle_id: cropCycleId,
      ...formData,
      due_date: formData.due_date || null,
    };
    
    onSubmit(payload);
  };

  const handleChatbotComplete = (data) => {
    // Update form data with chatbot results
    setFormData({
      title: data.form_data.title || '',
      description: data.form_data.description || '',
      instructions: data.form_data.instructions || '',
      assigned_to_id: data.form_data.assigned_to_id || '',
      due_date: data.form_data.due_date || '',
    });
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
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <ClipboardList className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {editing ? 'Edit Work Order' : 'Create Work Order'}
            </h2>
          </div>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title / Summary <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Short subject line for the work order"
              maxLength="200"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description / Instructions <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                rows="5"
                placeholder="Detailed guidance for the worker on what needs to be done..."
                required
              ></textarea>
              <VoiceRecorder
                onRecordingComplete={(blob) => handleVoiceRecordingComplete(blob, 'description')}
                customButton={true}
                buttonClassName="absolute top-2 right-2 p-2 rounded-lg transition"
                iconClassName="w-5 h-5"
              />
            </div>
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Instructions
            </label>
            <div className="relative">
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                rows="4"
                placeholder="Step-by-step instructions, safety guidelines, or special notes..."
              ></textarea>
              <VoiceRecorder
                onRecordingComplete={(blob) => handleVoiceRecordingComplete(blob, 'instructions')}
                customButton={true}
                buttonClassName="absolute top-2 right-2 p-2 rounded-lg transition"
                iconClassName="w-5 h-5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To (Worker/Supervisor) <span className="text-red-500">*</span>
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
                    {worker.name} ({worker.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Work orders help assign and track work. The assigned worker will see this in their dashboard and can create tasks linked to this order.
            </p>
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
              {editing ? 'Update Work Order' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </div>

      {/* Chatbot Modal */}
      <ChatbotModal
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        formType="work_order"
        cropCycleId={cropCycleId}
        workers={workers}
        onFormComplete={handleChatbotComplete}
      />
    </div>
  );
};

export default WorkOrderModal;



