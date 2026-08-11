'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, MessageSquare, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function AnalyticsDashboard({ businessId }: { businessId: number }) {
  const [csatData, setCsatData] = useState<any>(null);
  const [dailyAnalytics, setDailyAnalytics] = useState<any[]>([]);
  const [aiMetrics, setAiMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [csatRes, dailyRes, aiRes] = await Promise.all([
        fetch(`/api/businesses/${businessId}/analytics/csat`),
        fetch(`/api/businesses/${businessId}/analytics/daily`),
        fetch(`/api/businesses/${businessId}/analytics/ai-metrics`),
      ]);

      setCsatData(await csatRes.json());
      setDailyAnalytics((await dailyRes.json()) || []);
      setAiMetrics((await aiRes.json()) || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [businessId]);

  if (loading) {
    return <div className="p-6 text-center">Loading analytics...</div>;
  }

  const recentDailyData = dailyAnalytics.slice(-7).map(d => ({
    date: new Date(d.date).toLocaleDateString(),
    conversations: d.total_conversations,
    messages: d.total_messages,
    ai_messages: d.ai_messages,
  }));

  const recentAiData = aiMetrics.slice(-7).map(d => ({
    date: new Date(d.date).toLocaleDateString(),
    success_rate: d.success_rate,
    confidence: d.avg_confidence_score,
  }));

  return (
    <div className="space-y-6">
      {/* CSAT Score */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ThumbsUp className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Customer Satisfaction
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{csatData?.csat_score || 0}%</div>
            <div className="text-sm text-gray-500">CSAT Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {csatData?.total_ratings || 0}
            </div>
            <div className="text-sm text-gray-500">Total Ratings</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {csatData?.positive_ratings || 0}
            </div>
            <div className="text-sm text-gray-500">Positive</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {csatData?.negative_ratings || 0}
            </div>
            <div className="text-sm text-gray-500">Negative</div>
          </div>
        </div>
      </div>

      {/* Conversation Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Conversations (Last 7 Days)
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={recentDailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="conversations" fill="#3b82f6" name="Conversations" />
            <Bar dataKey="messages" fill="#8b5cf6" name="Messages" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            AI Performance (Last 7 Days)
          </h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={recentAiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="success_rate" stroke="#22c55e" name="Success Rate %" />
            <Line type="monotone" dataKey="confidence" stroke="#3b82f6" name="Confidence Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Response Time */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Average Response Time
          </h2>
        </div>
        <div className="text-4xl font-bold text-gray-900 dark:text-white">
          {dailyAnalytics.length > 0 
            ? Math.round(dailyAnalytics.reduce((acc, d) => acc + d.avg_response_time_seconds, 0) / dailyAnalytics.length / 60)
            : 0} min
        </div>
        <div className="text-sm text-gray-500 mt-2">Average across all conversations</div>
      </div>
    </div>
  );
}
