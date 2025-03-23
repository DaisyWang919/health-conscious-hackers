import React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from './Button';
import { TextField } from './TextField';
import { theme } from '../../styles/theme';

interface DateRangePickerProps {
  dateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  onUpdateDateRange: () => void;
  colorScheme?: keyof typeof theme.colors;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange,
  onUpdateDateRange,
  colorScheme = 'blue'
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={theme.components.label}>Date Range</label>
        <Button
          variant="secondary"
          color={colorScheme}
          icon={Calendar}
          onClick={onUpdateDateRange}
          className="text-sm px-3 py-1"
        >
          Apply Range
        </Button>
      </div>
      <div className="flex space-x-4">
        <TextField
          type="date"
          value={dateRange.from}
          onChange={(e) => onDateRangeChange({...dateRange, from: e.target.value})}
          label="From"
          color={colorScheme}
          className="flex-1"
        />
        <TextField
          type="date"
          value={dateRange.to}
          onChange={(e) => onDateRangeChange({...dateRange, to: e.target.value})}
          label="To"
          color={colorScheme}
          className="flex-1"
        />
      </div>
    </div>
  );
};