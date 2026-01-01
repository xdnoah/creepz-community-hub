interface FullScreenLoadingProps {
  message?: string;
  submessage?: string;
}

export function FullScreenLoading({
  message = 'Loading Creepz Hub...',
  submessage = 'Preparing your experience'
}: FullScreenLoadingProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-teal-900 via-emerald-800 to-cyan-900 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated logo/icon */}
        <div className="mb-8 relative">
          <div className="text-9xl animate-bounce inline-block">
            🦎
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Main message */}
        <div className="text-3xl font-bold text-white mb-3 animate-pulse">
          {message}
        </div>

        {/* Submessage */}
        <div className="text-lg text-emerald-200 mb-6">
          {submessage}
        </div>

        {/* Loading dots */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Progress bar */}
        <div className="mt-8 w-80 mx-auto">
          <div className="h-2 bg-emerald-950 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WindowLoadingProps {
  message?: string;
  compact?: boolean;
}

export function WindowLoading({ message = 'Loading...', compact = false }: WindowLoadingProps) {
  if (compact) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mb-4 relative">
        <div className="text-6xl animate-bounce">
          ⌛
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
      <div className="text-lg font-bold text-gray-700 mb-2">{message}</div>
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
