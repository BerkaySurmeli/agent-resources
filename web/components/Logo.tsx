import React from 'react';

interface LogoProps {
  variant?: 'icon' | 'full';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  textClassName?: string;
}

const sizes = {
  sm: { icon: 32, full: 120 },
  md: { icon: 40, full: 150 },
  lg: { icon: 48, full: 180 },
};

export function Logo({ variant = 'full', className = '', size = 'md', textClassName = '' }: LogoProps) {
  const sizeConfig = sizes[size];
  
  if (variant === 'icon') {
    return (
      <img 
        src="/logos/ar-icon-only.svg" 
        alt="Agent Resources" 
        className={`${className}`}
        style={{ width: sizeConfig.icon, height: sizeConfig.icon }}
      />
    );
  }
  
  return (
    <img 
      src="/logos/ar-logo-full.svg" 
      alt="Agent Resources" 
      className={`${className}`}
      style={{ height: sizeConfig.icon }}
    />
  );
}

export default Logo;
