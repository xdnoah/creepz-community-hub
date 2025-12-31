import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function LoadingScreen() {
  const { error, forceStopLoading, retryAuth } = useAuth();
  const [elapsed, setElapsed] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  useEffect(() => {
    // Track elapsed time
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    // Show recovery options after 3 seconds
    const recoveryTimer = setTimeout(() => {
      setShowRecovery(true);
      runDiagnostics();
    }, 3000);

    // Force stop loading after 12 seconds (longer than profile fetch timeout of 8s)
    const forceStopTimer = setTimeout(() => {
      console.error('[LoadingScreen] Force stop triggered after 12s');
      forceStopLoading();
    }, 12000);

    return () => {
      clearInterval(interval);
      clearTimeout(recoveryTimer);
      clearTimeout(forceStopTimer);
    };
  }, [forceStopLoading]);

  const runDiagnostics = async () => {
    const results: string[] = [];

    // Check Supabase connection
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        results.push(`❌ Database: ${error.message}`);
      } else {
        results.push('✅ Database connection OK');
      }
    } catch (err: any) {
      results.push(`❌ Database: ${err.message}`);
    }

    // Check auth session
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        results.push(`❌ Auth: ${error.message}`);
      } else if (data.session) {
        results.push(`⚠️ Auth: Session exists but profile load failed`);
      } else {
        results.push('✅ Auth: No session (normal)');
      }
    } catch (err: any) {
      results.push(`❌ Auth: ${err.message}`);
    }

    setDiagnostics(results);
  };

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const handleForceLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const handleRetry = async () => {
    setShowRecovery(false);
    setElapsed(0);
    setDiagnostics([]);
    await retryAuth();
  };

  return (
    <div className="loading-screen">
      <div className="flex flex-col items-center gap-4 max-w-md">
        {/* Loading Animation */}
        <div className="text-4xl">⌛</div>

        {/* Main Message */}
        <div className="text-xl font-bold">
          {error ? 'Loading Error' : 'Loading Creepz Community Hub...'}
        </div>

        {/* Timer */}
        <div className="text-sm text-gray-400">
          {elapsed}s elapsed
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 text-white px-4 py-2 border-2 border-red-500 text-sm">
            <div className="font-bold">Error Details:</div>
            <div>{error}</div>
          </div>
        )}

        {/* Recovery Options */}
        {showRecovery && (
          <div className="bg-gray-800 p-4 border-2 border-gray-600 w-full">
            <div className="font-bold mb-2 text-yellow-400">
              ⚠️ Loading is taking longer than usual
            </div>

            {/* Diagnostics */}
            {diagnostics.length > 0 && (
              <div className="mb-3 text-xs bg-black p-2 border border-gray-700">
                <div className="font-bold mb-1">Diagnostics:</div>
                {diagnostics.map((diag, i) => (
                  <div key={i} className="font-mono">{diag}</div>
                ))}
              </div>
            )}

            {/* Recovery Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 border-2 border-blue-400 font-bold text-sm"
              >
                🔄 Retry Loading
              </button>

              <button
                onClick={handleForceLogout}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 border-2 border-orange-400 font-bold text-sm"
              >
                🚪 Force Logout & Reload
              </button>

              <button
                onClick={handleClearCache}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 border-2 border-red-400 font-bold text-sm"
              >
                🗑️ Clear All Data & Reload
              </button>

              <button
                onClick={forceStopLoading}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 border-2 border-gray-400 font-bold text-sm"
              >
                ⏭️ Skip Loading (Continue Anyway)
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-400">
              If the problem persists, check your internet connection or contact support.
            </div>
          </div>
        )}

        {/* Helpful tip while waiting */}
        {!showRecovery && !error && (
          <div className="text-xs text-gray-500 text-center max-w-xs">
            First time? This may take a few seconds while we connect to the database...
          </div>
        )}
      </div>
    </div>
  );
}
