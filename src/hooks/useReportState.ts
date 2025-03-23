import { useState } from 'react';
import { useReports } from './useReports';
import { useMemos } from './useMemos';
import { useFormState } from './useFormState';
import { generateReport, ReportConfig } from '../utils/reportGenerator';
import toast from 'react-hot-toast';

interface UseReportStateOptions {
  onSuccess?: () => void;
}

export function useReportState({ onSuccess }: UseReportStateOptions = {}) {
  const { memos } = useMemos();
  const { saveReport } = useReports();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentView, setCurrentView] = useState<'history' | 'audience-select' | 'form' | 'view'>('history');
  
  // Form state
  const { state, handleChange } = useFormState({
    reportTopic: '',
    analysisType: 'health',
    appointmentReason: '',
    recentSymptoms: '',
    medicationChanges: '',
    moodRating: 3,
    sleepQuality: 3,
    stressLevel: 3,
    copingStrategies: ''
  });

  const handleGenerateReport = async (config: ReportConfig) => {
    if (config.selectedMemos.length === 0) {
      toast.error('Please select at least one memo for analysis');
      return null;
    }

    setIsGenerating(true);

    try {
      const report = await generateReport(config);
      
      if (report) {
        await saveReport({
          title: config.topic,
          topic: config.topic,
          analysisType: config.analysisType,
          date: new Date().toISOString(),
          reportContent: JSON.stringify(report),
          memoIds: config.selectedMemos.join(',')
        });

        toast.success('Report generated successfully');
        onSuccess?.();
        return report;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate report';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }

    return null;
  };

  return {
    state,
    handleChange,
    currentView,
    setCurrentView,
    isGenerating,
    handleGenerateReport,
    memos
  };
}