'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, MessageSquare, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';

function authHeaders() {
  const token = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '';
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${decodeURIComponent(token)}`,
  };
}

export default function AnalyticsDashboard({ businessId }: { businessId: number }) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last_30_days');

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/analytics/dashboard?preset=${dateRange}`, { headers: authHeaders() });
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [businessId, dateRange]);

  if (loading) {
    return <div className="p-6 text-center">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center gap-4">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 rounded-lg border"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="last_30_days">Last 30 Days</option>
          <option value="this_month">This Month</option>
        </select>
      </div>

      {/* Conversation Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Conversations
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {dashboardData?.conversations?.total || 0}
            </div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {dashboardData?.conversations?.new || 0}
            </div>
            <div className="text-sm text-gray-500">New</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {dashboardData?.conversations?.open || 0}
            </div>
            <div className="text-sm text-gray-500">Open</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">
              {dashboardData?.conversations?.closed || 0}
            </div>
            <div className="text-sm text-gray-500">Closed</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(dashboardData?.conversations?.avg_response_time_minutes || 0)}m
            </div>
            <div className="text-sm text-gray-500">Avg Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(dashboardData?.conversations?.avg_resolution_time_minutes || 0)}m
            </div>
            <div className="text-sm text-gray-500">Avg Resolution Time</div>
          </div>
        </div>
      </div>

      {/* AI Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            AI Performance
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {dashboardData?.ai?.ai_conversations || 0}
            </div>
            <div className="text-sm text-gray-500">AI Conversations</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {dashboardData?.ai?.ai_responses || 0}
            </div>
            <div className="text-sm text-gray-500">AI Responses</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {dashboardData?.ai?.escalated_conversations || 0}
            </div>
            <div className="text-sm text-gray-500">Escalated</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {Math.round(dashboardData?.ai?.ai_success_rate || 0)}%
            </div>
            <div className="text-sm text-gray-500">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Agents Performance */}
      {dashboardData?.agents && dashboardData.agents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Agent Performance
            </h2>
          </div>
          <div className="space-y-3">
            {dashboardData.agents.map((agent: any) => (
              <div key={agent.agent_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{agent.name}</div>
                  <div className="text-sm text-gray-500">Role: {agent.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {agent.resolved_conversations} resolved
                  </div>
                  <div className="text-sm text-gray-500">
                    {agent.assigned_conversations} assigned
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Channels Breakdown */}
      {dashboardData?.channels && dashboardData.channels.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Channels
            </h2>
          </div>
          <div className="space-y-3">
            {dashboardData.channels.map((channel: any) => (
              <div key={channel.channel_type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white capitalize">{channel.channel_type}</div>
                  <div className="text-sm text-gray-500">{channel.channel_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {channel.conversations} conversations
                  </div>
                  <div className="text-sm text-gray-500">
                    {channel.messages} messages
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* E-commerce Stats */}
      {dashboardData?.ecommerce && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              E-commerce
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {dashboardData.ecommerce.total_products || 0}
              </div>
              <div className="text-sm text-gray-500">Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {dashboardData.ecommerce.active_products || 0}
              </div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {dashboardData.ecommerce.recovered_carts || 0}
              </div>
              <div className="text-sm text-gray-500">Recovered Carts</div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Stats */}
      {dashboardData?.workflows && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Workflows
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {dashboardData.workflows.total_workflows || 0}
              </div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {dashboardData.workflows.active_workflows || 0}
              </div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {dashboardData.workflows.total_executions || 0}
              </div>
              <div className="text-sm text-gray-500">Executions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {Math.round(dashboardData.workflows.success_rate || 0)}%
              </div>
              <div className="text-sm text-gray-500">Success Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
