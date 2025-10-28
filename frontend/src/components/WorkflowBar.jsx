import React from 'react';
import { Check } from 'lucide-react';

const WorkflowBar = ({ currentStage, onStageChange, editable = false }) => {
  const stages = [
    { key: 'SOWING', label: 'Sowing', icon: '🌱' },
    { key: 'GERMINATION', label: 'Germination', icon: '🌿' },
    { key: 'VEGETATIVE', label: 'Vegetative', icon: '🍃' },
    { key: 'FLOWERING', label: 'Flowering', icon: '🌸' },
    { key: 'FRUITING', label: 'Fruiting', icon: '🍇' },
    { key: 'HARVEST', label: 'Harvest', icon: '🌾' },
    { key: 'STORAGE', label: 'Storage', icon: '📦' },
    { key: 'SALE', label: 'Sale', icon: '💰' },
    { key: 'PAYMENT', label: 'Payment', icon: '💳' },
  ];

  const currentIndex = stages.findIndex(s => s.key === currentStage);

  const getStageColor = (index) => {
    if (index < currentIndex) return 'bg-green-500 border-green-600';
    if (index === currentIndex) return 'bg-blue-500 border-blue-600 ring-4 ring-blue-200';
    return 'bg-gray-300 border-gray-400';
  };

  const getTextColor = (index) => {
    if (index === currentIndex) return 'text-blue-700 font-bold text-sm';
    if (index < currentIndex) return 'text-green-700 font-medium text-xs';
    return 'text-gray-500 text-xs';
  };

  const handleStageClick = (stage, index) => {
    if (editable && onStageChange) {
      onStageChange(stage.key);
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Crop Cycle Workflow</h3>
        <div className="text-sm text-gray-600">
          Stage {currentIndex + 1} of {stages.length}
        </div>
      </div>
      
      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Background Line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-300 z-0"></div>
          
          {/* Progress Line */}
          <div
            className="absolute top-6 left-0 h-1 bg-gradient-to-r from-green-500 to-blue-500 z-0 transition-all duration-700 ease-in-out"
            style={{ width: currentIndex === 0 ? '0%' : `${(currentIndex / (stages.length - 1)) * 100}%` }}
          ></div>

          {/* Stages */}
          <div className="relative flex justify-between z-10">
            {stages.map((stage, index) => (
              <div
                key={stage.key}
                className={`flex flex-col items-center ${editable ? 'cursor-pointer' : ''}`}
                onClick={() => handleStageClick(stage, index)}
              >
                {/* Circle */}
                <div
                  className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${getStageColor(
                    index
                  )} text-white font-bold transition-all duration-300 shadow-lg hover:scale-110`}
                >
                  {index < currentIndex ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span className="text-lg">{stage.icon}</span>
                  )}
                </div>
                
                {/* Label */}
                <span
                  className={`mt-2 text-center max-w-[80px] ${getTextColor(index)} transition-all duration-300`}
                >
                  {stage.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="space-y-2">
          {stages.map((stage, index) => (
            <div
              key={stage.key}
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                index === currentIndex
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : index < currentIndex
                  ? 'bg-green-50 border border-green-300'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${getStageColor(
                  index
                )} text-white text-sm`}
              >
                {index < currentIndex ? <Check className="w-4 h-4" /> : stage.icon}
              </div>
              <span className={getTextColor(index)}>{stage.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Stage Info */}
      <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Current Stage</p>
            <p className="text-xl font-bold text-gray-900">
              {stages[currentIndex]?.icon} {stages[currentIndex]?.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(((currentIndex + 1) / stages.length) * 100)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBar;



