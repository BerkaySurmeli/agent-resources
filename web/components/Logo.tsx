import React from 'react';

interface LogoProps {
  variant?: 'icon' | 'full';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  textClassName?: string;
}

const sizes = {
  sm: { icon: 32, text: 'text-sm' },
  md: { icon: 40, text: 'text-base' },
  lg: { icon: 48, text: 'text-lg' },
};

export function Logo({ variant = 'full', className = '', size = 'md', textClassName = '' }: LogoProps) {
  const sizeConfig = sizes[size];
  
  if (variant === 'icon') {
    return (
      <div 
        className={`bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 ${className}`}
        style={{ width: sizeConfig.icon, height: sizeConfig.icon }}
        aria-label="Agent Resources"
      >
        <span className="text-white font-bold text-lg">AR</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Beveled Icon with gradient and shadow */}
      <div 
        className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30"
        style={{ width: sizeConfig.icon, height: sizeConfig.icon }}
      >
        <span className="text-white font-bold text-lg">AR</span>
      </div>
      
      {/* Text */}
      <span className={`font-semibold ${sizeConfig.text} ${textClassName}`}>
        Agent Resources
      </span>
    </div>
  );
}

export default Logo;