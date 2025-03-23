import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MemoWithAudio } from '../../utils/db';
import { theme } from '../../styles/theme';

interface MemoListProps {
  memos: MemoWithAudio[];
  selectedMemos: string[];
  onMemoToggle: (id: string) => void;
  colorScheme?: keyof typeof theme.colors;
}

export const MemoList: React.FC<MemoListProps> = ({
  memos,
  selectedMemos,
  onMemoToggle,
  colorScheme = 'blue'
}) => {
  const colors = theme.colors[colorScheme];

  return (
    <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
      {memos.length > 0 ? (
        memos.map(memo => (
          <div 
            key={memo.id} 
            className={`p-3 border-b border-gray-200 last:border-b-0 flex items-start cursor-pointer hover:bg-gray-50 ${
              selectedMemos.includes(memo.id) ? colors.selected : ''
            }`}
            onClick={() => onMemoToggle(memo.id)}
          >
            <div className={`mr-3 mt-0.5 ${selectedMemos.includes(memo.id) ? colors.icon : 'text-gray-300'}`}>
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
  );
};