import React from 'react';
import { Link } from 'react-router-dom';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface QuickActionButtonProps {
  to: string;
  icon: LucideIcon;
  label: string;
  color: string;
  primaryAction?: boolean;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ 
  to, 
  icon: Icon, 
  label, 
  color,
  primaryAction = false 
}) => {
  const colorMap: Record<string, string> = {
    blue: primaryAction 
      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md' 
      : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200',
    indigo: primaryAction 
      ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md' 
      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200',
    purple: primaryAction 
      ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-md' 
      : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200',
    green: primaryAction 
      ? 'bg-green-500 hover:bg-green-600 text-white shadow-md' 
      : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200',
    orange: primaryAction 
      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md' 
      : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200',
  };

  const baseClasses = 'flex items-center justify-center p-4 rounded-lg transition-colors';
  const colorClasses = colorMap[color] || colorMap.blue;
  
  return (
    <Link 
      to={to}
      className={`${baseClasses} ${colorClasses} ${primaryAction ? 'text-lg' : 'text-sm'}`}
    >
      <div className="flex flex-col items-center">
        <Icon size={primaryAction ? 32 : 24} className="mb-2" />
        <span>{label}</span>
      </div>
    </Link>
  );
};

export default QuickActionButton;