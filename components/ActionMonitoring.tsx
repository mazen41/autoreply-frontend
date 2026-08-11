'use client';

import { useState, useEffect } from 'react';
import { Bot, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function ActionMonitoring({ businessId }: { businessId: number }) {
  const [actions, setActions] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const fetchActions = async () => {
    try {
      // This would be a new endpoint to fetch AI action logs
      const response = await fetch(`/api/businesses/${businessId}/ai-actions`);
      const data = await response.json();
      setActions(data || []);
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    }
  };

  useEffect(() => {
    fetchActions();
    const interval = setInterval(fetchActions, 30000);
    return () => clearInterval(interval);
  }, [businessId]);

  const filteredActions = filter === 'all' 
    ? actions 
    : actions.filter((a) => a.status === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'create_order':
        return 'Create Order';
      case 'get_products':
        return 'Get Products';
      case 'check_status':
        return 'Check Status';
      case 'book_appointment':
        return 'Book Appointment';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            AI Action Monitoring
          </h2>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Actions</option>
          <option value="pending">Pending</option>
          <option value="executed">Executed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredActions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bot className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No AI actions recorded yet</p>
          </div>
        ) : (
          filteredActions.map((action) => (
            <div key={action.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getStatusIcon(action.status)}</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {getActionTypeLabel(action.action_type)}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Conversation #{action.conversation_id}
                    </p>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                      <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-x-auto">
                        {JSON.stringify(action.action_payload, null, 2)}
                      </pre>
                    </div>
                    {action.result && (
                      <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                        <div className="font-medium text-green-800 dark:text-green-200 mb-1">Result:</div>
                        <pre className="text-xs text-green-700 dark:text-green-300 overflow-x-auto">
                          {JSON.stringify(action.result, null, 2)}
                        </pre>
                      </div>
                    )}
                    {action.error_message && (
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                        <div className="font-medium text-red-800 dark:text-red-200 mb-1">Error:</div>
                        <p className="text-red-700 dark:text-red-300">{action.error_message}</p>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-400">
                      {new Date(action.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
