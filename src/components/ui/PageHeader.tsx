import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './Button';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  onBack,
  actions
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        {onBack && (
          <Button
            variant="secondary"
            color="gray"
            icon={ArrowLeft}
            onClick={onBack}
            className="mr-4"
          >
            Back
          </Button>
        )}
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      </div>
      
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
};