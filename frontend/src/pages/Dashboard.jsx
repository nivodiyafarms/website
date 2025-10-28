import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cropCycleIncidentAPI, fieldAPI } from '../services/api';
import { TrendingUp, MapPin, Activity, CheckCircle, DollarSign, ListTodo, Package, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCropCycles: 0,
    activeCropCycles: 0,
    totalFields: 0,
    closedCropCycles: 0,
    totalTasks: 0,
    totalCost: 0,
  });
  const [recentCropCycles, setRecentCropCycles] = useState([]);
  const [stageDistribution, setStageDistribution] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [cropCyclesRes, fieldsRes] = await Promise.all([
        cropCycleIncidentAPI.getAllCycles(),
        fieldAPI.getAll(),
      ]);

      const cropCycles = cropCyclesRes.data;
      const fields = fieldsRes.data;

      const activeCycles = cropCycles.filter((c) => c.status === 'OPEN');
      const closedCycles = cropCycles.filter((c) => c.status === 'CLOSED');

      // Fetch tasks for all cycles to get total cost
      let totalTasks = 0;
      let totalCost = 0;

      // Calculate stage distribution
      const stageDist = {};
      cropCycles.forEach(cycle => {
        const stage = cycle.current_stage;
        stageDist[stage] = (stageDist[stage] || 0) + 1;
      });

      // Fetch task counts for active cycles (sample for performance)
      for (const cycle of activeCycles.slice(0, 10)) {
        try {
          const tasksRes = await cropCycleIncidentAPI.getTasks(cycle.incident_id);
          totalTasks += tasksRes.data.length;
          totalCost += tasksRes.data.reduce((sum, task) => sum + (task.total_cost || 0), 0);
        } catch (err) {
          console.log('Failed to fetch tasks for cycle:', cycle.incident_id);
        }
      }

      setStats({
        totalCropCycles: cropCycles.length,
        activeCropCycles: activeCycles.length,
        totalFields: fields.length,
        closedCropCycles: closedCycles.length,
        totalTasks,
        totalCost,
      });

      setStageDistribution(stageDist);

      // Get recent 6 crop cycles
      const recent = cropCycles
        .sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at))
        .slice(0, 6);
      setRecentCropCycles(recent);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Active Crop Cycles',
      value: stats.activeCropCycles,
      icon: Activity,
      color: 'bg-primary-500',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-600',
    },
    {
      title: 'Total Fields',
      value: stats.totalFields,
      icon: MapPin,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      icon: ListTodo,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Total Cost',
      value: `₹${(stats.totalCost / 1000).toFixed(1)}K`,
      icon: DollarSign,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  const getStageColor = (stage) => {
    const colors = {
      SOWING: 'bg-yellow-100 text-yellow-800',
      GERMINATION: 'bg-lime-100 text-lime-800',
      VEGETATIVE: 'bg-green-100 text-green-800',
      FLOWERING: 'bg-pink-100 text-pink-800',
      FRUITING: 'bg-orange-100 text-orange-800',
      HARVEST: 'bg-blue-100 text-blue-800',
      STORAGE: 'bg-indigo-100 text-indigo-800',
      SALE: 'bg-purple-100 text-purple-800',
      PAYMENT: 'bg-emerald-100 text-emerald-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getStageIcon = (stage) => {
    const icons = {
      SOWING: '🌱',
      GERMINATION: '🌿',
      VEGETATIVE: '🍃',
      FLOWERING: '🌸',
      FRUITING: '🍇',
      HARVEST: '🌾',
      STORAGE: '📦',
      SALE: '💰',
      PAYMENT: '💳',
    };
    return icons[stage] || '🌱';
  };

  const handleCycleClick = (cycleId) => {
    navigate(`/crop-cycle-management?cycle=${cycleId}`);
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to Nivodiya Farms KPI Dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4" style={{borderLeftColor: card.color.replace('bg-', '#')}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                  <p className={`text-3xl font-bold mt-2 ${card.textColor}`}>{card.value}</p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-8 h-8 ${card.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Stage Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Crop Stage Distribution</h2>
          <div className="space-y-3">
            {Object.entries(stageDistribution).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getStageIcon(stage)}</span>
                  <span className="font-medium text-gray-700">{stage}</span>
                </div>
                <span className="text-2xl font-bold text-primary-600">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">⚡ Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/crop-cycle-management')}
              className="w-full flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition group"
            >
              <div className="flex items-center space-x-3">
                <Package className="w-6 h-6 text-primary-600" />
                <span className="font-medium text-gray-900">Manage Crop Cycles</span>
              </div>
              <ArrowRight className="w-5 h-5 text-primary-600 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => navigate('/incidents')}
              className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition group"
            >
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-blue-600" />
                <span className="font-medium text-gray-900">Report Incident</span>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">System Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-gray-600">Total Cycles</p>
                  <p className="text-2xl font-bold text-green-700">{stats.totalCropCycles}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-700">{stats.closedCropCycles}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Crop Cycles */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">🌾 Recent Crop Cycles</h2>
          <button
            onClick={() => navigate('/crop-cycle-management')}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          {recentCropCycles.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">No crop cycles yet</p>
              <button
                onClick={() => navigate('/crop-cycle-management')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition"
              >
                Create First Crop Cycle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentCropCycles.map((cycle) => (
                <div
                  key={cycle.incident_id}
                  onClick={() => handleCycleClick(cycle.incident_id)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-2xl">{getStageIcon(cycle.current_stage)}</span>
                        <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition">
                          {cycle.crop_name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-600">
                        {cycle.crop_variety || 'No variety'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        cycle.status === 'OPEN'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {cycle.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Field:</span>
                      <span className="font-semibold text-gray-900">{cycle.field_id}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Sowing:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(cycle.sowing_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(cycle.current_stage)}`}>
                      {cycle.current_stage}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

