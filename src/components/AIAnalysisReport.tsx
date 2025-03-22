import React, { useState } from 'react';
import { Loader2, Download, AlertCircle, CheckCircle } from 'lucide-react';
import type { AnalysisReport } from '../utils/openai';

interface AIAnalysisReportProps {
  report: AnalysisReport;
  isLoading: boolean;
  error: string | null;
  onDownload?: () => void;
}

const AIAnalysisReport: React.FC<AIAnalysisReportProps> = ({ 
  report, 
  isLoading, 
  error,
  onDownload
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed' | 'recommendations' | 'risks' | 'timeline'>('summary');
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-md flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-gray-700">Generating AI Analysis Report</h3>
        <p className="text-gray-500 mt-2 text-center max-w-md">
          Our AI is analyzing your health data and generating comprehensive insights. 
          This might take a minute...
        </p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6 shadow-md">
        <div className="flex items-start">
          <AlertCircle size={24} className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-gray-800">Error Generating Report</h3>
            <p className="text-red-600 mt-2">{error}</p>
            <p className="text-gray-600 mt-3">
              Please check your OpenAI API key or try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-700';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };
  
  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-red-100 text-red-700';
    }
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">AI Health Analysis Report</h2>
        {onDownload && (
          <button 
            onClick={onDownload}
            className="flex items-center text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded"
          >
            <Download size={16} className="mr-1.5" />
            Download
          </button>
        )}
      </div>
      
      {/* Report Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-6 overflow-x-auto pb-1">
          <button
            className={`py-2 text-sm font-medium border-b-2 ${
              activeTab === 'summary' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('summary')}
          >
            Executive Summary
          </button>
          <button
            className={`py-2 text-sm font-medium border-b-2 ${
              activeTab === 'detailed' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('detailed')}
          >
            Findings & Insights
          </button>
          <button
            className={`py-2 text-sm font-medium border-b-2 ${
              activeTab === 'recommendations' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('recommendations')}
          >
            Recommendations
          </button>
          <button
            className={`py-2 text-sm font-medium border-b-2 ${
              activeTab === 'risks' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('risks')}
          >
            Risk Assessment
          </button>
          <button
            className={`py-2 text-sm font-medium border-b-2 ${
              activeTab === 'timeline' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="prose max-w-none">
        {activeTab === 'summary' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Executive Summary</h3>
            <p className="text-gray-700 mb-6">{report.executiveSummary}</p>
            
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h4 className="font-medium text-gray-700 mb-3">Key Insights</h4>
              <ul className="space-y-2">
                {report.insights.slice(0, 3).map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'detailed' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Detailed Findings</h3>
            <ul className="space-y-2 mb-6">
              {report.detailedFindings.map((finding, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mr-3 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{finding}</span>
                </li>
              ))}
            </ul>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Data-Driven Insights</h3>
            <ul className="space-y-2">
              {report.insights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {activeTab === 'recommendations' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Actionable Recommendations</h3>
            <div className="space-y-4">
              {report.recommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800">{rec.recommendation}</h4>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getConfidenceColor(rec.confidence)}`}>
                      Confidence: {Math.round(rec.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{rec.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'risks' && (
          <div>
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Risk Assessment</h3>
              <span className={`ml-3 text-xs font-medium px-2 py-1 rounded-full ${
                getSeverityColor(report.riskAssessment.overallRiskLevel)
              }`}>
                Overall Risk: {report.riskAssessment.overallRiskLevel.charAt(0).toUpperCase() + report.riskAssessment.overallRiskLevel.slice(1)}
              </span>
            </div>
            
            <div className="space-y-4">
              {report.riskAssessment.risks.map((risk, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800">{risk.risk}</h4>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getSeverityColor(risk.severity)}`}>
                      {risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    <span className="font-medium">Mitigation: </span>
                    {risk.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'timeline' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Implementation Timeline</h3>
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                Immediate Actions
              </h4>
              <ul className="space-y-1 pl-5">
                {report.implementationTimeline.immediate.map((action, index) => (
                  <li key={index} className="text-gray-700">{action}</li>
                ))}
              </ul>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                Short-Term Actions (1-3 months)
              </h4>
              <ul className="space-y-1 pl-5">
                {report.implementationTimeline.shortTerm.map((action, index) => (
                  <li key={index} className="text-gray-700">{action}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Long-Term Actions (3+ months)
              </h4>
              <ul className="space-y-1 pl-5">
                {report.implementationTimeline.longTerm.map((action, index) => (
                  <li key={index} className="text-gray-700">{action}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisReport;