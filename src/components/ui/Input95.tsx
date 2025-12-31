import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface Input95Props extends InputHTMLAttributes<HTMLInputElement> {}

export const Input95 = forwardRef<HTMLInputElement, Input95Props>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'px-2 py-1 bg-white border-2 border-gray-800 border-t-gray-600 border-l-gray-600',
          'font-system text-sm',
          'focus:outline-none focus:border-win95-blue',
          'disabled:bg-gray-200 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);

Input95.displayName = 'Input95';
