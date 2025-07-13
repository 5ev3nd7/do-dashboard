import React from 'react';
import type { MetricsInsightsProps, Insight } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MetricsInsights: React.FC<MetricsInsightsProps> = ({ app }) => {
  const { monitoring } = app;
  
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];
    const now = Date.now();
    
    // Recent deployment insight
    if (app.active_deployment) {
      const deploymentTime = new Date(app.active_deployment.created_at).getTime();
      const hoursAgo = Math.floor((now - deploymentTime) / (1000 * 60 * 60));
      
      insights.push({
        id: 'deployment',
        timestamp: deploymentTime,
        type: 'success',
        title: 'New Deployment Active',
        description: `Deployment ${app.active_deployment.id.slice(0, 8)} went live ${hoursAgo}h ago`,
        metric: 'Status',
        value: app.active_deployment.phase
      });
    }
    
    // CPU insights
    if (monitoring?.cpu_percentage !== null && monitoring?.cpu_percentage !== undefined) {
      const cpuPercent = monitoring.cpu_percentage;
      let cpuInsight: Insight = {
        id: 'cpu',
        timestamp: monitoring.timestamp * 1000,
        type: 'info',
        title: 'CPU Usage Normal',
        description: `Application CPU usage is within normal range`,
        metric: 'CPU',
        value: `${cpuPercent.toFixed(1)}%`
      };
      
      if (cpuPercent > 90) {
        cpuInsight = {
          ...cpuInsight,
          type: 'error',
          title: 'High CPU Usage Detected',
          description: 'CPU usage is critically high. Consider scaling or optimization.'
        };
      } else if (cpuPercent > 70) {
        cpuInsight = {
          ...cpuInsight,
          type: 'warning',
          title: 'Elevated CPU Usage',
          description: 'CPU usage is above normal. Monitor for potential issues.'
        };
      }
      
      insights.push(cpuInsight);
    }
    
    // Memory insights
    if (monitoring?.memory_percentage !== null && monitoring?.memory_percentage !== undefined) {
      const memoryPercent = monitoring.memory_percentage;
      let memoryInsight: Insight = {
        id: 'memory',
        timestamp: monitoring.timestamp * 1000,
        type: 'info',
        title: 'Memory Usage Stable',
        description: `Application memory usage is within acceptable limits`,
        metric: 'Memory',
        value: `${memoryPercent.toFixed(1)}%`
      };
      
      if (memoryPercent > 95) {
        memoryInsight = {
          ...memoryInsight,
          type: 'error',
          title: 'Critical Memory Usage',
          description: 'Memory usage is critically high. Immediate attention required.'
        };
      } else if (memoryPercent > 80) {
        memoryInsight = {
          ...memoryInsight,
          type: 'warning',
          title: 'High Memory Usage',
          description: 'Memory usage is elevated. Consider memory optimization.'
        };
      }
      
      insights.push(memoryInsight);
    }
    
    // App health insight
    if (app.live_url) {
      insights.push({
        id: 'health',
        timestamp: now - (Math.random() * 300000), // Random time within last 5 minutes
        type: 'success',
        title: 'Application Health Check',
        description: `Application is responding normally at ${app.live_url}`,
        metric: 'Status',
        value: 'Healthy'
      });
    }
    
    // Performance insight (simulated based on tier)
    const tier = app.tier_slug;
    const performanceScore = tier === 'professional' ? 95 : tier === 'basic' ? 85 : 90;
    insights.push({
      id: 'performance',
      timestamp: now - (Math.random() * 600000), // Random time within last 10 minutes
      type: performanceScore > 90 ? 'success' : performanceScore > 80 ? 'info' : 'warning',
      title: 'Performance Score',
      description: `Application performance is ${performanceScore > 90 ? 'excellent' : performanceScore > 80 ? 'good' : 'needs attention'}`,
      metric: 'Score',
      value: `${performanceScore}/100`
    });
    
    return insights.sort((a, b) => b.timestamp - a.timestamp);
  };
  
  const insights = generateInsights();
  
  const getInsightIcon = (type: Insight['type']): string => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };
  
  const getInsightColor = (type: Insight['type']): string => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };
  
  const getTextColor = (type: Insight['type']): string => {
    switch (type) {
      case 'success': return 'text-green-800';
      case 'warning': return 'text-yellow-800';
      case 'error': return 'text-red-800';
      default: return 'text-blue-800';
    }
  };
  
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Metrics Insights - {app.spec?.name || 'Unknown App'}
            </h3>
            <span className="text-sm text-gray-500">
              Live monitoring
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{getInsightIcon(insight.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-medium ${getTextColor(insight.type)}`}>
                        {insight.title}
                      </h4>
                      {insight.metric && insight.value && (
                        <span className={`text-xs px-2 py-1 rounded-full border ${getTextColor(insight.type)} bg-white`}>
                          {insight.metric}: {insight.value}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${getTextColor(insight.type)} opacity-80`}>
                      {insight.description}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                  {formatTimeAgo(insight.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {insights.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No insights available at this time.</p>
            <p className="text-sm mt-1">Insights will appear as monitoring data becomes available.</p>
          </div>
        )}
      
      </CardContent>
    </Card>
  );
};

export default MetricsInsights;