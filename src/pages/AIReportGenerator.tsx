import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Sparkles, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { useMemos } from '../hooks/useMemos';
import toast from 'react-hot-toast';
import { generateAnalysisReport } from '../utils/openai';
import type { AnalysisReport } from '../utils/openai';
import AIAnalysisReport from '../components/AIAnalysisReport';

const analysisTypes = [
  { id: 'health', label: 'Overall Health', description: 'Comprehensive analysis of general health status, trends, and recommendations' },
  { id: 'symptoms', label: 'Symptom Analysis', description: 'Detailed analysis of symptoms, their patterns, and potential causes' },
  { id: 'treatment', label: 'Treatment Effectiveness', description: 'Evaluation of treatments, medications, and their effects over time' },
  { id: 'general', label: 'General Analysis', description: 'Balanced overview of all health-related aspects in your memos' }
];

function AIReportGenerator() {
  const { memos } = useMemos();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedMemos, setSelectedMemos] = useState<string[]>(
    location.state?.selectedMemos || []
  );
  const [reportTopic, setReportTopic] = useState('My Health Status');
  const [analysisType, setAnalysisType] = useState<'health' | 'symptoms' | 'treatment' | 'general'>('health');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0] // today
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  
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
      const transcripts = filteredMemos.map(memo => memo.transcript);
      
      // Generate report
      const generatedReport = await generateAnalysisReport(
        transcripts,
        reportTopic,
        analysisType
      );
      
      setReport(generatedReport);
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
  
  const downloadReport = () => {
    if (!report) return;
    
    // Convert report to formatted markdown
    let markdownContent = `# ${reportTopic}\n\n`;
    markdownContent += `## Executive Summary\n\n${report.executiveSummary}\n\n`;
    
    markdownContent += `## Detailed Findings\n\n`;
    report.detailedFindings.forEach(finding => {
      markdownContent += `- ${finding}\n`;
    });
    markdownContent += '\n';
    
    markdownContent += `## Data-Driven Insights\n\n`;
    report.insights.forEach(insight => {
      markdownContent += `- ${insight}\n`;
    });
    markdownContent += '\n';
    
    markdownContent += `## Actionable Recommendations\n\n`;
    report.recommendations.forEach(rec => {
      markdownContent += `### ${rec.recommendation} (Confidence: ${Math.round(rec.confidence * 100)}%)\n`;
      markdownContent += `${rec.rationale}\n\n`;
    });
    
    markdownContent += `## Risk Assessment\n\n`;
    markdownContent += `Overall Risk Level: ${report.riskAssessment.overallRiskLevel.toUpperCase()}\n\n`;
    report.riskAssessment.risks.forEach(risk => {
      markdownContent += `### ${risk.risk} (Severity: ${risk.severity.toUpperCase()})\n`;
      markdownContent += `Mitigation: ${risk.mitigation}\n\n`;
    });
    
    markdownContent += `## Implementation Timeline\n\n`;
    markdownContent += `### Immediate Actions\n\n`;
    report.implementationTimeline.immediate.forEach(action => {
      markdownContent += `- ${action}\n`;
    });
    markdownContent += '\n';
    
    markdownContent += `### Short-Term Actions (1-3 months)\n\n`;
    report.implementationTimeline.shortTerm.forEach(action => {
      markdownContent += `- ${action}\n`;
    });
    markdownContent += '\n';
    
    markdownContent += `### Long-Term Actions (3+ months)\n\n`;
    report.implementationTimeline.longTerm.forEach(action => {
      markdownContent += `- ${action}\n`;
    });
    
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportTopic.replace(/\s+/g, '_')}_Analysis.md`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    toast.success('Analysis report downloaded successfully');
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-1" />
        Back
      </button>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-2">AI Analysis Report</h1>
      <p className="text-gray-600 mb-6">
        Generate a comprehensive health analysis using GPT-4o
      </p>
      
      {!report ? (
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
            <label className="block text-gray-700 font-medium mb-2">Analysis Type</label>
            <div className="grid md:grid-cols-2 gap-3">
              {analysisTypes.map(type => (
                <div 
                  key={type.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    analysisType === type.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAnalysisType(type.id as any)}
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
              onClick={() => navigate('/memos')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Cancel
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
                  Generate AI Report
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setReport(null)}
            className="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
          >
            Back to Report Settings
          </button>
          
          <AIAnalysisReport 
            report={report} 
            isLoading={isGenerating} 
            error={generationError}
            onDownload={downloadReport}
          />
        </div>
      )}
    </div>
  );
}

export default AIReportGenerator;