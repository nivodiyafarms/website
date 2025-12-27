import React, { useState, useEffect } from 'react';
import { X, ClipboardList, Bot } from 'lucide-react';
import ChatbotModal from './ChatbotModal';
import VoiceRecorder from './VoiceRecorder';

const WorkOrderModal = ({ isOpen, onClose, onSubmit, cropCycleId, workers, editing = null }) => {
  const [formData, setFormData] = useState({
    shortDesc: '',
    description: '',
    instructions: '',
    assigned_to_id: '',
    status: 'New',
    holdReason: '',
    expectedDate: '',
    actualResolvedDate: '',
    resolutionComments: '',
    observation: '',
    comments: '',
    attachments: [],
    due_date: '',
  });

  const [showChatbot, setShowChatbot] = useState(false);

  // Load editing data
  useEffect(() => {
    if (editing) {
      setFormData({
        shortDesc: editing.shortDesc || '',
        description: editing.description || '',
        instructions: editing.instructions || '',
        assigned_to_id: editing.assigned_to_id || '',
        status: editing.status || 'New',
        holdReason: editing.holdReason || '',
        expectedDate: editing.expectedDate || '',
        actualResolvedDate: editing.actualResolvedDate || '',
        resolutionComments: editing.resolutionComments || '',
        observation: editing.observation || '',
        comments: editing.comments || '',
        attachments: editing.attachments || [],
        due_date: editing.due_date ? editing.due_date.split('T')[0] : '',
      });
    }
  }, [editing]);

  const handleChange = (field, value) => {
    if (field === 'status' && value !== 'On Hold') {
      setFormData({ ...formData, status: value, holdReason: '' });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, attachments: Array.from(e.target.files) });
  };

  const handleVoiceRecordingComplete = async (blob, fieldName) => {
    try {
      const uploadData = new FormData();
      uploadData.append('file', blob, 'recording.wav');

      const response = await fetch(
        `http://localhost:8000/crop-cycle-incidents/${cropCycleId}/tasks/voice/upload`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: uploadData,
        }
      );

      const result = await response.json();
      if (result.transcript) {
        setFormData((prev) => ({
          ...prev,
          [fieldName]: (prev[fieldName] + ' ' + result.transcript).trim(),
        }));
      }
    } catch (error) {
      console.error('Voice recording failed:', error);
      alert('Voice recording failed');
    }
  };

  const handleChatbotComplete = (data) => {
    setFormData((prev) => ({
      ...prev,
      ...data.form_data,
    }));
    setShowChatbot(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.shortDesc || !formData.description || !formData.assigned_to_id) {
      alert('Please fill in Short Description, Description, and Assigned To.');
      return;
    }
    const payload = {
      crop_cycle_id: cropCycleId,
      ...formData,
      due_date: formData.due_date || null,
    };
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              संक्षिप्त विवरण *
            </label>
            <input
              type="text"
              value={formData.shortDesc}
              onChange={(e) => handleChange('shortDesc', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Short description of work order"
              required
            />
          </div>

          {/* Description */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">विवरण *</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Detailed description"
              required
            />
            <VoiceRecorder
              onRecordingComplete={(blob) => handleVoiceRecordingComplete(blob, 'description')}
              customButton
              buttonClassName="absolute top-2 right-2 p-2 rounded-lg transition"
              iconClassName="w-5 h-5"
            />
          </div>

          {/* Instructions */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              अतिरिक्त निर्देश
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => handleChange('instructions', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Optional instructions"
            />
            <VoiceRecorder
              onRecordingComplete={(blob) => handleVoiceRecordingComplete(blob, 'instructions')}
              customButton
              buttonClassName="absolute top-2 right-2 p-2 rounded-lg transition"
              iconClassName="w-5 h-5"
            />
          </div>

          {/* Assigned & Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">को सौंपना*</label>
              <select
                value={formData.assigned_to_id}
                onChange={(e) => handleChange('assigned_to_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              >
                <option value="">कार्यकर्ता का चयन करें</option>
                {workers.map((w) => (
                  <option key={w.user_id} value={w.user_id}>
                    {w.name} ({w.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">नियत तारीख</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Status & Hold Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">स्थिति</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="New">नया</option>
              <option value="In Progress">प्रगति पर</option>
              <option value="On Hold">रोक पर</option>
              <option value="Resolved">समाधान किया गया</option>
              <option value="Reopen">पुनः खोला गया</option>
              <option value="Closed">बंद</option>
              <option value="Cancelled">रद्द किया गया</option>
            </select>

            {formData.status === 'On Hold' && (
              <textarea
                value={formData.holdReason}
                onChange={(e) => handleChange('holdReason', e.target.value)}
                rows={3}
                className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Reason for hold"
              />
            )}
          </div>

          {/* Resolution Section */}
          <div className="bg-gray-50 p-4 rounded-xl space-y-2">
            <label>अपेक्षित समाधान तिथि</label>
            <input
              type="date"
              value={formData.expectedDate}
              onChange={(e) => handleChange('expectedDate', e.target.value)}
              className="w-full border rounded-lg p-2"
            />

            <label>वास्तविक संकल्प तिथि</label>
            <input
              type="date"
              value={formData.actualResolvedDate}
              onChange={(e) => handleChange('actualResolvedDate', e.target.value)}
              className="w-full border rounded-lg p-2"
            />

            <label>संकल्प टिप्पणियाँ</label>
            <textarea
              value={formData.resolutionComments}
              onChange={(e) => handleChange('resolutionComments', e.target.value)}
              className="w-full border rounded-lg p-2"
            />

            <label>अवलोकन</label>
            <textarea
              value={formData.observation}
              onChange={(e) => handleChange('observation', e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Comments */}
          <div>
            <label>टिप्पणियाँ (कर्मचारी का नाम / ID)</label>
            <textarea
              value={formData.comments}
              onChange={(e) => handleChange('comments', e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Attachments */}
          <div>
            <label>संलग्नक</label>
            <input type="file" multiple onChange={handleFileChange} className="mt-1" />
            {formData.attachments.length > 0 && (
              <ul className="mt-2 list-disc list-inside">
                {formData.attachments.map((file, i) => (
                  <li key={i}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Buttons */}
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
