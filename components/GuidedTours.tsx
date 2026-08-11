'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Lightbulb } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function GuidedTours() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTours, setCompletedTours] = useState<string[]>([]);

  const tours: Record<string, { name: string; steps: TourStep[] }> = {
    inbox: {
      name: 'Inbox Tour',
      steps: [
        {
          target: '[data-tour="inbox-filters"]',
          title: 'Advanced Filters',
          content: 'Use these filters to quickly find conversations by status, channel, or tags.',
          position: 'bottom',
        },
        {
          target: '[data-tour="inbox-search"]',
          title: 'Search',
          content: 'Search for specific conversations by content, sender, or metadata.',
          position: 'bottom',
        },
        {
          target: '[data-tour="inbox-escalation"]',
          title: 'Escalation Queue',
          content: 'View conversations that need human attention or have been escalated.',
          position: 'left',
        },
      ],
    },
    campaigns: {
      name: 'Campaigns Tour',
      steps: [
        {
          target: '[data-tour="campaigns-create"]',
          title: 'Create Campaign',
          content: 'Create a new broadcast campaign to send messages to multiple customers.',
          position: 'bottom',
        },
        {
          target: '[data-tour="campaigns-list"]',
          title: 'Campaign List',
          content: 'View and manage all your campaigns, including their delivery status.',
          position: 'left',
        },
      ],
    },
    analytics: {
      name: 'Analytics Tour',
      steps: [
        {
          target: '[data-tour="analytics-csat"]',
          title: 'CSAT Score',
          content: 'Monitor customer satisfaction scores and feedback trends.',
          position: 'bottom',
        },
        {
          target: '[data-tour="analytics-performance"]',
          title: 'AI Performance',
          content: 'Track AI success rates, confidence scores, and escalation metrics.',
          position: 'bottom',
        },
      ],
    },
  };

  const startTour = (tourKey: string) => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    const tourKeys = Object.keys(tours);
    const currentTourKey = tourKeys[completedTours.length];
    const currentTour = currentTourKey ? tours[currentTourKey] : null;
    
    if (currentStep < currentTour?.steps.length! - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsActive(false);
    // Save to localStorage
    const currentTourKey = Object.keys(tours)[0];
    if (!completedTours.includes(currentTourKey)) {
      setCompletedTours([...completedTours, currentTourKey]);
      localStorage.setItem('completed_tours', JSON.stringify([...completedTours, currentTourKey]));
    }
  };

  const skipTour = () => {
    setIsActive(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem('completed_tours');
    if (saved) {
      setCompletedTours(JSON.parse(saved));
    }
  }, []);

  const getCurrentTour = () => {
    const tourKeys = Object.keys(tours);
    const incompleteTour = tourKeys.find(key => !completedTours.includes(key));
    return incompleteTour ? tours[incompleteTour] : null;
  };

  const currentTour = getCurrentTour();
  const currentStepData = currentTour?.steps[currentStep];

  if (!isActive || !currentTour || !currentStepData) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => startTour(Object.keys(tours)[0])}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 shadow-lg"
        >
          <Lightbulb className="w-4 h-4" />
          Take a Tour
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentTour.name}
            </h3>
            <p className="text-sm text-gray-500">
              Step {currentStep + 1} of {currentTour.steps.length}
            </p>
          </div>
          <button onClick={skipTour} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            {currentStepData.title}
          </h4>
          <p className="text-gray-600 dark:text-gray-300">{currentStepData.content}</p>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          <div className="flex gap-1">
            {currentTour.steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {currentStep === currentTour.steps.length - 1 ? 'Complete' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
