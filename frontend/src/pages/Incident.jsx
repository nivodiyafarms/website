import React, { useState, useEffect } from 'react';
import { cropCycleAPI, fieldAPI, userAPI, cropAPI } from '../services/api';
import { Plus, Edit, Trash2, X } from 'lucide-react';

const Incident = () => {
  const [cropCycles, setCropCycles] = useState([]);
  const [fields, setFields] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [formData, setFormData] = useState({
    field_id: '',
    crop: '',
    variety: '',
    sowing_date: '',
    expected_harvest: '',
    stage: 'SOWING',
    status: 'OPEN',
    supervisor_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cyclesRes, fieldsRes, usersRes, cropsRes] = await Promise.all([
        cropCycleAPI.getAll(),
        fieldAPI.getAll(),
        userAPI.getAll(),
        cropAPI.getAll(),
      ]);

      setCropCycles(cyclesRes.data);
      setFields(fieldsRes.data);
      setSupervisors(usersRes.data.filter((u) => u.role === 'SUPERVISOR' || u.role === 'ADMIN'));
      setCrops(cropsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cycle = null) => {
    if (cycle) {
      setEditingCycle(cycle);
      setFormData({
        field_id: cycle.field_id,
        crop: cycle.crop,
        variety: cycle.variety || '',
        sowing_date: cycle.sowing_date,
        expected_harvest: cycle.expected_harvest || '',
        stage: cycle.stage,
        status: cycle.status,
        supervisor_id: cycle.supervisor_id,
        notes: cycle.notes || '',
      });
    } else {
      setEditingCycle(null);
      setFormData({
        field_id: '',
        crop: '',
        variety: '',
        sowing_date: '',
        expected_harvest: '',
        stage: 'SOWING',
        status: 'OPEN',
        supervisor_id: '',
        notes: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCycle(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        variety: formData.variety || null,
        expected_harvest: formData.expected_harvest || null,
        notes: formData.notes || null,
      };

      if (editingCycle) {
        await cropCycleAPI.update(editingCycle.crop_cycle_id, payload);
      } else {
        await cropCycleAPI.create(payload);
      }

      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save crop cycle:', error);
      alert(error.response?.data?.detail || 'Failed to save crop cycle');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this crop cycle?')) {
      try {
        await cropCycleAPI.delete(id);
        await fetchData();
      } catch (error) {
        console.error('Failed to delete crop cycle:', error);
        alert('Failed to delete crop cycle');
      }
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      SOWING: 'bg-yellow-100 text-yellow-800',
      GERMINATION: 'bg-lime-100 text-lime-800',
      VEGETATIVE: 'bg-green-100 text-green-800',
      FLOWERING: 'bg-pink-100 text-pink-800',
      FRUITING: 'bg-orange-100 text-orange-800',
      HARVEST: 'bg-blue-100 text-blue-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incidents (Crop Cycles)</h1>
          <p className="text-gray-600 mt-1">Manage crop cycles and track progress</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          <span>Create Incident</span>
        </button>
      </div>

      {/* Crop Cycles List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {cropCycles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No crop cycles found. Create one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crop & Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variety
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sowing Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supervisor
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cropCycles.map((cycle) => (
                  <tr key={cycle.crop_cycle_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{cycle.crop}</div>
                        <div className="text-sm text-gray-500">Field: {cycle.field_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cycle.variety || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(cycle.sowing_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(cycle.stage)}`}>
                        {cycle.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          cycle.status === 'OPEN'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {cycle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cycle.supervisor?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(cycle)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cycle.crop_cycle_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCycle ? 'Edit Crop Cycle' : 'Create New Crop Cycle'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.field_id}
                    onChange={(e) => setFormData({ ...formData, field_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select Field</option>
                    {fields.map((field) => (
                      <option key={field.field_id} value={field.field_id}>
                        {field.name} ({field.field_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crop <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.crop}
                    onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select Crop</option>
                    {crops.map((crop) => (
                      <option key={crop.id} value={crop.crop}>
                        {crop.crop}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Variety</label>
                  <input
                    type="text"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="Enter variety"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervisor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.supervisor_id}
                    onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select Supervisor</option>
                    {supervisors.map((supervisor) => (
                      <option key={supervisor.user_id} value={supervisor.user_id}>
                        {supervisor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sowing Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.sowing_date}
                    onChange={(e) => setFormData({ ...formData, sowing_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Harvest</label>
                  <input
                    type="date"
                    value={formData.expected_harvest}
                    onChange={(e) => setFormData({ ...formData, expected_harvest: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stage <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="SOWING">Sowing</option>
                    <option value="GERMINATION">Germination</option>
                    <option value="VEGETATIVE">Vegetative</option>
                    <option value="FLOWERING">Flowering</option>
                    <option value="FRUITING">Fruiting</option>
                    <option value="HARVEST">Harvest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  rows="3"
                  placeholder="Enter any notes..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
                >
                  {editingCycle ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incident;

