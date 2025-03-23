import React from 'react';
import { History, ArrowLeft } from 'lucide-react';
import { MemoWithAudio } from '../../utils/db';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PageHeader } from '../ui/PageHeader';
import { MemoList } from '../ui/MemoList';
import { DateRangePicker } from '../ui/DateRangePicker';
import { theme } from '../../styles/theme';

interface ReportFormBaseProps {
  title: string;
  onBack: () => void;
  onHistoryClick: () => void;
  children: React.ReactNode;
  dateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  onUpdateDateRange: () => void;
  selectedMemos: string[];
  memos: MemoWithAudio[];
  onMemoToggle: (id: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitDisabled: boolean;
  submitButton: React.ReactNode;
  colorScheme?: 'blue' | 'green' | 'purple';
}

export const ReportFormBase: React.FC<ReportFormBaseProps> = ({
  title,
  onBack,
  onHistoryClick,
  children,
  dateRange,
  onDateRangeChange,
  onUpdateDateRange,
  selectedMemos,
  memos,
  onMemoToggle,
  onSubmit,
  isSubmitting,
  submitDisabled,
  submitButton,
  colorScheme = 'blue'
}) => {
  return (
    <div>
      <PageHeader
        title={title}
        onBack={onBack}
        actions={
          <Button
            variant="secondary"
            color="gray"
            icon={History}
            onClick={onHistoryClick}
          >
            Report History
          </Button>
        }
      />
      
      <Card>
        {children}
        
        <div className="mb-6">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
            onUpdateDateRange={onUpdateDateRange}
            colorScheme={colorScheme}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Select Health Memos ({selectedMemos.length} selected)
          </label>
          <MemoList
            memos={memos}
            selectedMemos={selectedMemos}
            onMemoToggle={onMemoToggle}
            colorScheme={colorScheme}
          />
        </div>
        
        <div className="flex justify-between mt-8">
          <Button variant="outline" color="gray" onClick={onBack}>
            Back
          </Button>
          
          {submitButton}
        </div>
      </Card>
    </div>
  );
};