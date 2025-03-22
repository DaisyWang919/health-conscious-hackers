import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, FileText, ListChecks, Stethoscope, Sparkles } from 'lucide-react';
import { useMemos } from '../hooks/useMemos';

function Dashboard() {
  const { memos } = useMemos();
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Health Voice Recorder</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/record" 
          className="bg-blue-500 hover:bg-blue-600 transition-colors text-white rounded-lg p-6 flex flex-col items-center shadow-lg">
          <Mic size={48} className="mb-3" />
          <h2 className="text-xl font-semibold">Record New Memo</h2>
          <p className="text-blue-100 mt-2 text-center">Record your daily health updates</p>
        </Link>
        
        <Link to="/memos" 
          className="bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg p-6 flex flex-col items-center shadow-md">
          <ListChecks size={48} className="mb-3 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-800">View All Memos</h2>
          <p className="text-gray-500 mt-2 text-center">
            {memos.length > 0 
              ? `You have ${memos.length} saved memo${memos.length !== 1 ? 's' : ''}`
              : "No memos yet - start recording!"}
          </p>
        </Link>
        
        <Link to="/ai-reports" 
          className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-colors rounded-lg p-6 flex flex-col items-center shadow-lg">
          <Sparkles size={48} className="mb-3" />
          <h2 className="text-xl font-semibold">AI Analysis</h2>
          <p className="text-indigo-100 mt-2 text-center">Generate GPT-4o powered reports</p>
        </Link>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <Link to="/patient-reports" 
          className="bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg p-6 flex flex-col items-center shadow-md">
          <FileText size={48} className="mb-3 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-800">Patient Reports</h2>
          <p className="text-gray-500 mt-2 text-center">Create customized reports for yourself</p>
        </Link>
        
        <Link to="/doctor-reports" 
          className="bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg p-6 flex flex-col items-center shadow-md">
          <Stethoscope size={48} className="mb-3 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-800">Doctor Reports</h2>
          <p className="text-gray-500 mt-2 text-center">Create reports for your doctor appointments</p>
        </Link>
      </div>
      
      <div className="mt-10 bg-white rounded-lg border border-gray-200 p-6 shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
        {memos.length > 0 ? (
          <div className="space-y-3">
            {memos.slice(0, 3).map(memo => (
              <div key={memo.id} className="p-3 border-l-4 border-blue-500 bg-gray-50 rounded">
                <p className="text-sm text-gray-500">{new Date(memo.date).toLocaleDateString()}</p>
                <p className="text-gray-700 font-medium truncate">{memo.transcript}</p>
              </div>
            ))}
            {memos.length > 3 && (
              <Link to="/memos" className="text-blue-500 hover:text-blue-700 font-medium text-sm block mt-2">
                View all memos →
              </Link>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No recent activity. Record your first voice memo!</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;