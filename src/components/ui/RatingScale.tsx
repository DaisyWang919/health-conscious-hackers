import React from 'react';

interface RatingScaleProps {
  value: number;
  onChange: (value: number) => void;
  labels: {
    min: string;
    mid: string;
    max: string;
  };
  color?: 'blue' | 'green' | 'purple';
}

const buttonColors = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500'
};

export const RatingScale: React.FC<RatingScaleProps> = ({
  value,
  onChange,
  labels,
  color = 'blue'
}) => {
  return (
    <>
      <div className="flex items-center justify-between my-2">
        <span className="text-sm text-gray-500">{labels.min}</span>
        <span className="text-sm text-gray-500">{labels.mid}</span>
        <span className="text-sm text-gray-500">{labels.max}</span>
      </div>
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`w-1/5 py-2 rounded-md ${
              value === rating
                ? `${buttonColors[color]} text-white`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </>
  );
};