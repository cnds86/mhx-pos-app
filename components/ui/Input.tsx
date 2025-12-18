
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  leftIcon, 
  rightIcon, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="w-full space-y-1">
      {label && <label className="block text-xs font-bold text-gray-500 uppercase ml-1">{label}</label>}
      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
            {leftIcon}
          </div>
        )}
        <input 
          className={`
            w-full py-2.5 border rounded-xl outline-none transition-all
            ${leftIcon ? 'pl-10' : 'pl-4'} 
            ${rightIcon ? 'pr-10' : 'pr-4'}
            ${error ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-[10px] text-red-500 font-bold ml-1">{error}</p>}
    </div>
  );
};
