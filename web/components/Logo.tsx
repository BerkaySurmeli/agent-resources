import React from 'react';

interface LogoProps {
  variant?: 'icon' | 'full';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  textClassName?: string;
}

const sizes = {
  sm: { icon: 28, text: 'text-sm' },
  md: { icon: 34, text: 'text-base' },
  lg: { icon: 42, text: 'text-lg' },
  xl: { icon: 56, text: 'text-xl' },
};

export function Logo({ variant = 'full', className = '', size = 'md', textClassName = '' }: LogoProps) {
  const s = sizes[size];

  const icon = (
    <div
      className={`flex-shrink-0 rounded-xl flex items-center justify-center ${className}`}
      style={{
        width: s.icon,
        height: s.icon,
        background: 'linear-gradient(135deg, #CC5132 0%, #DF6B50 100%)',
      }}
      aria-label="Agent Resources"
    >
      <span className="text-white font-bold tracking-tight" style={{ fontSize: s.icon * 0.38 }}>AR</span>
    </div>
  );

  if (variant === 'icon') return icon;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {icon}
      <span className={`font-semibold whitespace-nowrap ${s.text} ${textClassName}`}>
        Agent Resources
      </span>
    </div>
  );
}

export default Logo;
