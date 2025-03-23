import React from 'react';
import { theme } from '../../styles/theme';

interface FormFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  helperText,
  children
}) => {
  return (
    <div className="mb-6">
      <label className={theme.components.label}>
        {label}
        {required && <span className="text-gray-400 text-sm ml-1">(Required)</span>}
      </label>
      {children}
      {helperText && (
        <p className={theme.components.helperText}>{helperText}</p>
      )}
    </div>
  );
};