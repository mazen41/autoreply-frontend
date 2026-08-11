'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronRight, X, Sparkles } from 'lucide-react';

interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}

export default function OnboardingFlow() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const steps: OnboardingStep[] = [
    { id: 'connect_channel', name: 'Connect Channel', description: 'Connect your first communication channel', completed: false },
    { id: 'business_info', name: 'Add Business Info', description: 'Fill in your business details', completed: false },
    { id: 'enable_ai', name: 'Enable AI', description: 'Configure AI responses', completed: false },
    { id: 'test_message', name: 'Send Test Message', description: 'Test your AI setup', completed: false },
  ];

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/onboarding/status');
      const data = await response.json();
      setStatus(data);
      
      // Update steps completion
      const completedSteps = data.completed_steps || [];
      steps.forEach(step => {
        step.completed = completedSteps.includes(step.id);
      });
    } catch (error) {
      console.error('Failed to fetch onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepId: string) => {
    try {
      await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepId }),
      });
      await fetchStatus();
    } catch (error) {
      console.error('Failed to complete step:', error);
    }
  };

  const skipOnboarding = async () => {
    try {
      await fetch('/api/onboarding/skip', { method: 'POST' });
      setDismissed(true);
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading || dismissed || (status && status.completed)) {
    return null;
  }

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome to Naz!
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Let's get you set up in a few simple steps
            </p>
          </div>
          <button
            onClick={skipOnboarding}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span>Setup Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                step.completed
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {step.completed ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <span className="font-semibold">{index + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{step.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
              </div>
              {!step.completed && (
                <button
                  onClick={() => completeStep(step.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Complete
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Skip Button */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={skipOnboarding}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm"
          >
            Skip onboarding for now
          </button>
        </div>
      </div>
    </div>
  );
}
