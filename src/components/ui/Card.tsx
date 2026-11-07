import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  variant?: 'default' | 'alt' | 'elevated' | 'subtle' | 'dashed';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantClass = {
    default: 'scribble-card',
    alt: 'scribble-card-alt',
    elevated: 'scribble-card bg-surface-850 border-surface-700',
    subtle: 'scribble-card bg-surface-950/70 border-surface-800',
    dashed: 'border-2 border-dashed border-surface-700 bg-surface-900/60 rounded-[20px_255px_20px_255px/255px_20px_255px_20px]',
  }[variant];

  return (
    <div
      className={`p-4 sm:p-5 ${variantClass} ${
        hoverEffect ? 'hover:border-accent-green/60 hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
