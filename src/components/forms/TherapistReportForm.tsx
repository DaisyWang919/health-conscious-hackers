import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { ReportFormBase } from './ReportFormBase';
import { FormField } from '../ui/FormField';
import { TextArea } from '../ui/TextArea';
import { RatingScale } from '../ui/RatingScale';
import { Button } from '../ui/Button';
import { useFormState } from '../../hooks/useFormState';
import { MemoWithAudio } from '../../utils/db';

interface TherapistReportFormProps {
  onBack: () => void;
  onHistoryClick: () => void;
  moodRating: number;
  onMoodRatingChange: (rating: number) => void;
  sleepQuality: number;
  onSleepQualityChange: (rating: number) => void;
  stressLevel: number;
  onStressLevelChange: (rating: number) => void;
  copingStrategies: string;
  onCopingStrategiesChange: (strategies: string) => void;
  dateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  onUpdateDateRange: () => void;
  selectedMemos: string[];
  memos: MemoWithAudio[];
  onMemoToggle: (id: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

const RatingScale: React.FC<{
  value: number;
  onChange: (value: number) => void;
  labels: { min: string; mid: string; max: string };
}> = ({ value, onChange, labels }) => (
  <>
    <div className="flex items-center justify-between my-2">
      <span className="text-sm text-gray-500">{labels.min}</span>
      <span className="text-sm text-gray-500">{labels.mid}</span>
      <span className="text-sm text-gray-500">{labels.max}</span>
    </div>
    <div className="flex items-center space-x-2">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className={`w-1/5 py-2 rounded-md ${
            value === rating
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {rating}
        </button>
      ))}
    </div>
  </>
);

export const TherapistReportForm: React.FC<TherapistReportFormProps> = ({
  onBack,
  onHistoryClick,
  moodRating,
  onMoodRatingChange,
  sleepQuality,
  onSleepQualityChange,
  stressLevel,
  onStressLevelChange,
  copingStrategies,
  onCopingStrategiesChange,
  dateRange,
  onDateRangeChange,
  onUpdateDateRange,
  selectedMemos,
  memos,
  onMemoToggle,
  onSubmit,
  isGenerating
}) => {
  const { state, handleChange } = useFormState({
    moodRating,
    sleepQuality,
    stressLevel,
    copingStrategies
  });

  const submitButton = (
    <Button
      variant="primary"
      color="purple"
      icon={isGenerating ? Loader2 : Sparkles}
      isLoading={isGenerating}
      loadingText="Generating..."
      onClick={onSubmit}
      disabled={selectedMemos.length === 0 || isGenerating}
    >
      Generate Therapy Report
    </Button>
  );

  return (
    <ReportFormBase
      title="Therapy Assessment"
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
      colorScheme="purple"
    >
      <FormField label="How would you rate your overall mood?">
        <RatingScale
          value={state.moodRating}
          onChange={value => handleChange('moodRating')(value)}
          labels={{ min: 'Very low', mid: 'Neutral', max: 'Very high' }}
          color="purple"
        />
      </FormField>
      
      <FormField label="How would you rate your sleep quality?">
        <RatingScale
          value={state.sleepQuality}
          onChange={value => handleChange('sleepQuality')(value)}
          labels={{ min: 'Very poor', mid: 'Average', max: 'Excellent' }}
          color="purple"
        />
      </FormField>
      
      <FormField label="How would you rate your stress level?">
        <RatingScale
          value={state.stressLevel}
          onChange={value => handleChange('stressLevel')(value)}
          labels={{ min: 'Very low', mid: 'Moderate', max: 'Very high' }}
          color="purple"
        />
      </FormField>
      
      <FormField label="What coping strategies have you been using?">
        <TextArea
          value={state.copingStrategies}
          onChange={handleChange('copingStrategies')}
          color="purple"
          placeholder="E.g., meditation, exercise, journaling"
        />
      </FormField>
    </ReportFormBase>
  );
};