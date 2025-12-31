import { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface Button95Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary';
}

export function Button95({ children, className, variant = 'default', ...props }: Button95Props) {
  return (
    <button
      className={cn(
        'px-4 py-1 font-system',
        variant === 'default' && 'bg-win95-gray border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800',
        variant === 'primary' && 'bg-win95-gray border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 font-bold',
        'active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'hover:bg-gray-300',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
