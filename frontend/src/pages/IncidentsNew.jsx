import React, { useState, useEffect } from 'react';
import { incidentAPI, fieldAPI, userAPI } from '../services/api';
import { Plus, Edit, Trash2, X, Mic, FileText, AlertCircle } from 'lucide-react';
import VoiceRecorder from '../components/VoiceRecorder';

const IncidentsNew = () => {
  const [incidents, setIncidents] = useState([]);
  const [fields, setFields] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'voice'
  const [editingIncident, setEditingIncident] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Voice recording state
  const [voicePreview, setVoicePreview] = useState(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    incident_type: 'OTHER',
    severity: 'MEDIUM',
    field_id: '',
    location_description: '',
    affected_area_acre: '',
    estimated_loss: '',
    crop_affected: '',
    incident_date: '',
    action_taken: '',
  });

  const incidentTypes = [
    { value: 'PEST_ATTACK', label: 'Pest Attack' },
    { value: 'DISEASE', label: 'Disease' },
    { value: 'WEATHER_DAMAGE', label: 'Weather Damage' },
    { value: 'EQUIPMENT_FAILURE', label: 'Equipment Failure' },
    { value: 'IRRIGATION_ISSUE', label: 'Irrigation Issue' },
    { value: 'THEFT', label: 'Theft' },
    { value: 'ANIMAL_DAMAGE', label: 'Animal Damage' },
    { value: 'SOIL_ISSUE', label: 'Soil Issue' },
    { value: 'OTHER', label: 'Other' },
  ];

  const severityLevels = [
    { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-800' },
  ];

  useEffect(() => {
    fetchData();
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
  }, []);

  const fetchData = async () => {
    try {
      const [incidentsRes, fieldsRes, usersRes] = await Promise.all([
        incidentAPI.getAll(),
        fieldAPI.getAll(),
        userAPI.getAll(),
      ]);

      setIncidents(incidentsRes.data);
      setFields(fieldsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (incident = null) => {
    if (incident) {
      setEditingIncident(incident);
      setFormData({
        title: incident.title,
        description: incident.description,
        incident_type: incident.incident_type,
        severity: incident.severity,
        field_id: incident.field_id || '',
        location_description: incident.location_description || '',
        affected_area_acre: incident.affected_area_acre || '',
        estimated_loss: incident.estimated_loss || '',
        crop_affected: incident.crop_affected || '',
        incident_date: incident.incident_date ? incident.incident_date.split('T')[0] : '',
        action_taken: incident.action_taken || '',
      });
    } else {
      setEditingIncident(null);
      resetForm();
    }
    setShowModal(true);
    setActiveTab('manual');
    setVoicePreview(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      incident_type: 'OTHER',
      severity: 'MEDIUM',
      field_id: '',
      location_description: '',
      affected_area_acre: '',
      estimated_loss: '',
      crop_affected: '',
      incident_date: '',
      action_taken: '',
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingIncident(null);
    setVoicePreview(null);
    resetForm();
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        reported_by_user_id: currentUser.user_id,
        affected_area_acre: formData.affected_area_acre ? parseFloat(formData.affected_area_acre) : null,
        estimated_loss: formData.estimated_loss ? parseFloat(formData.estimated_loss) : null,
        incident_date: formData.incident_date || null,
      };

      if (editingIncident) {
        await incidentAPI.update(editingIncident.incident_id, payload);
      } else {
        await incidentAPI.createManual(payload);
      }

      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save incident:', error);
      alert(error.response?.data?.detail || 'Failed to save incident');
    }
  };

  const handleVoiceRecordingComplete = async (audioBlob) => {
    setIsProcessingVoice(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');
      formData.append('reported_by_user_id', currentUser.user_id);

      const response = await incidentAPI.uploadVoice(formData);
      const preview = response.data;
      
      setVoicePreview(preview);
      
      // Pre-fill form with extracted data
      if (preview.extracted_data) {
        const extracted = preview.extracted_data;
        setFormData({
          title: extracted.title || '',
          description: extracted.description || preview.transcript,
          incident_type: extracted.incident_type || 'OTHER',
          severity: extracted.severity || 'MEDIUM',
          field_id: extracted.field_id || '',
          location_description: extracted.location_description || '',
          affected_area_acre: extracted.affected_area_acre || '',
          estimated_loss: extracted.estimated_loss || '',
          crop_affected: extracted.crop_affected || '',
          incident_date: extracted.incident_date ? extracted.incident_date.split('T')[0] : '',
          action_taken: extracted.action_taken || '',
        });
      }
      
      // Switch to manual tab to show/edit extracted data
      setActiveTab('manual');
    } catch (error) {
      console.error('Failed to process voice recording:', error);
      alert(error.response?.data?.detail || 'Failed to process voice recording');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleConfirmVoiceIncident = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        audio_file_path: voicePreview.audio_file_path,
        transcript: voicePreview.transcript,
        extracted_data: {
          ...formData,
          affected_area_acre: formData.affected_area_acre ? parseFloat(formData.affected_area_acre) : null,
          estimated_loss: formData.estimated_loss ? parseFloat(formData.estimated_loss) : null,
        },
        reported_by_user_id: currentUser.user_id,
      };

      await incidentAPI.confirmVoice(payload);
      await fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to confirm voice incident:', error);
      alert(error.response?.data?.detail || 'Failed to save incident');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this incident?')) {
      try {
        await incidentAPI.delete(id);
        await fetchData();
      } catch (error) {
        console.error('Failed to delete incident:', error);
        alert('Failed to delete incident');
      }
    }
  };

  const getSeverityColor = (severity) => {
    const level = severityLevels.find(s => s.value === severity);
    return level ? level.color : 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-gray-900">Farm Incidents</h1>
          <p className="text-gray-600 mt-1">Report and manage farm incidents</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          <span>Report Incident</span>
        </button>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {incidents.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No incidents reported yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title & Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incidents.map((incident) => (
                  <tr key={incident.incident_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {incident.title}
                          {incident.is_voice_recorded === 'true' && (
                            <Mic className="w-4 h-4 ml-2 text-blue-600" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{incident.incident_type.replace('_', ' ')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {incident.field_id || incident.location_description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(incident.reported_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(incident)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(incident.incident_id)}
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingIncident ? 'Edit Incident' : 'Report New Incident'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            {!editingIncident && (
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

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'voice' && !voicePreview ? (
                <VoiceRecorder
                  onRecordingComplete={handleVoiceRecordingComplete}
                  userId={currentUser?.user_id}
                />
              ) : (
                <>
                  {/* Voice Preview Alert */}
                  {voicePreview && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-900 mb-2">AI Extracted Data</h3>
                          <p className="text-sm text-green-800 mb-3">
                            <strong>Transcript:</strong> "{voicePreview.transcript}"
                          </p>
                          <p className="text-sm text-green-700">
                            Review and edit the form below before saving. Missing fields can be filled manually.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Form */}
                  <form onSubmit={voicePreview ? handleConfirmVoiceIncident : handleManualSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          placeholder="Brief title for the incident"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Incident Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.incident_type}
                          onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          required
                        >
                          {incidentTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Severity <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.severity}
                          onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          required
                        >
                          {severityLevels.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Field</label>
                        <select
                          value={formData.field_id}
                          onChange={(e) => setFormData({ ...formData, field_id: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location Description</label>
                        <input
                          type="text"
                          value={formData.location_description}
                          onChange={(e) => setFormData({ ...formData, location_description: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          placeholder="e.g., Northwest corner"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Affected Area (acres)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.affected_area_acre}
                          onChange={(e) => setFormData({ ...formData, affected_area_acre: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          placeholder="0.0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Loss (₹)</label>
                        <input
                          type="number"
                          step="100"
                          value={formData.estimated_loss}
                          onChange={(e) => setFormData({ ...formData, estimated_loss: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Crop Affected</label>
                        <input
                          type="text"
                          value={formData.crop_affected}
                          onChange={(e) => setFormData({ ...formData, crop_affected: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          placeholder="e.g., Wheat, Soybean"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Incident Date</label>
                        <input
                          type="date"
                          value={formData.incident_date}
                          onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          rows="4"
                          placeholder="Detailed description of what happened..."
                          required
                        ></textarea>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken</label>
                        <textarea
                          value={formData.action_taken}
                          onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                          rows="3"
                          placeholder="What action was taken immediately..."
                        ></textarea>
                      </div>
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
                        {voicePreview ? 'Confirm & Save' : editingIncident ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentsNew;

