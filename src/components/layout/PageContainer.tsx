import React from 'react';
import { AsyncBoundary } from '../AsyncBoundary';

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
  'full': 'max-w-full'
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = 'xl',
  className = ''
}) => {
  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 ${maxWidthClasses[maxWidth]} ${className}`}>
      <AsyncBoundary>
        {children}
      </AsyncBoundary>
    </div>
  );
};