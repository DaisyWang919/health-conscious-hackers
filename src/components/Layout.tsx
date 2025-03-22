import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Mic, ListChecks, FileText, Stethoscope, Home, Sparkles } from 'lucide-react';

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
            
            <nav className="hidden md:flex space-x-6">
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
                Home
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
                Record
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
                Memos
              </NavLink>
              
              <NavLink 
                to="/patient-reports" 
                className={({ isActive }) => 
                  `flex items-center px-1 py-2 text-sm font-medium ${
                    isActive 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-blue-500 hover:border-b-2 hover:border-blue-300'
                  }`
                }
              >
                <FileText size={18} className="mr-1" /> 
                Patient Reports
              </NavLink>
              
              <NavLink 
                to="/doctor-reports" 
                className={({ isActive }) => 
                  `flex items-center px-1 py-2 text-sm font-medium ${
                    isActive 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-blue-500 hover:border-b-2 hover:border-blue-300'
                  }`
                }
              >
                <Stethoscope size={18} className="mr-1" /> 
                Doctor Reports
              </NavLink>
              
              <NavLink 
                to="/ai-reports" 
                className={({ isActive }) => 
                  `flex items-center px-1 py-2 text-sm font-medium ${
                    isActive 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-600 hover:text-blue-500 hover:border-b-2 hover:border-blue-300'
                  }`
                }
              >
                <Sparkles size={18} className="mr-1" /> 
                AI Reports
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
          <div className="md:flex md:items-center md:justify-between">
            <div className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} HealthVoice. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="grid grid-cols-6 h-16">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => 
              `flex flex-col items-center justify-center ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
              }`
            }
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </NavLink>
          
          <NavLink 
            to="/record" 
            className={({ isActive }) => 
              `flex flex-col items-center justify-center ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
              }`
            }
          >
            <Mic size={20} />
            <span className="text-xs mt-1">Record</span>
          </NavLink>
          
          <NavLink 
            to="/memos" 
            className={({ isActive }) => 
              `flex flex-col items-center justify-center ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
              }`
            }
          >
            <ListChecks size={20} />
            <span className="text-xs mt-1">Memos</span>
          </NavLink>
          
          <NavLink 
            to="/patient-reports" 
            className={({ isActive }) => 
              `flex flex-col items-center justify-center ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
              }`
            }
          >
            <FileText size={20} />
            <span className="text-xs mt-1">For Me</span>
          </NavLink>
          
          <NavLink 
            to="/doctor-reports" 
            className={({ isActive }) => 
              `flex flex-col items-center justify-center ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
              }`
            }
          >
            <Stethoscope size={20} />
            <span className="text-xs mt-1">Doctor</span>
          </NavLink>
          
          <NavLink 
            to="/ai-reports" 
            className={({ isActive }) => 
              `flex flex-col items-center justify-center ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
              }`
            }
          >
            <Sparkles size={20} />
            <span className="text-xs mt-1">AI</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default Layout;