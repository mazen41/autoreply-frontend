'use client';

import { useState, useEffect } from 'react';
import { Clock, Save, X } from 'lucide-react';

export default function AwayMessageBuilder({ businessId }: { businessId: number }) {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [loading, setLoading] = useState(false);

  const businessHours = [
    { day: 0, name: 'Sunday', start: '09:00', end: '17:00', active: true },
    { day: 1, name: 'Monday', start: '09:00', end: '17:00', active: true },
    { day: 2, name: 'Tuesday', start: '09:00', end: '17:00', active: true },
    { day: 3, name: 'Wednesday', start: '09:00', end: '17:00', active: true },
    { day: 4, name: 'Thursday', start: '09:00', end: '17:00', active: true },
    { day: 5, name: 'Friday', start: '09:00', end: '17:00', active: true },
    { day: 6, name: 'Saturday', start: '09:00', end: '17:00', active: false },
  ];

  const [hours, setHours] = useState(businessHours);

  const fetchSettings = async () => {
    try {
      const [hoursRes, messageRes] = await Promise.all([
        fetch(`/api/businesses/${businessId}/hours`),
        fetch(`/api/businesses/${businessId}/auto-messages`),
      ]);

      const hoursData = await hoursRes.json();
      const messageData = await messageRes.json();

      if (hoursData.length > 0) {
        setHours(hoursData);
      }

      if (messageData.length > 0) {
        const awayMsg = messageData.find((m: any) => m.type === 'away');
        if (awayMsg) {
          setEnabled(awayMsg.is_enabled);
          setMessage(awayMsg.message);
          setTimezone(awayMsg.timezone || 'UTC');
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetch(`/api/businesses/${businessId}/hours`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hours }),
        }),
        fetch(`/api/businesses/${businessId}/auto-messages`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'away',
            message,
            is_enabled: enabled,
            timezone,
          }),
        }),
      ]);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [businessId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Business Hours & Away Messages
          </h2>
        </div>
        <button
          onClick={saveSettings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Enable Toggle */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">
              Enable Away Messages
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Send automatic replies outside business hours
            </p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
          </div>
        </label>
      </div>

      {/* Away Message */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Away Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="We're currently closed. We'll get back to you during business hours."
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          rows={3}
        />
      </div>

      {/* Timezone */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Timezone
        </label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="UTC">UTC</option>
          <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
          <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
          <option value="Europe/London">Europe/London (GMT+0)</option>
          <option value="America/New_York">America/New_York (GMT-5)</option>
        </select>
      </div>

      {/* Business Hours */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Business Hours
        </h3>
        <div className="space-y-3">
          {hours.map((hour) => (
            <div key={hour.day} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">{hour.name}</span>
              </div>
              <input
                type="time"
                value={hour.start}
                onChange={(e) => {
                  const newHours = [...hours];
                  newHours[hour.day].start = e.target.value;
                  setHours(newHours);
                }}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600 dark:text-white"
              />
              <span className="text-gray-500">to</span>
              <input
                type="time"
                value={hour.end}
                onChange={(e) => {
                  const newHours = [...hours];
                  newHours[hour.day].end = e.target.value;
                  setHours(newHours);
                }}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600 dark:text-white"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hour.active}
                  onChange={(e) => {
                    const newHours = [...hours];
                    newHours[hour.day].active = e.target.checked;
                    setHours(newHours);
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">Active</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
