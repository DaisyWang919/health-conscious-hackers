import React from 'react';
import { Report } from '../utils/db';
import { CalendarIcon, ClockIcon, FileTextIcon, ListFilterIcon, TrashIcon } from 'lucide-react';

interface ReportHistoryListProps {
  reports: Report[];
  isLoading: boolean;
  onSelect: (report: Report) => void;
  onDelete: (id: string) => void;
  emptyMessage?: string;
}

const ReportHistoryList: React.FC<ReportHistoryListProps> = ({
  reports,
  isLoading,
  onSelect,
  onDelete,
  emptyMessage = "You haven't generated any reports yet"
}) => {
  // Get the category name from the analysis type
  const getCategoryLabel = (type: string): string => {
    switch (type) {
      case 'health': return 'Overall Health';
      case 'symptoms': return 'Symptom Analysis';
      case 'treatment': return 'Treatment Effectiveness';
      case 'general': return 'General Analysis';
      default: return 'Health Report';
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format time for display
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (isLoading) {
    return (
      <div className="py-10 text-center">
        <div className="inline-block w-6 h-6 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500">Loading reports...</p>
      </div>
    );
  }
  
  if (reports.length === 0) {
    return (
      <div className="py-10 text-center">
        <FileTextIcon className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2 text-gray-500">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {reports.map(report => (
        <div 
          key={report.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
          onClick={() => onSelect(report)}
        >
          <div className="flex justify-between">
            <div>
              <h3 className="font-medium text-gray-800 mb-1 truncate pr-4">
                {report.title || report.topic}
              </h3>
              
              <div className="flex items-center text-xs text-gray-500 space-x-3">
                <div className="flex items-center">
                  <ListFilterIcon size={12} className="mr-1" />
                  <span>{getCategoryLabel(report.analysisType)}</span>
                </div>
                
                <div className="flex items-center">
                  <CalendarIcon size={12} className="mr-1" />
                  <span>{formatDate(report.date)}</span>
                </div>
                
                <div className="flex items-center">
                  <ClockIcon size={12} className="mr-1" />
                  <span>{formatTime(report.date)}</span>
                </div>
              </div>
            </div>
            
            <button 
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(report.id);
              }}
              aria-label="Delete report"
            >
              <TrashIcon size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportHistoryList;