import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, Bot } from 'lucide-react';
import ChatbotModal from './ChatbotModal';
import VoiceRecorder from './VoiceRecorder';

/* ------------------ DATA ------------------ */

const categories = {
  सिंचाई: ['पंप', 'पाइप', 'नहर'],
  विद्युत: ['मीटर', 'लाइन'],
  सड़क: ['गड्ढा', 'मरम्मत'],
};

const subCategories = [
  'खरार',
  'रोटावेटर',
  'मल्चर',
  'पस्टार',
  'बोइनी',
  'प्लाउ',
];

const statusFlow = [
  'नया',
  'प्रगति पर',
  'रोक पर',
  'समाधान किया गया',
  'बंद',
  'विलंबित',
  'रद्द किया गया',
  'पुनः खोला गया',
];

// Reverse mapping: English status → Hindi status
const STATUS_REVERSE_MAPPING = {
  'new': 'नया',
  'in_progress': 'प्रगति पर',
  'on_hold': 'रोक पर',
  'resolved': 'समाधान किया गया',
  'closed': 'बंद',
  'delayed': 'विलंबित',
  'cancelled': 'रद्द किया गया',
  'reopened': 'पुनः खोला गया',
};

// Reverse mapping: English task type → Hindi category
const TASK_TYPE_REVERSE_MAPPING = {
  'irrigation': 'सिंचाई',
  'electrical': 'विद्युत',
  'road': 'सड़क',
  'fertilizer': 'सिंचाई', // Default fallback
  'pesticide': 'सिंचाई',
  'other': 'सिंचाई',
};

// Helper function to format datetime for datetime-local input
const formatDateTimeLocal = (dateValue) => {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    return '';
  }
};

const resourceTypes = ['LABOR', 'EQUIPMENT', 'MATERIAL', 'WATER', 'FUEL'];

/* ------------------ COMPONENT ------------------ */

const TaskModal = ({ isOpen, onClose, onSubmit, cropCycleId, editing = null }) => {
  const [showChatbot, setShowChatbot] = useState(false);
  const [resources, setResources] = useState([]);
  const [totalCost, setTotalCost] = useState(0);

  const [formData, setFormData] = useState({
    category: '',
    sub_category: '',
    status: 'नया',
    opened_by: '',
    opened_date: '',
    expected_resolution_date: '',

    hold_reason: '',
    cancel_reason: '',
    resolution_comments: '',
    observation: '',
    short_description: '',
    description: '',
    update_notes: '',  // Mandatory notes when updating/closing
  });

  // Load editing data
  useEffect(() => {
    if (editing) {
      // Map backend task data to frontend form fields
      // Map task_type (English) to category (Hindi)
      const category = editing.task_type 
        ? TASK_TYPE_REVERSE_MAPPING[editing.task_type] || 'सिंचाई'
        : editing.category || '';
      
      // Map status (English) to Hindi status
      const status = editing.status 
        ? STATUS_REVERSE_MAPPING[editing.status.toLowerCase()] || editing.status
        : 'नया';
      
      // Format dates for datetime-local inputs
      const openedDate = editing.occurred_at 
        ? formatDateTimeLocal(editing.occurred_at)
        : editing.opened_date || '';
      
      const expectedResolutionDate = editing.resolved_at || editing.expected_resolution_date
        ? formatDateTimeLocal(editing.resolved_at || editing.expected_resolution_date)
        : '';
      
      setFormData({
        category: category,
        sub_category: editing.sub_type || editing.sub_category || '',
        status: status,
        opened_by: editing.opened_by || editing.created_by_id || '',
        opened_date: openedDate,
        expected_resolution_date: expectedResolutionDate,
        hold_reason: editing.on_hold_reason || editing.hold_reason || '',
        cancel_reason: editing.cancel_reason || '',
        resolution_comments: editing.resolution_notes || editing.resolution_comments || '',
        observation: editing.outcome_observation || editing.observation || '',
        short_description: editing.short_description || '',
        description: editing.description || '',
        update_notes: '',  // Always start empty for new notes
      });
      
      // Load resources if available
      if (editing.resources && Array.isArray(editing.resources)) {
        setResources(editing.resources);
      } else {
        setResources([]);
      }
    } else {
      // Reset form when not editing
      setFormData({
        category: '',
        sub_category: '',
        status: 'नया',
        opened_by: '',
        opened_date: '',
        expected_resolution_date: '',
        hold_reason: '',
        cancel_reason: '',
        resolution_comments: '',
        observation: '',
        short_description: '',
        description: '',
        update_notes: '',
      });
      setResources([]);
    }
  }, [editing]);

  /* ---------------- TOTAL COST ---------------- */
  useEffect(() => {
    const total = resources.reduce(
      (sum, r) => sum + (Number(r.total_cost) || 0),
      0
    );
    setTotalCost(total);
  }, [resources]);

  /* ---------------- VOICE HANDLER ---------------- */
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
        setFormData(prev => ({
          ...prev,
          [field]: `${prev[field]} ${data.transcript}`.trim(),
        }));
      }
    } catch {
      alert('Voice processing failed');
    }
  };

  /* ---------------- RESOURCE ---------------- */
  const addResource = () =>
    setResources([
      ...resources,
      { resource_type: 'MATERIAL', name: '', quantity: '', unit: '', cost_per_unit: '', total_cost: 0 },
    ]);

  const updateResource = (i, field, value) => {
    const updated = [...resources];
    updated[i][field] = value;

    if (field === 'quantity' || field === 'cost_per_unit') {
      updated[i].total_cost =
        (Number(updated[i].quantity) || 0) *
        (Number(updated[i].cost_per_unit) || 0);
    }

    setResources(updated);
  };

  const removeResource = i =>
    setResources(resources.filter((_, idx) => idx !== i));

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = e => {
    e.preventDefault();
    
    // Validate mandatory update_notes when editing/closing
    if (editing) {
      // Get original status from editing object (could be English or Hindi)
      const originalStatus = editing.status || '';
      const originalStatusHindi = STATUS_REVERSE_MAPPING[originalStatus.toLowerCase()] || originalStatus;
      
      const isClosing = formData.status === 'बंद' || formData.status === 'समाधान किया गया';
      const isStatusChanged = formData.status !== originalStatusHindi;
      
      // Notes are always required when editing/closing
      if (!formData.update_notes || !formData.update_notes.trim()) {
        alert('कृपया अपडेट/बंद करने का कारण दर्ज करें (Mandatory notes required when updating or closing task)');
        return;
      }
    }
    
    onSubmit({ ...formData, resources });
    onClose();
  };

  if (!isOpen) return null;

  /* ---------------- VOICE TEXTAREA ---------------- */
  const VoiceTextarea = ({ label, field, rows = 3, readOnly = false }) => (
    <div>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <div className="relative">
        <textarea
          rows={rows}
          className={`w-full border rounded p-2 ${readOnly ? 'bg-gray-50 pr-2' : 'pr-12'}`}
          value={formData[field]}
          onChange={e => setFormData({ ...formData, [field]: e.target.value })}
          readOnly={readOnly}
          disabled={readOnly}
        />
        {!readOnly && (
          <VoiceRecorder
            onRecordingComplete={blob =>
              handleVoiceRecordingComplete(blob, field)
            }
            customButton
            buttonClassName="absolute top-2 right-2"
          />
        )}
      </div>
    </div>
  );

  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-5xl p-6 rounded-lg space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-xl font-bold">{editing ? 'Update Task' : 'Create Task'}</h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowChatbot(true)}
              className="bg-blue-600 text-white px-3 py-1 rounded flex gap-2"
            >
              <Bot size={18} /> AI
            </button>
            <button type="button" onClick={onClose}>
              <X />
            </button>
          </div>
        </div>

        {/* Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">श्रेणी {editing && <span className="text-gray-400 text-xs">(Pre-filled)</span>}</label>
            <select
              className="border p-2 rounded w-full"
              value={formData.category}
              onChange={e =>
                setFormData(prev => ({ ...prev, category: e.target.value }))
              }
              disabled={editing} // Disable when editing to prevent changes
            >
              <option value="">श्रेणी</option>
              {Object.keys(categories).map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* ✅ FIXED SUB CATEGORY */}
          <div>
            <label className="block text-sm font-medium mb-1">उप-श्रेणी {editing && <span className="text-gray-400 text-xs">(Pre-filled)</span>}</label>
            <select
              className="border p-2 rounded w-full"
              value={formData.sub_category}
              onChange={e =>
                setFormData(prev => ({ ...prev, sub_category: e.target.value }))
              }
              disabled={editing} // Disable when editing to prevent changes
            >
              <option value="">उप-श्रेणी</option>
              {subCategories.map(sc => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Opened By */}
        <div>
          <label className="block text-sm font-medium mb-1">
            द्वारा खोला गया (नाम) {editing && <span className="text-gray-400 text-xs">(Pre-filled)</span>}
          </label>
          <input
            className="border p-2 rounded w-full bg-gray-50"
            placeholder="द्वारा खोला गया (नाम)"
            value={formData.opened_by}
            onChange={e =>
              setFormData({ ...formData, opened_by: e.target.value })
            }
            disabled={editing} // Disable when editing
            readOnly={editing}
          />
        </div>

        {/* Opened Date */}
        <div>
          <label className="block text-sm font-medium mb-1">
            खोलने की तिथि {editing && <span className="text-gray-400 text-xs">(Pre-filled)</span>}
          </label>
          <input
            type="datetime-local"
            className="border p-2 rounded w-full bg-gray-50"
            value={formData.opened_date}
            onChange={e =>
              setFormData({ ...formData, opened_date: e.target.value })
            }
            disabled={editing} // Disable when editing
            readOnly={editing}
          />
        </div>
        
        {/* Expected Resolution Date */}
        <div>
          <label className="block text-sm font-medium mb-1">
            संभावित समाधान तिथि {editing && <span className="text-gray-400 text-xs">(Pre-filled)</span>}
          </label>
          <input
            type="datetime-local"
            className="border p-2 rounded w-full bg-gray-50"
            value={formData.expected_resolution_date}
            onChange={e =>
              setFormData({
                ...formData,
                expected_resolution_date: e.target.value,
              })
            }
            disabled={editing} // Disable when editing
            readOnly={editing}
          />
        </div>

        {/* Status - Allow change when editing/closing */}
        <div>
          <label className="block text-sm font-medium mb-1">
            स्थिति {editing && <span className="text-blue-500 text-xs">(You can change this)</span>}
          </label>
          <select
            className="border p-2 rounded w-full"
            value={formData.status}
            onChange={e =>
              setFormData({ ...formData, status: e.target.value })
            }
          >
            {statusFlow.map(s => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            संक्षिप्त विवरण {editing && <span className="text-gray-400 text-xs">(Pre-filled, Read-only)</span>}
          </label>
          <VoiceTextarea label="" field="short_description" readOnly={editing} />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            विवरण {editing && <span className="text-gray-400 text-xs">(Pre-filled, Read-only)</span>}
          </label>
          <VoiceTextarea label="" field="description" rows={4} readOnly={editing} />
        </div>
        
        {/* Update Notes - Mandatory when editing/closing */}
        {editing && (
          <div>
            <label className="block text-sm font-medium mb-1">
              अपडेट/बंद करने का कारण <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">(Mandatory when updating or closing)</span>
            </label>
            <textarea
              rows={3}
              className="w-full border rounded p-2"
              value={formData.update_notes}
              onChange={e => setFormData({ ...formData, update_notes: e.target.value })}
              placeholder="कृपया अपडेट या बंद करने का कारण दर्ज करें..."
              required
            />
          </div>
        )}

        {/* Resources */}
        <div className="border-t pt-4">
          <button type="button" onClick={addResource} className="text-green-600 flex gap-2">
            <Plus /> Add Resource
          </button>

          {resources.map((r, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 mt-2">
              <select 
                onChange={e => updateResource(i, 'resource_type', e.target.value)}
                value={r.resource_type || ''}
                disabled={editing}
                className={editing ? 'bg-gray-50' : ''}
              >
                {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input 
                onChange={e => updateResource(i, 'name', e.target.value)}
                value={r.name || ''}
                disabled={editing}
                readOnly={editing}
                className={editing ? 'bg-gray-50' : ''}
              />
              <input 
                type="number" 
                onChange={e => updateResource(i, 'quantity', e.target.value)}
                value={r.quantity || ''}
                disabled={editing}
                readOnly={editing}
                className={editing ? 'bg-gray-50' : ''}
              />
              <input 
                onChange={e => updateResource(i, 'unit', e.target.value)}
                value={r.unit || ''}
                disabled={editing}
                readOnly={editing}
                className={editing ? 'bg-gray-50' : ''}
              />
              <input 
                type="number" 
                onChange={e => updateResource(i, 'cost_per_unit', e.target.value)}
                value={r.cost_per_unit || ''}
                disabled={editing}
                readOnly={editing}
                className={editing ? 'bg-gray-50' : ''}
              />
              {!editing && (
                <button type="button" onClick={() => removeResource(i)}>
                  <Trash2 />
                </button>
              )}
              {editing && <div></div>}
            </div>
          ))}

          <div className="mt-4 font-bold flex gap-2">
            <Calculator /> Total Cost: ₹{totalCost}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button className="bg-green-600 text-white px-6 py-2 rounded">
            Submit
          </button>
        </div>
      </form>

      {showChatbot && (
        <ChatbotModal isOpen onClose={() => setShowChatbot(false)} />
      )}
    </div>
  );
};

export default TaskModal;
