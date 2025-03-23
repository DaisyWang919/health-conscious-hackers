import { useState } from 'react';
import { useReports } from './useReports';
import { generateAnalysisReport } from '../utils/openai';
import { MemoWithAudio } from '../utils/db';
import toast from 'react-hot-toast';

interface UseReportGenerationProps {
  onSuccess?: () => void;
}

export const useReportGeneration = ({ onSuccess }: UseReportGenerationProps = {}) => {
  const { saveReport } = useReports();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const generateReport = async ({
    memos,
    selectedMemos,
    reportTopic,
    analysisType
  }: {
    memos: MemoWithAudio[];
    selectedMemos: string[];
    reportTopic: string;
    analysisType: string;
  }) => {
    if (selectedMemos.length === 0) {
      toast.error('Please select at least one memo for analysis');
      return null;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const filteredMemos = memos
        .filter(memo => selectedMemos.includes(memo.id))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const transcripts = filteredMemos.map(memo => memo.transcript);
      
      const generatedReport = await generateAnalysisReport(
        transcripts,
        reportTopic,
        analysisType
      );
      
      await saveReport({
        title: reportTopic,
        topic: reportTopic,
        analysisType,
        date: new Date().toISOString(),
        reportContent: JSON.stringify(generatedReport),
        memoIds: selectedMemos.join(',')
      });
      
      toast.success('AI analysis report generated successfully');
      onSuccess?.();
      
      return generatedReport;
    } catch (error) {
      console.error('Error generating report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
      setGenerationError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateReport,
    isGenerating,
    generationError
  };
};