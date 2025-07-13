import React from 'react';
import type { AppWithMonitoring } from '../types';

interface MonitoringMetricsProps {
  app: AppWithMonitoring;
}

const MonitoringMetrics: React.FC<MonitoringMetricsProps> = ({ app }) => {
  const { monitoring } = app;
  
  // Helper function to format percentage values
  const formatPercentage = (value: number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    return `${Math.round(value * 100) / 100}%`;
  };

  // Helper function to get status color based on percentage
  const getStatusColor = (percentage: number | null, type: 'cpu' | 'memory'): string => {
    if (percentage === null || percentage === undefined) return 'text-gray-400';
    
    const thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 }
    };
    
    const { warning, critical } = thresholds[type];
    
    if (percentage >= critical) return 'text-red-600';
    if (percentage >= warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Helper function to get background color for progress bars
  const getProgressColor = (percentage: number | null, type: 'cpu' | 'memory'): string => {
    if (percentage === null || percentage === undefined) return 'bg-gray-200';
    
    const thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 }
    };
    
    const { warning, critical } = thresholds[type];
    
    if (percentage >= critical) return 'bg-red-500';
    if (percentage >= warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Monitoring Metrics - {app.spec?.name || 'Unknown App'}
        </h3>
        {monitoring?.timestamp && (
          <span className="text-sm text-gray-500">
            Last updated: {formatTimestamp(monitoring.timestamp)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">CPU Usage</span>
            <span className={`text-sm font-semibold ${getStatusColor(monitoring?.cpu_percentage ?? null, 'cpu')}`}>
              {formatPercentage(monitoring?.cpu_percentage ?? null)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(monitoring?.cpu_percentage ?? null, 'cpu')}`}
              style={{
                width: monitoring?.cpu_percentage 
                  ? `${Math.min(monitoring.cpu_percentage, 100)}%` 
                  : '0%'
              }}
            />
          </div>
        </div>

        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Memory Usage</span>
            <span className={`text-sm font-semibold ${getStatusColor(monitoring?.memory_percentage ?? null, 'memory')}`}>
              {formatPercentage(monitoring?.memory_percentage ?? null)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(monitoring?.memory_percentage ?? null, 'memory')}`}
              style={{
                width: monitoring?.memory_percentage 
                  ? `${Math.min(monitoring.memory_percentage, 100)}%` 
                  : '0%'
              }}
            />
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Normal</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span>Warning</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>Critical</span>
        </div>
      </div>

      {/* No Data Message */}
      {(!monitoring?.cpu_percentage && !monitoring?.memory_percentage) && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            No monitoring data available. This may be normal for newly deployed apps.
          </p>
        </div>
      )}
    </div>
  );
};

export default MonitoringMetrics;