import React, { useState, memo } from 'react';
import { Flame, Trophy, Calendar, CheckCircle } from 'lucide-react';
import { StreakData } from '../hooks/useMemos';
import { isSameLocalDay } from '../utils/dateUtils';

interface StreakDisplayProps {
  streakData: StreakData;
}

const StreakDisplay: React.FC<StreakDisplayProps> = memo(({ streakData }) => {
  const { currentStreak, longestStreak, lastRecordDate } = streakData;
  const [showDetails, setShowDetails] = useState(false);
  
  // Calculate days since last record
  const daysSinceLastRecord = lastRecordDate 
    ? Math.floor((Date.now() - new Date(lastRecordDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const isToday = lastRecordDate 
    ? isSameLocalDay(new Date(lastRecordDate), new Date())
    : false;
  
  // Get streak message
  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return "No active streak. Start today!";
    } else if (currentStreak === 1) {
      return "1 day streak - just getting started!";
    } else if (currentStreak < 5) {
      return `${currentStreak} day streak - building momentum!`;
    } else if (currentStreak < 10) {
      return `${currentStreak} day streak - impressive consistency!`;
    } else {
      return `${currentStreak} day streak - amazing dedication!`;
    }
  };
  
  return (
    <div 
      className={`w-full bg-white rounded-lg border ${
        isToday ? 'border-green-200' : currentStreak > 0 ? 'border-orange-200' : 'border-gray-200'
      } shadow-sm transition-all hover:shadow-md cursor-pointer relative overflow-hidden`}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Streak progress indicator */}
      {currentStreak > 0 && (
        <div 
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-orange-400 to-yellow-300"
          style={{ width: `${Math.min(100, (currentStreak / Math.max(longestStreak, 10)) * 100)}%` }}
        ></div>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="text-sm text-gray-500 mb-1">Your Current Streak</div>
            <div className="flex items-center">
              <span className={`text-2xl font-bold ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                {currentStreak}
              </span>
              <Flame 
                size={22} 
                className={`ml-1.5 ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'} ${
                  currentStreak > 0 ? 'animate-pulse' : ''
                }`}
              />
              <span className="ml-2 text-gray-600">{getStreakMessage()}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 ml-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                <span className="font-bold text-blue-600 text-lg">{longestStreak}</span>
                <Trophy size={16} className="ml-1 text-blue-500" />
              </div>
              <span className="text-xs text-gray-500">Best</span>
            </div>
            
            {isToday && (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                <CheckCircle size={16} className="text-green-500" />
              </div>
            )}
          </div>
        </div>
        
        {/* Expandable details */}
        {showDetails && (
          <div className="mt-2 pt-2 border-t border-gray-100 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar size={14} className="mr-1.5 text-gray-400" />
              {isToday 
                ? "You've recorded today - your streak is active!" 
                : lastRecordDate 
                  ? `Last recorded ${daysSinceLastRecord === 1 ? 'yesterday' : daysSinceLastRecord + ' days ago'}`
                  : "No records yet - start your streak today!"}
            </div>
            
            <p className="mt-1 text-gray-500">
              {currentStreak >= longestStreak && currentStreak > 0
                ? "You're on your best streak ever! Keep going!"
                : currentStreak > 0
                ? `Keep going! You're ${longestStreak - currentStreak} days away from your best streak.`
                : "Record daily to build your streak and track your health consistently."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default StreakDisplay;