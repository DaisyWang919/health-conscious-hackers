import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  color?: 'blue' | 'green' | 'purple' | 'gray';
  icon?: LucideIcon;
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const colorClasses = {
  blue: {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
    outline: 'border border-blue-200 hover:bg-blue-50 text-blue-600'
  },
  green: {
    primary: 'bg-green-500 hover:bg-green-600 text-white',
    secondary: 'bg-green-50 hover:bg-green-100 text-green-600',
    outline: 'border border-green-200 hover:bg-green-50 text-green-600'
  },
  purple: {
    primary: 'bg-purple-500 hover:bg-purple-600 text-white',
    secondary: 'bg-purple-50 hover:bg-purple-100 text-purple-600',
    outline: 'border border-purple-200 hover:bg-purple-50 text-purple-600'
  },
  gray: {
    primary: 'bg-gray-500 hover:bg-gray-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-600',
    outline: 'border border-gray-200 hover:bg-gray-50 text-gray-600'
  }
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  color = 'blue',
  icon: Icon,
  isLoading,
  loadingText,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg flex items-center justify-center transition-colors';
  const disabledClasses = 'bg-gray-300 text-gray-500 cursor-not-allowed';
  const colorClass = disabled ? disabledClasses : colorClasses[color][variant];
  
  return (
    <button
      className={`${baseClasses} ${colorClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {loadingText || 'Loading...'}
        </>
      ) : (
        <>
          {Icon && <Icon size={18} className={children ? 'mr-2' : ''} />}
          {children}
        </>
      )}
    </button>
  );
};