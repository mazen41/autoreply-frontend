'use client';

import { useState, useEffect } from 'react';
import { Send, Calendar, Filter, Plus, Trash2, Play } from 'lucide-react';

function authHeaders(json = false) {
  const token = document.cookie.match(/(?:^|;\s*)naz_token=([^;]*)/)?.[1] || '';
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Accept: 'application/json',
    Authorization: `Bearer ${decodeURIComponent(token)}`,
  };
}

export default function CampaignsBuilder({ businessId }: { businessId: number }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    channel_id: '',
    scheduled_at: '',
    filters: { tags: [], last_activity_days: 30 },
  });

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/campaigns`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const createCampaign = async () => {
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/campaigns`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify(newCampaign),
      });
      setShowBuilder(false);
      setNewCampaign({
        name: '',
        message: '',
        channel_id: '',
        scheduled_at: '',
        filters: { tags: [], last_activity_days: 30 },
      });
      await fetchCampaigns();
    } catch (error) {
      console.error('Failed to create campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const launchCampaign = async (campaignId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/campaigns/${campaignId}/launch`, {
        method: 'POST',
        headers: authHeaders(),
      });
      await fetchCampaigns();
    } catch (error) {
      console.error('Failed to launch campaign:', error);
    }
  };

  const deleteCampaign = async (campaignId: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      await fetchCampaigns();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [businessId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Send className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Campaigns
          </h2>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {showBuilder && (
        <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Create New Campaign
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                placeholder="Summer Sale Campaign"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={newCampaign.message}
                onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                rows={3}
                placeholder="Your special offer message..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Schedule (optional)
              </label>
              <input
                type="datetime-local"
                value={newCampaign.scheduled_at}
                onChange={(e) => setNewCampaign({ ...newCampaign, scheduled_at: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={createCampaign}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Campaign'}
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
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{campaign.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {campaign.message.substring(0, 100)}...
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded ${
                    campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                    campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                  {campaign.total_recipients > 0 && (
                    <span>{campaign.sent_count}/{campaign.total_recipients} sent</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => launchCampaign(campaign.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Launch Campaign"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteCampaign(campaign.id)}
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
