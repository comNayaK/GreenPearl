import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-slate-400">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-surface-950 border border-surface-700 scribble-input px-4 py-3 min-h-[52px] text-base text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-accent-yellow focus:ring-1 focus:ring-accent-yellow/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          error ? 'border-accent-red focus:border-accent-red focus:ring-accent-red/30' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-accent-red mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
};
