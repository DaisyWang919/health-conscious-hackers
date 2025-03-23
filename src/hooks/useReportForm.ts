import { useState, useEffect } from 'react';
import { MemoWithAudio } from '../utils/db';
import { getLocalDateString } from '../utils/dateUtils';
import toast from 'react-hot-toast';

interface UseReportFormProps {
  memos: MemoWithAudio[];
  initialSelectedMemos?: string[];
}

export const useReportForm = ({ memos, initialSelectedMemos = [] }: UseReportFormProps) => {
  const [selectedMemos, setSelectedMemos] = useState<string[]>(initialSelectedMemos);
  const [dateRange, setDateRange] = useState({
    from: getLocalDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    to: getLocalDateString(new Date().toISOString())
  });

  useEffect(() => {
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

  const toggleMemoSelection = (id: string) => {
    setSelectedMemos(prev => 
      prev.includes(id) 
        ? prev.filter(memoId => memoId !== id)
        : [...prev, id]
    );
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

  return {
    selectedMemos,
    setSelectedMemos,
    dateRange,
    setDateRange,
    toggleMemoSelection,
    updateDateRange
  };
};