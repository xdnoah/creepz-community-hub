// Loading skeleton components for Windows 95 style

export function MessageSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 bg-gray-300 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
}

export function UserListSkeleton() {
  return (
    <div className="animate-pulse space-y-2 p-2">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex items-center gap-2 p-2 border border-gray-300">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-gray-300 rounded w-24"></div>
            <div className="h-2 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationListSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3 p-3 border-b border-gray-300">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-gray-300 rounded w-24"></div>
              <div className="h-2 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  error?: string | null;
  onRetry?: () => void;
}

export function LoadingState({ message = 'Loading...', error, onRetry }: LoadingStateProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-white">
        <div className="text-red-600 font-bold mb-2">⚠️ Error</div>
        <div className="text-sm text-gray-700 mb-4 text-center">{error}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-win95-gray border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 px-4 py-2 font-bold text-sm hover:bg-gray-300"
          >
            🔄 Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-white">
      <div className="text-4xl mb-3 animate-pulse">⌛</div>
      <div className="text-sm text-gray-600">{message}</div>
      <div className="text-xs text-gray-500 mt-2">This should only take a moment...</div>
    </div>
  );
}
