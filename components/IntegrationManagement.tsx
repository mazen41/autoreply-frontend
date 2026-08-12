'use client';

import { useState, useEffect } from 'react';
import { Link, Plus, Trash2, TestTube, Globe } from 'lucide-react';

export default function IntegrationManagement({ businessId }: { businessId: number }) {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: ['new_message', 'escalation'],
    secret: '',
  });

  const fetchWebhooks = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/webhooks`);
      const data = await response.json();
      setWebhooks(data);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    }
  };

  const createWebhook = async () => {
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook),
      });
      setShowBuilder(false);
      setNewWebhook({
        url: '',
        events: ['new_message', 'escalation'],
        secret: '',
      });
      await fetchWebhooks();
    } catch (error) {
      console.error('Failed to create webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async (webhookId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/webhooks/${webhookId}/test`, {
        method: 'POST',
      });
      alert('Test webhook sent!');
    } catch (error) {
      console.error('Failed to test webhook:', error);
      alert('Failed to send test webhook');
    }
  };

  const deleteWebhook = async (webhookId: number) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/webhooks/${webhookId}`, {
        method: 'DELETE',
      });
      await fetchWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [businessId]);

  const availableEvents = [
    'new_message',
    'new_assignment',
    'failed_message',
    'overage_alert',
    'payment_failed',
    'csat_negative',
    'escalation',
    'campaign_sent',
    'sequence_completed',
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Webhooks & Integrations
          </h2>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      {showBuilder && (
        <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Add New Webhook
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                placeholder="https://your-server.com/webhook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Events to Subscribe
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableEvents.map((event) => (
                  <label key={event} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                    <input
                      type="checkbox"
                      checked={newWebhook.events.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWebhook({
                            ...newWebhook,
                            events: [...newWebhook.events, event],
                          });
                        } else {
                          setNewWebhook({
                            ...newWebhook,
                            events: newWebhook.events.filter((e) => e !== event),
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secret (optional, for signature verification)
              </label>
              <input
                type="text"
                value={newWebhook.secret}
                onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                placeholder="webhook_secret_key"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={createWebhook}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Add Webhook'}
              </button>
              <button
                onClick={() => setShowBuilder(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <div key={webhook.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <code className="text-sm text-gray-900 dark:text-white">{webhook.url}</code>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {webhook.events.map((event: string) => (
                    <span key={event} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                      {event}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{webhook.success_count} successful</span>
                  <span>{webhook.failure_count} failed</span>
                  {webhook.last_triggered_at && (
                    <span>Last: {new Date(webhook.last_triggered_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => testWebhook(webhook.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                  title="Test Webhook"
                >
                  <TestTube className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteWebhook(webhook.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
