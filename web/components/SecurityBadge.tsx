import { SecurityReport } from '../lib/security';

interface SecurityBadgeProps {
  status: SecurityReport['overallStatus'];
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function SecurityBadge({ status, showLabel = true, size = 'md' }: SecurityBadgeProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (status === 'secure') {
    return (
      <div className="flex items-center gap-1.5">
        <div className={`${sizeClasses[size]} bg-green-500 rounded-full flex items-center justify-center`}>
          <svg className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-5 h-5'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {showLabel && (
          <span className={`${labelSizes[size]} font-medium text-green-600`}>Secure</span>
        )}
      </div>
    );
  }

  if (status === 'caution') {
    return (
      <div className="flex items-center gap-1.5">
        <div className={`${sizeClasses[size]} bg-yellow-500 rounded-full flex items-center justify-center`}>
          <svg className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-5 h-5'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        {showLabel && (
          <span className={`${labelSizes[size]} font-medium text-yellow-600`}>Caution</span>
        )}
      </div>
    );
  }

  if (status === 'review') {
    return (
      <div className="flex items-center gap-1.5">
        <div className={`${sizeClasses[size]} bg-orange-500 rounded-full flex items-center justify-center`}>
          <svg className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-5 h-5'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        {showLabel && (
          <span className={`${labelSizes[size]} font-medium text-orange-600`}>Review</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className={`${sizeClasses[size]} bg-gray-300 rounded-full flex items-center justify-center`}>
        <svg className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-5 h-5'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      {showLabel && (
        <span className={`${labelSizes[size]} font-medium text-gray-500`}>Pending</span>
      )}
    </div>
  );
}
