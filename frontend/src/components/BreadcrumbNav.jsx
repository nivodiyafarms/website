import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

const BreadcrumbNav = ({ path, onNavigate }) => {
  // path = [{ name: 'Crop Cycles', id: null }, { name: 'Wheat Cycle', id: 'uuid' }, ...]
  
  return (
    <nav className="flex items-center space-x-2 text-sm mb-6 bg-white px-4 py-3 rounded-lg shadow">
      <button
        onClick={() => onNavigate && onNavigate(null)}
        className="flex items-center text-gray-600 hover:text-primary-600 transition p-1 hover:bg-gray-100 rounded"
        title="Home"
      >
        <Home className="w-5 h-5" />
      </button>
      
      {path && path.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => onNavigate && onNavigate(item.id, index)}
            disabled={index === path.length - 1}
            className={`px-2 py-1 rounded transition ${
              index === path.length - 1
                ? 'text-primary-600 font-semibold bg-primary-50'
                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
            } ${index === path.length - 1 ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNav;



