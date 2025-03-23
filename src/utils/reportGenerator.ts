import { MemoWithAudio } from './db';
import { generateAnalysisReport } from './openai';
import { AnalysisReport } from './openai';

export interface ReportConfig {
  reportType: 'personal' | 'doctor' | 'therapist';
  topic: string;
  analysisType: string;
  memos: MemoWithAudio[];
  selectedMemos: string[];
  additionalData?: Record<string, any>;
}

export async function generateReport(config: ReportConfig): Promise<AnalysisReport | null> {
  const { reportType, topic, analysisType, memos, selectedMemos, additionalData = {} } = config;

  if (selectedMemos.length === 0) {
    throw new Error('Please select at least one memo for analysis');
  }

  const filteredMemos = memos
    .filter(memo => selectedMemos.includes(memo.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const transcripts = filteredMemos.map(memo => memo.transcript);

  // Enhance analysis based on report type and additional data
  let enhancedTopic = topic;
  const options = {
    includeEmotional: false,
    includePhysical: false,
    includeHabits: false,
    customFocus: ''
  };

  switch (reportType) {
    case 'doctor':
      enhancedTopic = `Clinical Report: ${topic}`;
      options.includePhysical = true;
      options.customFocus = additionalData?.appointmentReason || '';
      break;
    case 'therapist':
      enhancedTopic = `Mental Health Assessment: ${topic}`;
      options.includeEmotional = true;
      options.includeHabits = true;
      break;
    default:
      options.includePhysical = true;
      options.includeEmotional = true;
  }

  return generateAnalysisReport(transcripts, enhancedTopic, options);
}