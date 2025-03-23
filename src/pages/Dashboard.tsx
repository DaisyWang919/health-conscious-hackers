import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Sparkles, Info } from 'lucide-react';
import { useMemos } from '../hooks/useMemos';
import { PageContainer } from '../components/layout/PageContainer';
import StreakDisplay from '../components/StreakDisplay';
import { Card } from '../components/ui/Card';
import { getTodayDateString, isSameLocalDay } from '../utils/dateUtils';

// Memoize recent memos component to prevent unnecessary re-renders
const RecentMemos = memo(({ memos }: { memos: any[] }) => (
  <Card className="mb-6 overflow-hidden">
    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
      <h2 className="font-medium text-gray-700">Recent Memos</h2>
      {memos.length > 3 && (
        <Link
          to="/memos"
          className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 text-gray-600"
        >
          View All
        </Link>
      )}
    </div>
    <div className="divide-y divide-gray-100">
      {memos.slice(0, 3).map(memo => (
        <div key={memo.id} className="p-4 hover:bg-gray-50">
          <p className="text-sm text-gray-500 mb-1">
            {new Date(memo.date).toLocaleDateString()} · {new Date(memo.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
          <p className="text-gray-700 line-clamp-2">{memo.transcript}</p>
        </div>
      ))}
    </div>
  </Card>
));

function Dashboard() {
  const { memos, streakData } = useMemos();
  
  // Check if user has recorded today - memoize this calculation
  const hasRecordedToday = React.useMemo(() => 
    memos.some(memo => isSameLocalDay(new Date(memo.date), new Date())),
    [memos]
  );
  
  // Get sorted memos - memoize the sorting to avoid repeated calculations
  const sortedMemos = React.useMemo(() => 
    [...memos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [memos]
  );
  
  return (
    <PageContainer maxWidth="md">
      {/* Streak Display */}
      <div className="mb-6">
        <StreakDisplay streakData={streakData} />
      </div>
      
      {/* Action Buttons - Side by Side */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Link 
          to="/record"
          className="flex items-center justify-center px-6 py-8 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md relative"
        >
          <div className="flex flex-col items-center">
            <div className="relative">
              <Mic size={40} className="mb-3" />
              {!hasRecordedToday && (
                <div className="absolute -right-0.5 top-0 w-2.5 h-2.5 bg-green-400 rounded-full border border-white animate-pulse"></div>
              )}
            </div>
            <div className="flex items-center">
              <span className="text-xl font-medium">
                {hasRecordedToday ? "Record Another" : "Record"}
              </span>
            </div>
          </div>
        </Link>
        
        <Link 
          to="/reports"
          state={{ initialView: 'audience-select' }}
          className="flex items-center justify-center px-6 py-8 rounded-xl bg-white border-2 border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors shadow-sm hover:shadow-md"
        >
          <div className="flex flex-col items-center">
            <Sparkles size={40} className="mb-3" />
            <div className="flex items-center">
              <span className="text-xl font-medium">Generate Insights</span>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Recent Memos Section */}
      {sortedMemos.length > 0 && <RecentMemos memos={sortedMemos} />}
      
      {/* App Info */}
      <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 text-sm text-blue-700 flex">
        <Info size={18} className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
        <div>
          <p>
            Record daily voice memos to track your health journey. Analyze patterns and generate 
            insights with AI to better understand your health.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}

export default Dashboard;