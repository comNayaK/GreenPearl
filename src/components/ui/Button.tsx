import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'green' | 'secondary' | 'outline' | 'subtle' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold select-none disabled:opacity-40 disabled:cursor-not-allowed scribble-btn transition-all';

  const variantStyles = {
    primary:
      'bg-accent-yellow text-slate-950 border-accent-yellow hover:bg-accent-yellowLight hover:border-accent-yellowLight shadow-sm',
    green:
      'bg-accent-green text-slate-950 border-accent-green hover:bg-accent-greenLight hover:border-accent-greenLight shadow-sm',
    secondary:
      'bg-surface-850 text-slate-100 border-surface-700 hover:bg-surface-800 hover:border-accent-yellow hover:text-white',
    outline:
      'bg-transparent text-slate-200 border-surface-700 hover:border-accent-yellow hover:bg-accent-yellow/10 hover:text-white',
    subtle:
      'bg-surface-900 text-slate-300 border-surface-750 hover:bg-surface-850 hover:text-slate-100 hover:border-surface-700 shadow-none',
    danger:
      'bg-accent-red/20 text-accent-red border-accent-red/50 hover:bg-accent-red/30 hover:border-accent-red',
  };

  const sizeStyles = {
    sm: 'min-h-[40px] px-3.5 py-1.5 text-xs',
    md: 'min-h-[50px] px-5 py-2.5 text-sm sm:text-base',
    lg: 'min-h-[54px] px-6 py-3 text-base',
    xl: 'min-h-[56px] px-7 py-3 text-base sm:text-lg tracking-wide',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
