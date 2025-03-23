import React from 'react';
import { theme } from '../../styles/theme';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  color?: keyof typeof theme.colors;
}

export const TextArea: React.FC<TextAreaProps> = ({
  color = 'blue',
  className = '',
  ...props
}) => {
  const colors = theme.colors[color];
  
  return (
    <textarea
      className={`${theme.components.input} ${colors.focus} ${className}`}
      rows={3}
      {...props}
    />
  );
};