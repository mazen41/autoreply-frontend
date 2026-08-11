'use client';

import { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, AlertTriangle, ArrowUpRight, Download } from 'lucide-react';

export default function BillingDashboard() {
  const [subscription, setSubscription] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBillingData = async () => {
    try {
      const [subRes, usageRes] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/billing/usage'),
      ]);

      setSubscription(await subRes.json());
      setUsageStats(await usageRes.json());
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    const planId = prompt('Enter plan ID to upgrade:');
    if (!planId) return;

    try {
      await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: planId, billing_cycle: 'monthly' }),
      });
      await fetchBillingData();
      alert('Upgrade successful!');
    } catch (error) {
      console.error('Failed to upgrade:', error);
      alert('Upgrade failed');
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Loading billing information...</div>;
  }

  const usagePercentage = usageStats?.usage_percentage || 0;
  const isNearLimit = usagePercentage >= 80;
  const isOverLimit = usagePercentage >= 100;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Current Plan
            </h2>
          </div>
          <button
            onClick={handleUpgrade}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowUpRight className="w-4 h-4" />
            Upgrade
          </button>
        </div>
        {subscription && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Plan</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {subscription.package?.name || 'Free'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Billing Cycle</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {subscription.billing_cycle}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className={`text-lg font-semibold ${
                subscription.status === 'active' ? 'text-green-600' : 'text-red-600'
              }`}>
                {subscription.status}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Usage Statistics
          </h2>
        </div>
        {usageStats && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-300">AI Messages Used</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {usageStats.usage_count} / {usageStats.is_unlimited ? 'Unlimited' : usageStats.usage_limit}
                </span>
              </div>
              {!usageStats.is_unlimited && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              )}
            </div>
            {isNearLimit && !isOverLimit && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">
                  You're approaching your usage limit. Consider upgrading to avoid service interruption.
                </span>
              </div>
            )}
            {isOverLimit && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-800 dark:text-red-200">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">
                  You've exceeded your usage limit. Additional charges may apply.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overage History */}
      {usageStats?.overages && usageStats.overages.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Overage History
          </h3>
          <div className="space-y-2">
            {usageStats.overages.map((overage: any) => (
              <div key={overage.id} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {overage.extra_messages} extra messages
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(overage.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    ${overage.amount.toFixed(2)}
                  </div>
                  <div className={`text-sm ${
                    overage.status === 'billed' ? 'text-green-600' :
                    overage.status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {overage.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download Invoice */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <Download className="w-5 h-5" />
          Download Latest Invoice
        </button>
      </div>
    </div>
  );
}
