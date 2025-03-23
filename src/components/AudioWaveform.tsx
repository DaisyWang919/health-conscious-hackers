import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  values: number[];
  isStatic?: boolean;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barColor?: string;
  backgroundColor?: string;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  values,
  isStatic = false,
  height = 60,
  barWidth = 3,
  barGap = 2,
  barColor = '#3b82f6', // blue-500
  backgroundColor = 'transparent'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Draw the waveform on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, rect.width, height);
    
    // If no values, draw placeholder bars
    if (values.length === 0) {
      // Draw a few placeholder bars in the center
      const centerX = rect.width / 2;
      const totalWidth = 5 * (barWidth + barGap);
      const startX = centerX - totalWidth / 2;
      
      ctx.fillStyle = '#e5e7eb'; // gray-200
      
      for (let i = 0; i < 5; i++) {
        const x = startX + i * (barWidth + barGap);
        const barHeight = Math.random() * 20 + 10; // Random height between 10-30
        const y = (height - barHeight) / 2;
        
        ctx.fillRect(x, y, barWidth, barHeight);
      }
      
      return;
    }
    
    // Draw the waveform
    const totalBars = Math.min(values.length, Math.floor(rect.width / (barWidth + barGap)));
    const startX = (rect.width - totalBars * (barWidth + barGap)) / 2;
    
    // Draw each bar
    for (let i = 0; i < totalBars; i++) {
      const index = Math.floor((i / totalBars) * values.length);
      const value = values[index];
      
      // Calculate bar height based on value (0-100)
      const barHeight = Math.max(2, (value / 100) * height);
      
      // Position the bar in the middle vertically
      const x = startX + i * (barWidth + barGap);
      const y = (height - barHeight) / 2;
      
      // Use a gradient for active recordings
      if (!isStatic) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#2563eb'); // blue-600
        gradient.addColorStop(1, '#60a5fa'); // blue-400
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = barColor;
      }
      
      // Draw rounded bar
      const radius = Math.min(barWidth / 2, barHeight / 2, 2);
      roundRect(ctx, x, y, barWidth, barHeight, radius);
    }
  }, [values, height, barWidth, barGap, barColor, backgroundColor, isStatic]);
  
  // Helper function to draw rounded rectangles
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  };
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        className="w-full" 
        style={{ height: `${height}px` }}
      />
    </div>
  );
};

export default AudioWaveform;