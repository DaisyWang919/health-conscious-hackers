import React from 'react';
import { Mic, FileText, ListChecks, Stethoscope, Sparkles } from 'lucide-react';
import { useMemos } from '../hooks/useMemos';
import StreakDisplay from '../components/StreakDisplay';
import QuickActionButton from '../components/QuickActionButton';
import { getTodayDateString, isSameLocalDay } from '../utils/dateUtils';

function Dashboard() {
  const { memos, streakData } = useMemos();
  
  // Get today's date in local format
  const today = getTodayDateString();
  
  // Check if user has recorded today
  const hasRecordedToday = memos.some(memo => 
    isSameLocalDay(new Date(memo.date), new Date())
  );
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Health Voice</h1>
      
      {/* Streak Display */}
      <div className="mb-6">
        <StreakDisplay streakData={streakData} />
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-3">
          {hasRecordedToday ? 'Quick Actions' : 'Record Today'}
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <QuickActionButton 
            to="/record" 
            icon={Mic} 
            label={hasRecordedToday ? "Record Another" : "Record Today"} 
            color="blue" 
            primaryAction={!hasRecordedToday}
          />
          
          <QuickActionButton 
            to="/memos" 
            icon={ListChecks} 
            label="View Memos" 
            color="green" 
            primaryAction={hasRecordedToday}
          />
        </div>
      </div>
      
      {/* Generate Reports */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-3">Generate Reports</h2>
        
        <div className="grid grid-cols-3 gap-3">
          <QuickActionButton to="/patient-reports" icon={FileText} label="For Me" color="indigo" />
          <QuickActionButton to="/doctor-reports" icon={Stethoscope} label="For Doctor" color="purple" />
          <QuickActionButton to="/ai-reports" icon={Sparkles} label="AI Analysis" color="orange" />
        </div>
      </div>
      
      {/* Recent Activity */}
      {memos.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-700 mb-3">Recent Memos</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            {memos.slice(0, 3).map(memo => (
              <div key={memo.id} className="p-3 border-b border-gray-100 last:border-b-0">
                <p className="text-sm text-gray-500 mb-1">{new Date(memo.date).toLocaleDateString()}</p>
                <p className="text-gray-700 line-clamp-2">{memo.transcript}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;