import React from 'react';

interface LogoProps {
  variant?: 'icon' | 'full';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: { icon: 32, full: { width: 144, height: 32 } },
  md: { icon: 40, full: { width: 180, height: 40 } },
  lg: { icon: 48, full: { width: 216, height: 48 } },
};

export function Logo({ variant = 'full', className = '', size = 'md' }: LogoProps) {
  const sizeConfig = sizes[size];
  
  if (variant === 'icon') {
    return (
      <svg 
        viewBox="0 0 40 40" 
        width={sizeConfig.icon} 
        height={sizeConfig.icon}
        className={className}
        aria-label="Agent Resources"
      >
        <rect width="40" height="40" rx="8" fill="#2563eb"/>
        <text 
          x="50%" 
          y="50%" 
          dominantBaseline="central" 
          textAnchor="middle" 
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
          fontSize="18" 
          fontWeight="700" 
          fill="white"
        >
          AR
        </text>
      </svg>
    );
  }
  
  return (
    <svg 
      viewBox="0 0 180 40" 
      width={sizeConfig.full.width} 
      height={sizeConfig.full.height}
      className={className}
      aria-label="Agent Resources"
    >
      {/* Icon */}
      <rect x="0" y="0" width="40" height="40" rx="8" fill="#2563eb"/>
      <text 
        x="20" 
        y="20" 
        dominantBaseline="central" 
        textAnchor="middle" 
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
        fontSize="18" 
        fontWeight="700" 
        fill="white"
      >
        AR
      </text>
      
      {/* Text */}
      <text 
        x="52" 
        y="20" 
        dominantBaseline="central" 
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
        fontSize="16" 
        fontWeight="600" 
        fill="currentColor"
      >
        Agent Resources
      </text>
    </svg>
  );
}

export default Logo;