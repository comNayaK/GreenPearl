import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'yellow' | 'mustard' | 'green' | 'red' | 'purple' | 'lavender' | 'blue' | 'slate' | 'rose' | 'amber';
  size?: 'sm' | 'md';
  className?: string;
  prefix?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
  prefix,
}) => {
  const variantStyles = {
    yellow: 'text-accent-yellow border-accent-yellow/40 bg-accent-yellow/10',
    mustard: 'text-accent-yellow border-accent-yellow/40 bg-accent-yellow/10',
    green: 'text-accent-green border-accent-green/40 bg-accent-green/10',
    red: 'text-accent-red border-accent-red/40 bg-accent-red/10',
    purple: 'text-accent-yellow border-accent-yellow/40 bg-accent-yellow/10',
    lavender: 'text-accent-yellow border-accent-yellow/40 bg-accent-yellow/10',
    blue: 'text-accent-blue border-accent-blue/30 bg-accent-blue/10',
    slate: 'text-slate-300 border-surface-700 bg-surface-850',
    rose: 'text-accent-red border-accent-red/40 bg-accent-red/10',
    amber: 'text-accent-yellow border-accent-yellow/40 bg-accent-yellow/10',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 scribble-tag font-semibold',
    md: 'text-xs px-2.5 py-1 scribble-tag font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border tracking-tight ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {prefix && <span className="opacity-50">{prefix}</span>}
      <span>{children}</span>
    </span>
  );
};
