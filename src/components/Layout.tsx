import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Mic, ListChecks, FileText, Home, Sparkles } from 'lucide-react';

function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center text-blue-600 font-semibold text-lg">
              <Mic className="mr-2" />
              <span>HealthVoice</span>
            </NavLink>
            
            <nav className="flex space-x-4 md:space-x-6">
              <NavLink 
                to="/" 
                end
                className={({ isActive }) => 
                  `flex items-center px-1 py-2 text-sm font-medium ${
                    isActive 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-blue-500 hover:border-b-2 hover:border-blue-300'
                  }`
                }
              >
                <Home size={18} className="mr-1" /> 
                <span className="hidden md:inline">Home</span>
              </NavLink>
              
              <NavLink 
                to="/record" 
                className={({ isActive }) => 
                  `flex items-center px-1 py-2 text-sm font-medium ${
                    isActive 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-blue-500 hover:border-b-2 hover:border-blue-300'
                  }`
                }
              >
                <Mic size={18} className="mr-1" /> 
                <span className="hidden md:inline">Record</span>
              </NavLink>
              
              <NavLink 
                to="/memos" 
                className={({ isActive }) => 
                  `flex items-center px-1 py-2 text-sm font-medium ${
                    isActive 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-blue-500 hover:border-b-2 hover:border-blue-300'
                  }`
                }
              >
                <ListChecks size={18} className="mr-1" /> 
                <span className="hidden md:inline">Memos</span>
              </NavLink>
              
              <NavLink 
                to="/reports" 
                className={({ isActive }) => 
                  `flex items-center px-1 py-2 text-sm font-medium ${
                    isActive 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-blue-500 hover:border-b-2 hover:border-blue-300'
                  }`
                }
              >
                <Sparkles size={18} className="mr-1" /> 
                <span className="hidden md:inline">Reports</span>
              </NavLink>
            </nav>
          </div>
        </div>
      </div>
      
      <main className="flex-grow">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center text-sm text-gray-500">
            Made with ❤️ for better health tracking
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;