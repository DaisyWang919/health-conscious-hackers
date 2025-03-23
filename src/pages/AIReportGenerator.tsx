import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Sparkles, Calendar, CheckCircle2, Loader2, History, Clock, FileText, Plus, User, UserRound, Stethoscope, Brain } from 'lucide-react';
import { useMemos } from '../hooks/useMemos';
import { useReports } from '../hooks/useReports';
import toast from 'react-hot-toast';
import { generateAnalysisReport } from '../utils/openai';
import type { AnalysisReport } from '../utils/openai';
import AIAnalysisReport from '../components/AIAnalysisReport';
import ReportHistoryList from '../components/ReportHistoryList';
import { getLocalDateString } from '../utils/dateUtils';
import { Report } from '../utils/db';

// Report audience types
const reportAudienceTypes = [
  { 
    id: 'me', 
    name: 'Me', 
    icon: <UserRound size={40} />,
    description: 'Generate a report for your personal health tracking and insights',
    color: 'blue'
  },
  { 
    id: 'doctor', 
    name: 'Doctor', 
    icon: <Stethoscope size={40} />,
    description: 'Generate a clinical report formatted for medical professionals',
    color: 'green'
  },
  { 
    id: 'therapist', 
    name: 'Therapist', 
    icon: <Brain size={40} />,
    description: 'Generate a report focused on mental health and behavioral patterns',
    color: 'purple'
  }
];

function AIReportGenerator() {
  const { memos } = useMemos();
  const { reports, saveReport, deleteReport, getParsedReport } = useReports();
  const navigate = useNavigate();
  const location = useLocation();
  
  // View state
  const [currentView, setCurrentView] = useState<'history' | 'audience-select' | 'form' | 'view'>('history');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  
  // New report state
  const [selectedMemos, setSelectedMemos] = useState<string[]>(
    location.state?.selectedMemos || []
  );
  const [reportTopic, setReportTopic] = useState('My Health Status');
  const [dateRange, setDateRange] = useState({
    from: getLocalDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()), // 30 days ago
    to: getLocalDateString(new Date().toISOString()) // today
  });
  
  // Doctor-specific fields
  const [appointmentReason, setAppointmentReason] = useState('');
  const [recentSymptoms, setRecentSymptoms] = useState('');
  const [medicationChanges, setMedicationChanges] = useState('');
  
  // Therapist-specific fields
  const [moodRating, setMoodRating] = useState<number>(3);
  const [sleepQuality, setSleepQuality] = useState<number>(3);
  const [stressLevel, setStressLevel] = useState<number>(3);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);

  // Check for initialView from location state
  useEffect(() => {
    if (location.state?.initialView) {
      setCurrentView(location.state.initialView);
    }
  }, [location.state]);
  
  useEffect(() => {
    // If no memos are selected on mount, pre-select memos from the last 30 days
    if (selectedMemos.length === 0) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59);
      
      const filteredMemos = memos
        .filter(memo => {
          const memoDate = new Date(memo.date);
          return memoDate >= fromDate && memoDate <= toDate;
        })
        .map(memo => memo.id);
      
      setSelectedMemos(filteredMemos);
    }
  }, [memos]);
  
  const filteredMemos = memos.filter(memo => selectedMemos.includes(memo.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const toggleMemoSelection = (id: string) => {
    if (selectedMemos.includes(id)) {
      setSelectedMemos(selectedMemos.filter(memoId => memoId !== id));
    } else {
      setSelectedMemos([...selectedMemos, id]);
    }
  };
  
  const updateDateRange = () => {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59);
    
    const filteredMemoIds = memos
      .filter(memo => {
        const memoDate = new Date(memo.date);
        return memoDate >= fromDate && memoDate <= toDate;
      })
      .map(memo => memo.id);
    
    setSelectedMemos(filteredMemoIds);
    toast.success(`Selected ${filteredMemoIds.length} memos from the date range`);
  };
  
  const handleGenerateReport = async () => {
    if (selectedMemos.length === 0) {
      toast.error('Please select at least one memo for analysis');
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      // Get transcripts from selected memos
      const transcripts = filteredMemos.map(memo => ({
        text: memo.transcript,
        date: new Date(memo.date).toLocaleDateString()
      }));
      
      // Use a different approach based on the selected audience
      let generatedReport;
      
      if (selectedAudience === 'doctor') {
        // Doctor report format
        generatedReport = await generateDoctorReport(
          transcripts,
          appointmentReason,
          recentSymptoms,
          medicationChanges
        );
      } else if (selectedAudience === 'therapist') {
        // Therapist report format
        generatedReport = await generateTherapistReport(
          transcripts,
          reportTopic,
          { moodRating, sleepQuality, stressLevel }
        );
      } else {
        // Personal report format - use standard analysis
        generatedReport = await generateAnalysisReport(
          transcripts.map(t => t.text),
          reportTopic,
          'general' // Default to general analysis
        );
      }
      
      setReport(generatedReport);
      
      // Save report to database with audience type
      await saveReport({
        title: reportTopic || (selectedAudience === 'doctor' ? 'Clinical Report' : 'Health Report'),
        topic: reportTopic || (selectedAudience === 'doctor' ? appointmentReason : 'Health Analysis'),
        analysisType: selectedAudience || 'personal',
        date: new Date().toISOString(),
        reportContent: JSON.stringify(generatedReport),
        memoIds: selectedMemos.join(',')
      });
      
      setCurrentView('view');
      toast.success('AI analysis report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      if (error instanceof Error) {
        setGenerationError(error.message);
        toast.error(error.message);
      } else {
        setGenerationError('Failed to generate report');
        toast.error('Failed to generate report');
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Generate a doctor-focused report with direct patient quotes
  const generateDoctorReport = async (
    transcripts: { text: string, date: string }[],
    appointmentReason: string,
    recentSymptoms: string,
    medicationChanges: string
  ) => {
    // Use OpenAI API to generate a doctor-formatted report
    const contextInfo = `
      Patient-provided reason for appointment:
      ${appointmentReason}
      
      ${recentSymptoms ? `Recent symptoms: ${recentSymptoms}` : ''}
      ${medicationChanges ? `Medication changes: ${medicationChanges}` : ''}
      
      Relevant patient quotes from memos:
      ${transcripts.map(t => `- "${t.text}" (${t.date})`).join('\n')}
    `;
    
    const systemPrompt = 
      "You are preparing a concise summary for a doctor. Select and lightly edit direct patient quotes " +
      "from provided voice memos explicitly relevant to the appointment reason. Preserve original phrasing as much as possible. " +
      "Do NOT add interpretations or analysis beyond minimal clarification for readability.";
    
    // For simplicity, let's reuse our existing analysis structure but customize it
    // In a real app, you might want to create a new API endpoint for this specific format
    try {
      if (!import.meta.env.VITE_OPENAI_API_KEY || 
          import.meta.env.VITE_OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
        // Return mock data if no API key
        return getMockDoctorReport(appointmentReason);
      }
      
      // In a real implementation, you'd call your API here with the specialized prompt
      // For now, we'll adapt our existing report format to simulate this
      
      // This is where you'd make a real API call with the specific doctor report format
      // For now, we're using the existing function but will update it in the future
      const plainTextTranscripts = transcripts.map(t => t.text);
      const report = await generateAnalysisReport(plainTextTranscripts, appointmentReason, 'health');
      
      return report;
    } catch (error) {
      console.error('Error generating doctor report:', error);
      throw new Error('Failed to generate doctor report');
    }
  };
  
  // Generate a therapist-focused report with emotional health analysis
  const generateTherapistReport = async (
    transcripts: { text: string, date: string }[],
    focusArea: string,
    metrics: { moodRating: number, sleepQuality: number, stressLevel: number }
  ) => {
    // Use OpenAI API to generate a therapy-formatted report
    const contextInfo = `
      User is preparing for therapy and provided voice memos focused on emotional health and related topics.
      
      User-defined focus/topics: ${focusArea || 'General emotional wellbeing'}
      
      Self-reported metrics:
      - Mood rating: ${metrics.moodRating}/5
      - Sleep quality: ${metrics.sleepQuality}/5
      - Stress level: ${metrics.stressLevel}/5
      
      Selected memos:
      ${transcripts.map(t => `- "${t.text}" (${t.date})`).join('\n')}
    `;
    
    const systemPrompt = 
      "You are a thoughtful, emotionally-aware therapeutic assistant. Synthesize provided voice memos " +
      "into concise, insightful reports highlighting emotional states, mood fluctuations, coping strategies, " +
      "and stressors. Your primary goal is to help user and their therapist gain deeper clarity and enhance therapeutic support.";
    
    try {
      if (!import.meta.env.VITE_OPENAI_API_KEY || 
          import.meta.env.VITE_OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
        // Return mock data if no API key
        return getMockTherapistReport(focusArea, metrics);
      }
      
      // In a real implementation, you'd call your API here with the specialized prompt
      // For now, we'll adapt our existing report format to simulate this
      
      // This is where you'd make a real API call with the specific therapist report format
      // For now, we're using the existing function but will update it in the future
      const plainTextTranscripts = transcripts.map(t => t.text);
      const report = await generateAnalysisReport(plainTextTranscripts, focusArea, 'general');
      
      return report;
    } catch (error) {
      console.error('Error generating therapist report:', error);
      throw new Error('Failed to generate therapist report');
    }
  };
  
  // Mock doctor report for when no API key is available
  const getMockDoctorReport = (appointmentReason: string): AnalysisReport => {
    return {
      executiveSummary: `Patient requested appointment regarding: ${appointmentReason}. The following are direct quotes from patient's health memos relevant to this concern.`,
      detailedFindings: [
        "I've been experiencing headaches in the morning for the past week, particularly on the right side.",
        "My blood pressure readings have been around 135/85, which is higher than my usual 120/75.",
        "The dizziness seems to happen mostly when I stand up quickly after sitting for a long time.",
        "I've noticed some swelling in my ankles at the end of the day, especially after standing for long periods."
      ],
      insights: [
        "Patient noted correlation between headaches and poor sleep",
        "Patient mentioned stress at work coinciding with symptom onset",
        "Patient reported higher salt intake in recent weeks",
        "Patient observed symptom improvement after light exercise"
      ],
      recommendations: [
        {
          recommendation: "Review current medication regimen",
          confidence: 0.87,
          rationale: "Patient quotes indicate potential side effects from current medications."
        },
        {
          recommendation: "Consider blood pressure monitoring",
          confidence: 0.92,
          rationale: "Multiple mentions of elevated blood pressure readings in patient memos."
        }
      ],
      riskAssessment: {
        risks: [
          {
            risk: "Potential hypertension",
            severity: "medium",
            mitigation: "Regular blood pressure monitoring"
          }
        ],
        overallRiskLevel: "medium"
      },
      implementationTimeline: {
        immediate: [
          "Review medication list with patient",
          "Check current blood pressure"
        ],
        shortTerm: [
          "Follow-up appointment in 2 weeks",
          "Consider 24-hour blood pressure monitoring"
        ],
        longTerm: [
          "Regular quarterly check-ups",
          "Lifestyle modifications as needed"
        ]
      }
    };
  };
  
  // Mock therapist report for when no API key is available
  const getMockTherapistReport = (
    focusArea: string, 
    metrics: { moodRating: number, sleepQuality: number, stressLevel: number }
  ): AnalysisReport => {
    return {
      executiveSummary: `Emotional health assessment focused on: ${focusArea}. Client self-reported mood (${metrics.moodRating}/5), sleep quality (${metrics.sleepQuality}/5), and stress level (${metrics.stressLevel}/5).`,
      detailedFindings: [
        "Client expressed feelings of overwhelm related to work responsibilities",
        "Client described difficulty falling asleep and racing thoughts at night",
        "Client noted increased irritability with family members",
        "Client mentioned positive response to morning walks and journaling"
      ],
      insights: [
        "Clear connection between work stressors and sleep difficulties",
        "Pattern of emotional dysregulation appears strongest in evenings",
        "Social withdrawal appears to be a response to emotional overload",
        "Positive emotional experiences correlate with outdoor activities"
      ],
      recommendations: [
        {
          recommendation: "Explore mindfulness techniques for sleep",
          confidence: 0.85,
          rationale: "Client's sleep issues appear connected to racing thoughts."
        },
        {
          recommendation: "Develop work-life boundary strategies",
          confidence: 0.90,
          rationale: "Work stressors clearly identified as primary emotional trigger."
        }
      ],
      riskAssessment: {
        risks: [
          {
            risk: "Continued sleep disruption",
            severity: "medium",
            mitigation: "Sleep hygiene practices and relaxation techniques"
          },
          {
            risk: "Relationship strain",
            severity: "low",
            mitigation: "Communication strategies and emotional regulation skills"
          }
        ],
        overallRiskLevel: "low"
      },
      implementationTimeline: {
        immediate: [
          "Begin sleep journal",
          "Identify one boundary to establish at work"
        ],
        shortTerm: [
          "Practice mindfulness technique daily for 2 weeks",
          "Increase frequency of identified positive activities"
        ],
        longTerm: [
          "Develop comprehensive stress management toolkit",
          "Regular emotional check-ins and adjustment of strategies"
        ]
      }
    };
  };
  
  const downloadReport = () => {
    if (!report && !selectedReport) return;
    
    // Get the report content to download
    let reportContent: AnalysisReport | null = null;
    let title = reportTopic;
    
    if (selectedReport) {
      reportContent = getParsedReport(selectedReport.reportContent);
      title = selectedReport.title || selectedReport.topic;
    } else {
      reportContent = report;
    }
    
    if (!reportContent) {
      toast.error('Report content not available');
      return;
    }
    
    // Convert report to formatted markdown
    let markdownContent = `# ${title}\n\n`;
    markdownContent += `## Executive Summary\n\n${reportContent.executiveSummary}\n\n`;
    
    markdownContent += `## Detailed Findings\n\n`;
    reportContent.detailedFindings.forEach(finding => {
      markdownContent += `- ${finding}\n`;
    });
    markdownContent += '\n';
    
    markdownContent += `## Data-Driven Insights\n\n`;
    reportContent.insights.forEach(insight => {
      markdownContent += `- ${insight}\n`;
    });
    markdownContent += '\n';
    
    markdownContent += `## Actionable Recommendations\n\n`;
    reportContent.recommendations.forEach(rec => {
      markdownContent += `### ${rec.recommendation} (Confidence: ${Math.round(rec.confidence * 100)}%)\n`;
      markdownContent += `${rec.rationale}\n\n`;
    });
    
    markdownContent += `## Risk Assessment\n\n`;
    markdownContent += `Overall Risk Level: ${reportContent.riskAssessment.overallRiskLevel.toUpperCase()}\n\n`;
    reportContent.riskAssessment.risks.forEach(risk => {
      markdownContent += `### ${risk.risk} (Severity: ${risk.severity.toUpperCase()})\n`;
      markdownContent += `Mitigation: ${risk.mitigation}\n\n`;
    });
    
    markdownContent += `## Implementation Timeline\n\n`;
    markdownContent += `### Immediate Actions\n\n`;
    reportContent.implementationTimeline.immediate.forEach(action => {
      markdownContent += `- ${action}\n`;
    });
    markdownContent += '\n';
    
    markdownContent += `### Short-Term Actions (1-3 months)\n\n`;
    reportContent.implementationTimeline.shortTerm.forEach(action => {
      markdownContent += `- ${action}\n`;
    });
    markdownContent += '\n';
    
    markdownContent += `### Long-Term Actions (3+ months)\n\n`;
    reportContent.implementationTimeline.longTerm.forEach(action => {
      markdownContent += `- ${action}\n`;
    });
    
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_Analysis.md`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    toast.success('Analysis report downloaded successfully');
  };
  
  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
    const parsedReport = getParsedReport(report.reportContent);
    if (parsedReport) {
      setReport(parsedReport);
      setCurrentView('view');
    } else {
      toast.error('Could not load report');
    }
  };
  
  const handleDeleteReport = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await deleteReport(id);
        toast.success('Report deleted successfully');
        
        if (selectedReport && selectedReport.id === id) {
          setSelectedReport(null);
          setReport(null);
          setCurrentView('history');
        }
      } catch (error) {
        toast.error('Failed to delete report');
      }
    }
  };
  
  const handleSelectAudience = (audienceId: string) => {
    setSelectedAudience(audienceId);
    
    // Set default topic based on audience
    switch (audienceId) {
      case 'doctor':
        setReportTopic('Clinical Health Summary');
        break;
      case 'therapist':
        setReportTopic('Mental Wellbeing Assessment');
        break;
      default:
        setReportTopic('My Health Status');
    }
    
    setCurrentView('form');
  };
  
  const handleNewReport = () => {
    // Reset the form fields
    setReportTopic('My Health Status');
    setAppointmentReason('');
    setRecentSymptoms('');
    setMedicationChanges('');
    setMoodRating(3);
    setSleepQuality(3);
    setStressLevel(3);
    setSelectedAudience(null);
    
    // Go to audience selection screen
    setCurrentView('audience-select');
  };
  
  const renderAudienceSelector = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Generate a Report</h1>
          <button
            onClick={() => setCurrentView('history')}
            className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-4 py-2"
          >
            <History size={16} className="mr-1.5" />
            Report History
          </button>
        </div>
        
        <p className="text-gray-600 mb-8">Select who this report is for:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {reportAudienceTypes.map(audience => {
            // Define dynamic color classes based on audience type
            const bgClass = audience.color === 'green' 
              ? 'bg-green-50 hover:bg-green-100' 
              : audience.color === 'purple'
                ? 'bg-purple-50 hover:bg-purple-100'
                : 'bg-blue-50 hover:bg-blue-100';
            
            const borderClass = audience.color === 'green'
              ? 'border-green-200'
              : audience.color === 'purple'
                ? 'border-purple-200'
                : 'border-blue-200';
                
            const iconClass = audience.color === 'green'
              ? 'text-green-700'
              : audience.color === 'purple'
                ? 'text-purple-700'
                : 'text-blue-700';
            
            return (
              <button
                key={audience.id}
                onClick={() => handleSelectAudience(audience.id)}
                className={`${bgClass} ${borderClass} border rounded-xl p-6 flex flex-col items-center text-center transition-all hover:shadow-md`}
              >
                <div className={`${iconClass} mb-3`}>
                  {audience.icon}
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{audience.name}</h3>
                <p className="text-gray-600 text-sm">{audience.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  
  const renderMeForm = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Personal Health Report</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('audience-select')}
              className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-4 py-2"
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Back
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-4 py-2"
            >
              <History size={16} className="mr-1.5" />
              Report History
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-md">
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Report Topic</label>
            <input
              type="text"
              value={reportTopic}
              onChange={(e) => setReportTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="E.g., My Blood Pressure, Sleep Quality, Treatment Progress"
            />
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-700 font-medium">Date Range</label>
              <div className="flex items-center">
                <button 
                  onClick={updateDateRange}
                  className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-md flex items-center"
                >
                  <Calendar size={14} className="mr-1" />
                  Apply Range
                </button>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Select Memos to Include ({selectedMemos.length} selected)
            </label>
            <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
              {memos.length > 0 ? (
                memos.map(memo => (
                  <div 
                    key={memo.id} 
                    className={`p-3 border-b border-gray-200 last:border-b-0 flex items-start cursor-pointer hover:bg-gray-50 ${
                      selectedMemos.includes(memo.id) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleMemoSelection(memo.id)}
                  >
                    <div className={`mr-3 mt-0.5 ${selectedMemos.includes(memo.id) ? 'text-blue-500' : 'text-gray-300'}`}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">
                        {new Date(memo.date).toLocaleDateString()}
                      </p>
                      <p className="text-gray-700 line-clamp-2">{memo.transcript}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-gray-500 text-center">No memos available</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentView('audience-select')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Back
            </button>
            
            <button
              onClick={handleGenerateReport}
              disabled={selectedMemos.length === 0 || isGenerating}
              className={`px-5 py-2 rounded-lg flex items-center ${
                selectedMemos.length === 0 || isGenerating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderDoctorForm = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Medical Report</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('audience-select')}
              className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-4 py-2"
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Back
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-4 py-2"
            >
              <History size={16} className="mr-1.5" />
              Report History
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-md">
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Reason for Appointment <span className="text-gray-400 text-sm">(Required)</span>
            </label>
            <textarea
              value={appointmentReason}
              onChange={(e) => setAppointmentReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="E.g., Annual checkup, follow-up on medication, discussing recent symptoms"
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              This helps your doctor understand the context of your visit
            </p>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Recent Symptoms
            </label>
            <textarea
              value={recentSymptoms}
              onChange={(e) => setRecentSymptoms(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Describe any symptoms you've experienced recently"
              rows={3}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Medication Changes
            </label>
            <textarea
              value={medicationChanges}
              onChange={(e) => setMedicationChanges(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="List any changes to your medications"
              rows={3}
            />
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-700 font-medium">Date Range</label>
              <div className="flex items-center">
                <button 
                  onClick={updateDateRange}
                  className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded-md flex items-center"
                >
                  <Calendar size={14} className="mr-1" />
                  Apply Range
                </button>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Select Health Memos ({selectedMemos.length} selected)
            </label>
            <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
              {memos.length > 0 ? (
                memos.map(memo => (
                  <div 
                    key={memo.id} 
                    className={`p-3 border-b border-gray-200 last:border-b-0 flex items-start cursor-pointer hover:bg-gray-50 ${
                      selectedMemos.includes(memo.id) ? 'bg-green-50' : ''
                    }`}
                    onClick={() => toggleMemoSelection(memo.id)}
                  >
                    <div className={`mr-3 mt-0.5 ${selectedMemos.includes(memo.id) ? 'text-green-500' : 'text-gray-300'}`}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">
                        {new Date(memo.date).toLocaleDateString()}
                      </p>
                      <p className="text-gray-700 line-clamp-2">{memo.transcript}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-gray-500 text-center">No memos available</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentView('audience-select')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Back
            </button>
            
            <button
              onClick={handleGenerateReport}
              disabled={selectedMemos.length === 0 || isGenerating || !appointmentReason.trim()}
              className={`px-5 py-2 rounded-lg flex items-center ${
                selectedMemos.length === 0 || isGenerating || !appointmentReason.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  Generate Clinical Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderTherapistForm = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Therapy Assessment</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('audience-select')}
              className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-4 py-2"
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Back
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-4 py-2"
            >
              <History size={16} className="mr-1.5" />
              Report History
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-md">
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Report Topic</label>
            <input
              type="text"
              value={reportTopic}
              onChange={(e) => setReportTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="E.g., Anxiety Management, Sleep Issues, Relationship Stress"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              How would you rate your overall mood?
            </label>
            <div className="flex items-center justify-between my-2">
              <span className="text-sm text-gray-500">Very low</span>
              <span className="text-sm text-gray-500">Neutral</span>
              <span className="text-sm text-gray-500">Very high</span>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMoodRating(value)}
                  className={`w-1/5 py-2 rounded-md ${
                    moodRating === value
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              How would you rate your sleep quality?
            </label>
            <div className="flex items-center justify-between my-2">
              <span className="text-sm text-gray-500">Very poor</span>
              <span className="text-sm text-gray-500">Average</span>
              <span className="text-sm text-gray-500">Excellent</span>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSleepQuality(value)}
                  className={`w-1/5 py-2 rounded-md ${
                    sleepQuality === value
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              How would you rate your stress level?
            </label>
            <div className="flex items-center justify-between my-2">
              <span className="text-sm text-gray-500">Very low</span>
              <span className="text-sm text-gray-500">Moderate</span>
              <span className="text-sm text-gray-500">Very high</span>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStressLevel(value)}
                  className={`w-1/5 py-2 rounded-md ${
                    stressLevel === value
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-700 font-medium">Assessment Period</label>
              <div className="flex items-center">
                <button 
                  onClick={updateDateRange}
                  className="text-sm bg-purple-50 text-purple-600 px-3 py-1 rounded-md flex items-center"
                >
                  <Calendar size={14} className="mr-1" />
                  Apply Range
                </button>
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Select Health Memos ({selectedMemos.length} selected)
            </label>
            <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
              {memos.length > 0 ? (
                memos.map(memo => (
                  <div 
                    key={memo.id} 
                    className={`p-3 border-b border-gray-200 last:border-b-0 flex items-start cursor-pointer hover:bg-gray-50 ${
                      selectedMemos.includes(memo.id) ? 'bg-purple-50' : ''
                    }`}
                    onClick={() => toggleMemoSelection(memo.id)}
                  >
                    <div className={`mr-3 mt-0.5 ${selectedMemos.includes(memo.id) ? 'text-purple-500' : 'text-gray-300'}`}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">
                        {new Date(memo.date).toLocaleDateString()}
                      </p>
                      <p className="text-gray-700 line-clamp-2">{memo.transcript}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-gray-500 text-center">No memos available</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentView('audience-select')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Back
            </button>
            
            <button
              onClick={handleGenerateReport}
              disabled={selectedMemos.length === 0 || isGenerating}
              className={`px-5 py-2 rounded-lg flex items-center ${
                selectedMemos.length === 0 || isGenerating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} className="mr-2" />
                  Generate Therapy Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderReportForm = () => {
    switch (selectedAudience) {
      case 'doctor':
        return renderDoctorForm();
      case 'therapist':
        return renderTherapistForm();
      case 'me':
      default:
        return renderMeForm();
    }
  };
  
  const renderContent = () => {
    switch (currentView) {
      case 'history':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
              <button
                onClick={handleNewReport}
                className="flex items-center text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 shadow-sm"
              >
                <Plus size={16} className="mr-1.5" />
                New Report
              </button>
            </div>
            
            <div className="mb-6">
              <ReportHistoryList
                reports={reports}
                isLoading={false}
                onSelect={handleSelectReport}
                onDelete={handleDeleteReport}
                emptyMessage="You haven't generated any reports yet. Generate a new report to get started."
              />
            </div>
            
            {reports.length === 0 && (
              <div className="text-center mt-8">
                <button
                  onClick={handleNewReport}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg inline-flex items-center"
                >
                  <Sparkles size={18} className="mr-2" />
                  Generate Your First Report
                </button>
              </div>
            )}
          </div>
        );
      
      case 'audience-select':
        return renderAudienceSelector();
        
      case 'form':
        return renderReportForm();
        
      case 'view':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Report Details</h1>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentView('history')}
                  className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-4 py-2"
                >
                  <History size={16} className="mr-1.5" />
                  Report History
                </button>
                <button
                  onClick={handleNewReport}
                  className="flex items-center text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 shadow-sm"
                >
                  <Plus size={16} className="mr-1.5" />
                  New Report
                </button>
              </div>
            </div>
            
            {selectedReport && (
              <div className="mb-3 flex items-center text-sm text-gray-500">
                <Clock size={14} className="mr-1" />
                <span>Generated on {new Date(selectedReport.date).toLocaleString()}</span>
                <span className="mx-2">•</span>
                <FileText size={14} className="mr-1" />
                <span>{selectedReport.topic}</span>
              </div>
            )}
            
            <AIAnalysisReport 
              report={report!} 
              isLoading={isGenerating} 
              error={generationError}
              onDownload={downloadReport}
            />
          </div>
        );
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-1.5" />
        Back
      </button>
      
      {renderContent()}
    </div>
  );
}

export default AIReportGenerator;