import React, { useState, useEffect } from 'react';
import { X, Mic, FileText } from 'lucide-react';
import VoiceRecorder from './VoiceRecorder';

const CropCycleModal = ({ isOpen, onClose, onSubmit, fields, supervisors, editing = null }) => {
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState({
    field_id: '',
    crop_name: '',
    crop_variety: '',
    sowing_date: '',
    expected_harvest_date: '',
    current_stage: 'SOWING',
    status: 'OPEN',
    supervisor_id: '',
    short_description: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    if (editing) {
      setFormData({
        field_id: editing.field_id || '',
        crop_name: editing.crop_name || '',
        crop_variety: editing.crop_variety || '',
        sowing_date: editing.sowing_date ? editing.sowing_date.split('T')[0] : '',
        expected_harvest_date: editing.expected_harvest_date ? editing.expected_harvest_date.split('T')[0] : '',
        current_stage: editing.current_stage || 'SOWING',
        status: editing.status || 'OPEN',
        supervisor_id: editing.supervisor_id || '',
        short_description: editing.short_description || '',
        description: editing.description || '',
        notes: editing.notes || '',
      });
    }
  }, [editing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const stages = [
    'SOWING', 'GERMINATION', 'VEGETATIVE', 'FLOWERING',
    'FRUITING', 'HARVEST', 'STORAGE', 'SALE', 'PAYMENT'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {editing ? 'Edit Crop Cycle' : 'Create New Crop Cycle'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs - Only show for creation, not editing */}
        {!editing && (
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-semibold transition ${
                activeTab === 'manual'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Manual Entry</span>
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-semibold transition ${
                activeTab === 'voice'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mic className="w-5 h-5" />
              <span>Voice Recording</span>
            </button>
          </div>
        )}

        <div className="p-6">
          {activeTab === 'voice' && !editing ? (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">🎙️ Voice Recording Tips for Crop Cycle:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Mention field ID, crop name, and variety</li>
                  <li>• State sowing date and expected harvest date</li>
                  <li>• Describe the crop cycle plan</li>
                  <li>• Example: "Field F_001, wheat crop Lok-1 variety, sowed on October 12th, expecting harvest in April"</li>
                </ul>
              </div>
              <VoiceRecorder onRecordingComplete={(blob) => {/* Handle voice */}} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Field Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.field_id}
                    onChange={(e) => setFormData({ ...formData, field_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  >
                    <option value="">Select Field</option>
                    {fields.map((field) => (
                      <option key={field.field_id} value={field.field_id}>
                        {field.name} ({field.field_id}) - {field.area_acre} acres
                      </option>
                    ))}
                  </select>
                </div>

                {/* Crop Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.crop_name}
                    onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g., Wheat, Soybean"
                    required
                  />
                </div>

                {/* Crop Variety */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crop Variety
                  </label>
                  <input
                    type="text"
                    value={formData.crop_variety}
                    onChange={(e) => setFormData({ ...formData, crop_variety: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g., Lok-1, JS-335"
                  />
                </div>

                {/* Supervisor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervisor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.supervisor_id}
                    onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  >
                    <option value="">Select Supervisor</option>
                    {supervisors.map((sup) => (
                      <option key={sup.user_id} value={sup.user_id}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sowing Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sowing Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.sowing_date}
                    onChange={(e) => setFormData({ ...formData, sowing_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  />
                </div>

                {/* Expected Harvest Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Harvest Date
                  </label>
                  <input
                    type="date"
                    value={formData.expected_harvest_date}
                    onChange={(e) => setFormData({ ...formData, expected_harvest_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                {/* Current Stage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Stage
                  </label>
                  <select
                    value={formData.current_stage}
                    onChange={(e) => setFormData({ ...formData, current_stage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                {/* Short Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description (One-line summary)
                  </label>
                  <input
                    type="text"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Brief summary of this crop cycle"
                    maxLength="200"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Detailed 5-8 lines)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    rows="5"
                    placeholder="Detailed description of the crop cycle, plans, and expectations..."
                  ></textarea>
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Free text, misc info)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    rows="3"
                    placeholder="Any additional notes, warnings, or miscellaneous information..."
                  ></textarea>
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
                  {editing ? 'Update Crop Cycle' : 'Create Crop Cycle'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropCycleModal;



