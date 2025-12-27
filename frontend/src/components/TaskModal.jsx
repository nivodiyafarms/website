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

const resourceTypes = ['LABOR', 'EQUIPMENT', 'MATERIAL', 'WATER', 'FUEL'];

/* ------------------ COMPONENT ------------------ */

const TaskModal = ({ isOpen, onClose, onSubmit, cropCycleId }) => {
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
  });

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
    onSubmit({ ...formData, resources });
    onClose();
  };

  if (!isOpen) return null;

  /* ---------------- VOICE TEXTAREA ---------------- */
  const VoiceTextarea = ({ label, field, rows = 3 }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="relative">
        <textarea
          rows={rows}
          className="w-full border rounded p-2 pr-12"
          value={formData[field]}
          onChange={e => setFormData({ ...formData, [field]: e.target.value })}
        />
        <VoiceRecorder
          onRecordingComplete={blob =>
            handleVoiceRecordingComplete(blob, field)
          }
          customButton
          buttonClassName="absolute top-2 right-2"
        />
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
          <h2 className="text-xl font-bold">Task Form</h2>
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
          <select
            className="border p-2 rounded"
            value={formData.category}
            onChange={e =>
              setFormData(prev => ({ ...prev, category: e.target.value }))
            }
          >
            <option value="">श्रेणी</option>
            {Object.keys(categories).map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          {/* ✅ FIXED SUB CATEGORY */}
          <select
            className="border p-2 rounded"
            value={formData.sub_category}
            onChange={e =>
              setFormData(prev => ({ ...prev, sub_category: e.target.value }))
            }
          >
            <option value="">उप-श्रेणी</option>
            {subCategories.map(sc => (
              <option key={sc} value={sc}>
                {sc}
              </option>
            ))}
          </select>
        </div>

        {/* Opened By */}
        <input
          className="border p-2 rounded w-full"
          placeholder="द्वारा खोला गया (नाम)"
          value={formData.opened_by}
          onChange={e =>
            setFormData({ ...formData, opened_by: e.target.value })
          }
        />

        {/* Opened Date */}
         <label className="block text-sm font-medium mb-1">
    खोलने की तिथि
     </label>
        <input
          type="datetime-local"
          className="border p-2 rounded w-full"
          value={formData.opened_date}
          onChange={e =>
            setFormData({ ...formData, opened_date: e.target.value })
          }
        />
        {/* Expected Resolution Date */}
<div>
  <label className="block text-sm font-medium mb-1">
    संभावित समाधान तिथि
  </label>
  <input
    type="datetime-local"
    className="border p-2 rounded w-full"
    value={formData.expected_resolution_date}
    onChange={e =>
      setFormData({
        ...formData,
        expected_resolution_date: e.target.value,
      })
    }
  />
</div>


        {/* Status */}
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

        <VoiceTextarea label="संक्षिप्त विवरण" field="short_description" />
        <VoiceTextarea label="विवरण" field="description" rows={4} />

        {/* Resources */}
        <div className="border-t pt-4">
          <button type="button" onClick={addResource} className="text-green-600 flex gap-2">
            <Plus /> Add Resource
          </button>

          {resources.map((r, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 mt-2">
              <select onChange={e => updateResource(i, 'resource_type', e.target.value)}>
                {resourceTypes.map(t => <option key={t}>{t}</option>)}
              </select>
              <input onChange={e => updateResource(i, 'name', e.target.value)} />
              <input type="number" onChange={e => updateResource(i, 'quantity', e.target.value)} />
              <input onChange={e => updateResource(i, 'unit', e.target.value)} />
              <input type="number" onChange={e => updateResource(i, 'cost_per_unit', e.target.value)} />
              <button type="button" onClick={() => removeResource(i)}>
                <Trash2 />
              </button>
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
