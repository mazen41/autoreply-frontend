'use client';

import { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Clock, Play } from 'lucide-react';

export default function DripSequencesBuilder({ businessId }: { businessId: number }) {
  const [sequences, setSequences] = useState<any[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newSequence, setNewSequence] = useState({
    name: '',
    trigger_type: 'manual',
    steps: [
      { message: '', delay_hours: 0 },
      { message: '', delay_hours: 24 },
      { message: '', delay_hours: 72 },
    ],
  });

  const fetchSequences = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/sequences`);
      const data = await response.json();
      setSequences(data);
    } catch (error) {
      console.error('Failed to fetch sequences:', error);
    }
  };

  const createSequence = async () => {
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/sequences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSequence),
      });
      setShowBuilder(false);
      setNewSequence({
        name: '',
        trigger_type: 'manual',
        steps: [
          { message: '', delay_hours: 0 },
          { message: '', delay_hours: 24 },
          { message: '', delay_hours: 72 },
        ],
      });
      await fetchSequences();
    } catch (error) {
      console.error('Failed to create sequence:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSequence = async (sequenceId: number) => {
    if (!confirm('Are you sure you want to delete this sequence?')) return;
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${businessId}/sequences/${sequenceId}`, {
        method: 'DELETE',
      });
      await fetchSequences();
    } catch (error) {
      console.error('Failed to delete sequence:', error);
    }
  };

  useEffect(() => {
    fetchSequences();
  }, [businessId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Drip Sequences
          </h2>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          New Sequence
        </button>
      </div>

      {showBuilder && (
        <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Create New Sequence
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sequence Name
              </label>
              <input
                type="text"
                value={newSequence.name}
                onChange={(e) => setNewSequence({ ...newSequence, name: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                placeholder="Welcome Sequence"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trigger Type
              </label>
              <select
                value={newSequence.trigger_type}
                onChange={(e) => setNewSequence({ ...newSequence, trigger_type: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
              >
                <option value="manual">Manual</option>
                <option value="new_user">New User</option>
                <option value="tag_added">Tag Added</option>
                <option value="no_reply">No Reply</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Sequence Steps
              </label>
              <div className="space-y-3">
                {newSequence.steps.map((step, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Step {index + 1}
                      </span>
                      <Clock className="w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={step.delay_hours}
                        onChange={(e) => {
                          const newSteps = [...newSequence.steps];
                          newSteps[index].delay_hours = parseInt(e.target.value);
                          setNewSequence({ ...newSequence, steps: newSteps });
                        }}
                        className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600 dark:text-white"
                        placeholder="Hours"
                      />
                      <span className="text-sm text-gray-500">hours after</span>
                    </div>
                    <textarea
                      value={step.message}
                      onChange={(e) => {
                        const newSteps = [...newSequence.steps];
                        newSteps[index].message = e.target.value;
                        setNewSequence({ ...newSequence, steps: newSteps });
                      }}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                      rows={2}
                      placeholder="Message content..."
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createSequence}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Sequence'}
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
        {sequences.map((sequence) => (
          <div key={sequence.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{sequence.name}</h4>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">
                    {sequence.trigger_type}
                  </span>
                  <span>{sequence.steps?.length || 0} steps</span>
                  {sequence.is_active ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-gray-400">Inactive</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteSequence(sequence.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
