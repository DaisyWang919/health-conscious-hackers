import React from 'react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  multiline?: boolean;
  color?: 'blue' | 'green' | 'purple';
  rows?: number;
}

const focusRingColors = {
  blue: 'focus:ring-blue-500',
  green: 'focus:ring-green-500',
  purple: 'focus:ring-purple-500'
};

export const TextField: React.FC<TextFieldProps> = ({
  label,
  helperText,
  error,
  multiline,
  color = 'blue',
  className = '',
  rows = 3,
  ...props
}) => {
  const inputClasses = `
    w-full px-3 py-2 
    border border-gray-300 rounded-md 
    focus:outline-none focus:ring-2 ${focusRingColors[color]} focus:border-transparent
    ${error ? 'border-red-300' : ''}
    ${className}
  `;
  
  const InputComponent = multiline ? 'textarea' : 'input';
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-gray-700 font-medium mb-2">
          {label}
        </label>
      )}
      
      <InputComponent
        className={inputClasses}
        rows={multiline ? rows : undefined}
        {...props}
      />
      
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};