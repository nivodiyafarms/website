import React, { useState, useEffect } from 'react';
import { X, ClipboardList, Bot } from 'lucide-react';
import ChatbotModal from './ChatbotModal';
import VoiceRecorder from './VoiceRecorder';
import { transformWorkOrderRequest } from '../utils/apiTransformers';

const WorkOrderModal = ({
  isOpen,
  onClose,
  onSubmit,
  cropCycleId,
  workers,
  editing = null,
}) => {
  const [activeTab, setActiveTab] = useState('notes');
  const [showChatbot, setShowChatbot] = useState(false);

  const [formData, setFormData] = useState({
    workOrderId: '',
    shortDesc: '',
    description: '',
    instructions: '',
    opened_by: '',
    assigned_to_id: '',
    status: 'current',
    holdReason: '',
    expectedDate: '',
    actualResolvedDate: '',
    resolutionComments: '',
    observation: '',
    comments: '',
    attachments: [],
    due_date: '',
  });

  /* ================= LOAD EDIT DATA ================= */
  useEffect(() => {
    if (editing) {
      setFormData({
        workOrderId: editing.workOrderId || '',
        shortDesc: editing.shortDesc || '',
        description: editing.description || '',
        instructions: editing.instructions || '',
        opened_by: editing.opened_by || '',
        assigned_to_id: editing.assigned_to_id || '',
        status: editing.status || 'current',
        holdReason: editing.holdReason || '',
        expectedDate: editing.expectedDate || '',
        actualResolvedDate: editing.actualResolvedDate || '',
        resolutionComments: editing.resolutionComments || '',
        observation: editing.observation || '',
        comments: editing.comments || '',
        attachments: editing.attachments || [],
        due_date: editing.due_date ? editing.due_date.split('T')[0] : '',
      });

      if (editing.status === 'Resolved') {
        setActiveTab('resolution');
      }
    }
  }, [editing]);

  /* ================= HANDLERS ================= */
  const handleChange = (field, value) => {
    if (field === 'status') {
      setFormData((prev) => ({
        ...prev,
        status: value,
        holdReason: value === 'On Hold' ? prev.holdReason : '',
        actualResolvedDate:
          value === 'Resolved'
            ? new Date().toISOString().split('T')[0]
            : prev.actualResolvedDate,
      }));

      setActiveTab(value === 'Resolved' ? 'resolution' : 'notes');
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, attachments: Array.from(e.target.files) });
  };

  const handleVoiceRecordingComplete = async (blob, field) => {
    try {
      const fd = new FormData();
      fd.append('file', blob, 'recording.wav');

      const res = await fetch(
        `http://localhost:8000/crop-cycle-incidents/${cropCycleId}/tasks/voice/upload`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: fd,
        }
      );

      const data = await res.json();
      if (data.transcript) {
        setFormData((p) => ({
          ...p,
          [field]: `${p[field]} ${data.transcript}`.trim(),
        }));
      }
    } catch {
      alert('Voice recording failed');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.shortDesc || !formData.description || !formData.assigned_to_id) {
      alert('संक्षिप्त विवरण, विवरण और Assigned To आवश्यक है');
      return;
    }

    // Transform form data to match backend schema
    const transformedData = transformWorkOrderRequest({
      crop_cycle_id: cropCycleId,
      ...formData,
      due_date: formData.due_date || null,
    });

    onSubmit(transformedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-5xl rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto"
      >
        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center px-6 py-4 bg-green-600 text-white rounded-t-3xl">
          <div className="flex items-center gap-2">
            <ClipboardList />
            <h2 className="text-xl font-bold">
              {editing ? 'Edit Work Order' : 'Create Work Order'}
            </h2>
          </div>

          <div className="flex gap-3">
            {!editing && (
              <button
                type="button"
                onClick={() => setShowChatbot(true)}
                className="bg-blue-600 px-3 py-1 rounded flex gap-2"
              >
                <Bot size={18} /> AI
              </button>
            )}
            <button type="button" onClick={onClose}>
              <X />
            </button>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="p-6 space-y-6">

          {/* WORK ORDER ID - Display only if exists, otherwise show info */}
          {formData.workOrderId ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <label className="text-sm font-medium text-blue-900 block mb-1">Work Order ID (Auto-generated)</label>
              <p className="text-lg font-semibold text-blue-700">{formData.workOrderId}</p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Note:</span> ID will be auto-generated (e.g., WO0001)
              </p>
            </div>
          )}

          {/* SHORT DESCRIPTION */}
          <div>
            <label className="font-medium">संक्षिप्त विवरण *</label>
            <input
              className="w-full border p-2 rounded-xl"
              value={formData.shortDesc}
              onChange={(e) => handleChange('shortDesc', e.target.value)}
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div className="relative">
            <label className="font-medium">विवरण *</label>
            <textarea
              rows={3}
              className="w-full border rounded-xl p-2 pr-12"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
            <VoiceRecorder
              onRecordingComplete={(blob) =>
                handleVoiceRecordingComplete(blob, 'description')
              }
              customButton
              buttonClassName="absolute top-2 right-2"
            />
          </div>

          {/* INSTRUCTIONS */}
          <div className="relative">
            <label className="font-medium">सौंपा गया (नाम)</label>
            <textarea
              rows={2}
              className="w-full border rounded-xl p-2 pr-12"
              value={formData.instructions}
              onChange={(e) => handleChange('instructions', e.target.value)}
            />
            <VoiceRecorder
              onRecordingComplete={(blob) =>
                handleVoiceRecordingComplete(blob, 'instructions')
              }
              customButton
              buttonClassName="absolute top-2 right-2"
            />
          </div>

          {/* ASSIGNED + DUE DATE */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="font-medium">को सौंपना *</label>
              <select
                className="w-full border p-2 rounded-xl"
                value={formData.assigned_to_id}
                onChange={(e) => handleChange('assigned_to_id', e.target.value)}
                required
              >
                <option value="">कार्यकर्ता चुनें</option>
                {workers.map((w) => (
                  <option key={w.user_id} value={w.user_id}>
                    {w.name} ({w.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium">नियत तारीख</label>
              <input
                type="date"
                className="w-full border p-2 rounded-xl"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
              />
            </div>
          </div>

          {/* STATUS */}
          <div>
            <label className="font-medium">स्थिति</label>
            <select
              className="w-full border p-2 rounded-xl"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="current">वर्तमान चरण</option>
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
                rows={2}
                className="w-full mt-2 border rounded-xl p-2"
                placeholder="रोकने का कारण"
                value={formData.holdReason}
                onChange={(e) => handleChange('holdReason', e.target.value)}
              />
            )}
          </div>

          {/* ================= TABS ================= */}
          <div className="flex gap-8 border-t pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`pb-2 ${
                activeTab === 'notes'
                  ? 'border-b-2 border-green-600 text-green-600 font-semibold'
                  : 'text-gray-500'
              }`}
            >
              Notes
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('resolution')}
              className={`pb-2 ${
                activeTab === 'resolution'
                  ? 'border-b-2 border-green-600 text-green-600 font-semibold'
                  : 'text-gray-500'
              }`}
            >
              Resolution Information
            </button>
          </div>

          {/* NOTES */}
          {activeTab === 'notes' && (
            <textarea
              rows={3}
              className="w-full border rounded-xl p-2"
              placeholder="टिप्पणियाँ"
              value={formData.comments}
              onChange={(e) => handleChange('comments', e.target.value)}
            />
          )}

          {/* RESOLUTION */}
          {activeTab === 'resolution' && (
            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
              <label className="font-medium">वास्तविक समाधान तिथि</label>
              <input
                type="date"
                className="w-full border p-2 rounded-xl"
                value={formData.actualResolvedDate}
                onChange={(e) =>
                  handleChange('actualResolvedDate', e.target.value)
                }
              />

              <textarea
                className="w-full border rounded-xl p-2"
                placeholder="समाधान टिप्पणियाँ"
                value={formData.resolutionComments}
                onChange={(e) =>
                  handleChange('resolutionComments', e.target.value)
                }
              />

              <textarea
                className="w-full border rounded-xl p-2"
                placeholder="निरीक्षण टिप्पणी"
                value={formData.observation}
                onChange={(e) => handleChange('observation', e.target.value)}
              />
            </div>
          )}

          {/* ATTACHMENTS */}
          <input type="file" multiple onChange={handleFileChange} />

          {/* ACTIONS */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2 border rounded-xl">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-xl">
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </form>

      {showChatbot && (
        <ChatbotModal
          isOpen
          onClose={() => setShowChatbot(false)}
          formType="work_order"
          cropCycleId={cropCycleId}
          workers={workers}
        />
      )}
    </div>
  );
};

export default WorkOrderModal;
