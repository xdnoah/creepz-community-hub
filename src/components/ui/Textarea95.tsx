import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface Textarea95Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea95 = forwardRef<HTMLTextAreaElement, Textarea95Props>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'px-2 py-1 bg-white border-2 border-gray-800 border-t-gray-600 border-l-gray-600',
          'font-system text-sm resize-none',
          'focus:outline-none focus:border-win95-blue',
          'disabled:bg-gray-200 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea95.displayName = 'Textarea95';
