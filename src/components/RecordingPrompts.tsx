import React, { useState } from 'react';
import { ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { promptCategories, getRandomPrompts } from '../utils/promptSuggestions';

interface RecordingPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const RecordingPrompts: React.FC<RecordingPromptsProps> = ({ onSelectPrompt }) => {
  const [displayMode, setDisplayMode] = useState<'random' | 'categories'>('categories');
  const [randomPrompts, setRandomPrompts] = useState<string[]>(getRandomPrompts(3));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Generate random prompts when refresh is clicked
  const refreshRandomPrompts = () => {
    setRandomPrompts(getRandomPrompts(3));
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between mb-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setDisplayMode('random')}
            className={`text-xs px-2 py-1 rounded-md ${
              displayMode === 'random' 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Quick Suggestions
          </button>
          <button
            onClick={() => setDisplayMode('categories')}
            className={`text-xs px-2 py-1 rounded-md ${
              displayMode === 'categories' 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Browse Categories
          </button>
        </div>
        
        {displayMode === 'random' && (
          <button
            onClick={refreshRandomPrompts}
            className="text-xs flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <RefreshCw size={12} className="mr-1" />
            Refresh
          </button>
        )}
      </div>
      
      {displayMode === 'random' ? (
        <div className="space-y-2">
          {randomPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onSelectPrompt(prompt)}
              className="w-full text-left p-2.5 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded border border-gray-200 text-sm transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : (
        <div>
          {selectedCategory ? (
            <div>
              <div className="flex items-center mb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  ← Back to categories
                </button>
                <h4 className="ml-2 text-sm font-medium text-gray-700">
                  {promptCategories.find(cat => cat.name === selectedCategory)?.icon} {selectedCategory}
                </h4>
              </div>
              
              <div className="space-y-2">
                {promptCategories
                  .find(cat => cat.name === selectedCategory)
                  ?.prompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => onSelectPrompt(prompt)}
                      className="w-full text-left p-2.5 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded border border-gray-200 text-sm transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {promptCategories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCategory(category.name)}
                  className="p-2.5 bg-white hover:bg-blue-50 rounded border border-gray-200 flex flex-col items-center text-center transition-colors"
                >
                  <span className="text-xl mb-1">{category.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{category.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordingPrompts;