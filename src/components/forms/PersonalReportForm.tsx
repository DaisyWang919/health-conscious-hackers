import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { ReportFormBase } from './ReportFormBase';
import { FormField } from '../ui/FormField';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { MemoWithAudio } from '../../utils/db';
import { theme } from '../../styles/theme';

interface PersonalReportFormProps {
  onBack: () => void;
  onHistoryClick: () => void;
  reportTopic: string;
  onReportTopicChange: (topic: string) => void;
  analysisType: string;
  onAnalysisTypeChange: (type: string) => void;
  dateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  onUpdateDateRange: () => void;
  selectedMemos: string[];
  memos: MemoWithAudio[];
  onMemoToggle: (id: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

const analysisTypes = [
  { id: 'health', label: 'Overall Health', description: 'Comprehensive analysis of general health status, trends, and recommendations' },
  { id: 'symptoms', label: 'Symptom Analysis', description: 'Detailed analysis of symptoms, their patterns, and potential causes' },
  { id: 'treatment', label: 'Treatment Effectiveness', description: 'Evaluation of treatments, medications, and their effects over time' },
  { id: 'general', label: 'General Analysis', description: 'Balanced overview of all health-related aspects in your memos' }
];

export const PersonalReportForm: React.FC<PersonalReportFormProps> = ({
  onBack,
  onHistoryClick,
  reportTopic,
  onReportTopicChange,
  analysisType,
  onAnalysisTypeChange,
  dateRange,
  onDateRangeChange,
  onUpdateDateRange,
  selectedMemos,
  memos,
  onMemoToggle,
  onSubmit,
  isGenerating
}) => {
  const submitButton = (
    <Button
      variant="primary"
      color="blue"
      icon={isGenerating ? Loader2 : Sparkles}
      isLoading={isGenerating}
      loadingText="Generating..."
      onClick={onSubmit}
      disabled={selectedMemos.length === 0 || isGenerating}
    >
      Generate Report
    </Button>
  );

  return (
    <ReportFormBase
      title="Personal Health Report"
      onBack={onBack}
      onHistoryClick={onHistoryClick}
      dateRange={dateRange}
      onDateRangeChange={onDateRangeChange}
      onUpdateDateRange={onUpdateDateRange}
      selectedMemos={selectedMemos}
      memos={memos}
      onMemoToggle={onMemoToggle}
      onSubmit={onSubmit}
      isSubmitting={isGenerating}
      submitDisabled={selectedMemos.length === 0}
      submitButton={submitButton}
      colorScheme="blue"
    >
      <FormField label="Report Topic">
        <TextField
          type="text"
          value={reportTopic}
          onChange={(e) => onReportTopicChange(e.target.value)}
          color="blue"
          placeholder="E.g., My Blood Pressure, Sleep Quality, Treatment Progress"
        />
      </FormField>
      
      <FormField label="Analysis Type">
        <div className="grid md:grid-cols-2 gap-3">
          {analysisTypes.map(type => (
            <div 
              key={type.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                analysisType === type.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onAnalysisTypeChange(type.id)}
            >
              <div className="flex items-start">
                <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 mr-2 ${
                  analysisType === type.id 
                    ? 'bg-blue-500' 
                    : 'border border-gray-300'
                }`}>
                  {analysisType === type.id && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{type.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </FormField>
    </ReportFormBase>
  );
};