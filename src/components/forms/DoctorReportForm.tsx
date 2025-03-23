import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { ReportFormBase } from './ReportFormBase';
import { FormField } from '../ui/FormField';
import { TextArea } from '../ui/TextArea';
import { Button } from '../ui/Button';
import { MemoWithAudio } from '../../utils/db';

interface DoctorReportFormProps {
  onBack: () => void;
  onHistoryClick: () => void;
  appointmentReason: string;
  onAppointmentReasonChange: (reason: string) => void;
  recentSymptoms: string;
  onRecentSymptomsChange: (symptoms: string) => void;
  medicationChanges: string;
  onMedicationChangesChange: (changes: string) => void;
  dateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  onUpdateDateRange: () => void;
  selectedMemos: string[];
  memos: MemoWithAudio[];
  onMemoToggle: (id: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

export const DoctorReportForm: React.FC<DoctorReportFormProps> = ({
  onBack,
  onHistoryClick,
  appointmentReason,
  onAppointmentReasonChange,
  recentSymptoms,
  onRecentSymptomsChange,
  medicationChanges,
  onMedicationChangesChange,
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
      color="green"
      icon={isGenerating ? Loader2 : Sparkles}
      isLoading={isGenerating}
      loadingText="Generating..."
      onClick={onSubmit}
      disabled={selectedMemos.length === 0 || isGenerating || !appointmentReason.trim()}
    >
      Generate Clinical Report
    </Button>
  );

  return (
    <ReportFormBase
      title="Medical Report"
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
      submitDisabled={selectedMemos.length === 0 || !appointmentReason.trim()}
      submitButton={submitButton}
      colorScheme="green"
    >
      <FormField 
        label="Reason for Appointment"
        required
        helperText="This helps your doctor understand the context of your visit"
      >
        <TextArea
          value={appointmentReason}
          onChange={(e) => onAppointmentReasonChange(e.target.value)}
          color="green"
          placeholder="E.g., Annual checkup, follow-up on medication, discussing recent symptoms"
        />
      </FormField>
      
      <FormField label="Recent Symptoms">
        <TextArea
          value={recentSymptoms}
          onChange={(e) => onRecentSymptomsChange(e.target.value)}
          color="green"
          placeholder="Describe any symptoms you've experienced recently"
        />
      </FormField>
      
      <FormField label="Medication Changes">
        <TextArea
          value={medicationChanges}
          onChange={(e) => onMedicationChangesChange(e.target.value)}
          color="green"
          placeholder="List any changes to your medications"
        />
      </FormField>
    </ReportFormBase>
  );
};