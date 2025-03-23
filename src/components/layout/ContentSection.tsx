import React, { memo } from 'react';
import { Card } from '../ui/Card';

interface ContentSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const ContentSection: React.FC<ContentSectionProps> = memo(({
  children,
  title,
  description,
  actions,
  className = ''
}) => {
  return (
    <section className={`mb-6 ${className}`}>
      {(title || description || actions) && (
        <div className="mb-4">
          <div className="flex items-center justify-between">
            {title && (
              <h2 className="text-lg font-medium text-gray-700">{title}</h2>
            )}
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
      <Card className="p-4 sm:p-6">
        {children}
      </Card>
    </section>
  );
});