import { Window } from './Window';
import { Button95 } from '../ui/Button95';
import { useNftSales } from '../../hooks/useNftSales';
import { formatRelativeTime } from '../../lib/utils';
import type { WindowState } from '../../types';

interface SalesWindowProps {
  window: WindowState;
}

export function SalesWindow({ window }: SalesWindowProps) {
  const { sales, loading, error, refresh } = useNftSales(true); // Auto-refresh enabled

  if (loading && sales.length === 0) {
    return (
      <Window window={window}>
        <div className="flex items-center justify-center h-full">
          <div>Fetching sales...</div>
        </div>
      </Window>
    );
  }

  if (error) {
    return (
      <Window window={window}>
        <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
          <div className="text-red-600 text-center">
            <div className="font-bold mb-2">Failed to load sales</div>
            <div className="text-xs text-gray-600">{error}</div>
          </div>
          <Button95 onClick={refresh}>Retry</Button95>
        </div>
      </Window>
    );
  }

  return (
    <Window window={window}>
      <div className="flex flex-col h-full">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-gray-400">
          <div>
            <div className="font-bold">Recent Sales</div>
            {sales.length > 0 && sales[0].id.startsWith('mock-') && (
              <div className="text-xs text-gray-500 mt-1">
                (Sample Data - API Unavailable)
              </div>
            )}
          </div>
          <Button95 onClick={refresh} disabled={loading} className="text-xs px-2 py-0">
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button95>
        </div>

        {/* Sales List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {sales.length === 0 ? (
            <div className="text-center text-gray-600">No sales found</div>
          ) : (
            sales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center gap-3 p-2 border-2 border-gray-400 bg-white"
              >
                {/* NFT Thumbnail */}
                <img
                  src={sale.token.image}
                  alt={`Creepz #${sale.token.tokenId}`}
                  className="w-10 h-10 object-cover border border-gray-400"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23ccc"/%3E%3C/svg%3E';
                  }}
                />

                {/* Sale Info */}
                <div className="flex-1 text-sm">
                  <div className="font-bold">#{sale.token.tokenId}</div>
                  <div className="text-xs text-gray-600">
                    Ξ {sale.price.amount.decimal.toFixed(3)}
                  </div>
                </div>

                {/* Time */}
                <div className="text-xs text-gray-600">
                  {formatRelativeTime(sale.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Window>
  );
}
