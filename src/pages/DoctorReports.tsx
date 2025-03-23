import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileDown, Calendar, CheckCircle2 } from 'lucide-react';
import { useMemos } from '../hooks/useMemos';
import toast from 'react-hot-toast';
import { getLocalDateString } from '../utils/dateUtils';

function DoctorReports() {
  const { memos } = useMemos();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedMemos, setSelectedMemos] = useState<string[]>(
    location.state?.selectedMemos || []
  );
  const [appointmentReason, setAppointmentReason] = useState('');
  const [dateRange, setDateRange] = useState({
    from: getLocalDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()), // 30 days ago
    to: getLocalDateString(new Date().toISOString()) // today
  });
  const [showPreview, setShowPreview] = useState(false);
  
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
  
  const generateStructuredReport = () => {
    // This is a placeholder for a more sophisticated analysis
    // In a real app, this would use NLP to extract symptoms and patterns related to the appointment reason
    
    if (filteredMemos.length === 0) {
      return "No memo data available for the selected period.";
    }
    
    let allText = filteredMemos.map(memo => memo.transcript).join(' ');
    
    // Extract common medical terms
    const symptoms = extractSimulatedSymptoms(allText);
    const frequency = analyzeSimulatedFrequency(allText);
    const severity = analyzeSimulatedSeverity(allText);
    const timeline = createSimulatedTimeline(filteredMemos);
    
    let report = `# PATIENT HEALTH SUMMARY\n\n`;
    
    if (appointmentReason) {
      report += `## REASON FOR APPOINTMENT\n${appointmentReason}\n\n`;
    }
    
    report += `## SYMPTOM SUMMARY\n${symptoms.join(', ')}\n\n`;
    
    report += `## FREQUENCY\n${frequency}\n\n`;
    
    report += `## SEVERITY\n${severity}\n\n`;
    
    report += `## TIMELINE\n${timeline}\n\n`;
    
    report += `## PATIENT NOTES (${filteredMemos.length} entries)\n`;
    filteredMemos.forEach(memo => {
      report += `\n${new Date(memo.date).toLocaleDateString()}: "${memo.transcript}"\n`;
    });
    
    return report;
  };
  
  // Placeholder functions that would be replaced with real NLP in a full implementation
  const extractSimulatedSymptoms = (text: string) => {
    // This would be replaced with actual NLP to extract symptoms
    const commonSymptoms = [
      'headache', 'dizziness', 'fatigue', 'nausea', 'pain', 'pressure', 
      'cough', 'fever', 'chills', 'weakness'
    ];
    
    return commonSymptoms.filter(symptom => 
      text.toLowerCase().includes(symptom)
    );
  };
  
  const analyzeSimulatedFrequency = (text: string) => {
    // This would be replaced with actual NLP to analyze frequency
    if (text.toLowerCase().includes('daily') || text.toLowerCase().includes('every day')) {
      return "Symptoms occur daily";
    } else if (text.toLowerCase().includes('occasionally') || text.toLowerCase().includes('sometimes')) {
      return "Symptoms occur occasionally";
    } else if (text.toLowerCase().includes('rarely')) {
      return "Symptoms occur rarely";
    } else {
      return "Frequency unclear from patient notes";
    }
  };
  
  const analyzeSimulatedSeverity = (text: string) => {
    // This would be replaced with actual NLP to analyze severity
    if (text.toLowerCase().includes('severe') || text.toLowerCase().includes('intense')) {
      return "Patient describes symptoms as severe";
    } else if (text.toLowerCase().includes('moderate')) {
      return "Patient describes symptoms as moderate";
    } else if (text.toLowerCase().includes('mild') || text.toLowerCase().includes('slight')) {
      return "Patient describes symptoms as mild";
    } else {
      return "Severity unclear from patient notes";
    }
  };
  
  const createSimulatedTimeline = (memos: any[]) => {
    // This would be replaced with actual NLP to create a timeline
    if (memos.length <= 1) {
      return "Insufficient data for timeline analysis";
    }
    
    const firstDate = new Date(memos[0].date);
    const lastDate = new Date(memos[memos.length - 1].date);
    const durationDays = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return `Patient has been tracking symptoms for ${durationDays} days, from ${firstDate.toLocaleDateString()} to ${lastDate.toLocaleDateString()}`;
  };
  
  const downloadReport = () => {
    const reportText = generateStructuredReport();
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Doctor_Report_${getLocalDateString(new Date().toISOString())}.md`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    toast.success('Doctor report downloaded successfully');
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-1" />
        Back
      </button>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Doctor Report</h1>
      <p className="text-gray-600 mb-6">
        Create a structured clinical report for your doctor
      </p>
      
      {!showPreview ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-md">
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Reason for Appointment <span className="text-gray-400 text-sm">(Important)</span>
            </label>
            <textarea
              value={appointmentReason}
              onChange={(e) => setAppointmentReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Example: Annual checkup, following up on persistent headaches, etc."
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              This helps focus the report on relevant symptoms
            </p>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-700 font-medium">Data Range</label>
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
            <div className="space-x-3">
              <button
                onClick={() => setShowPreview(true)}
                disabled={selectedMemos.length === 0}
                className={`px-4 py-2 rounded-lg ${
                  selectedMemos.length === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
              >
                Preview Report
              </button>
              <button
                onClick={downloadReport}
                disabled={selectedMemos.length === 0}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  selectedMemos.length === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <FileDown size={18} className="mr-1" />
                Download Report
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-md">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Report Preview</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="text-blue-500 hover:text-blue-700"
            >
              Back to Edit
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 font-mono text-sm mb-6 whitespace-pre-line">
            {generateStructuredReport()}
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={downloadReport}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center hover:bg-blue-600"
            >
              <FileDown size={18} className="mr-1" />
              Download Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorReports;