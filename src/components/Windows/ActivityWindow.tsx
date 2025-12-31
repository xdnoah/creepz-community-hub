import { useEffect, useRef } from 'react';
import { Window } from './Window';
import { useActivityLogs } from '../../hooks/useActivityLogs';
import { useWindowManager } from '../../contexts/WindowContext';
import { LoadingState } from '../ui/LoadingSkeleton';
import type { WindowState, ActivityLog } from '../../types';

interface ActivityWindowProps {
  window: WindowState;
}

export function ActivityWindow({ window }: ActivityWindowProps) {
  const { logs, loading, error } = useActivityLogs();
  const { openWindow } = useWindowManager();
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `[${hours}:${minutes}:${seconds}]`;
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'user_joined':
        return '🆕';
      case 'raid_added':
        return '📢';
      case 'tweet_raided':
        return '🚀';
      case 'lizard_levelup':
        return '⬆️';
      case 'login_streak_milestone':
        return '🔥';
      case 'lizard_fed':
        return '🍖';
      case 'daily_reward_claimed':
        return '🎁';
      default:
        return '•';
    }
  };

  const handleUsernameClick = (userId: string, username: string) => {
    openWindow('profile', { userId, username });
  };

  const ClickableUsername = ({ userId, username }: { userId: string; username: string }) => (
    <button
      onClick={() => handleUsernameClick(userId, username)}
      className="text-yellow-400 hover:text-yellow-300 hover:underline font-bold cursor-pointer"
    >
      {username}
    </button>
  );

  const getActivityMessage = (log: ActivityLog): JSX.Element => {
    const icon = getActivityIcon(log.activity_type);
    const username = <ClickableUsername userId={log.user_id} username={log.username} />;

    switch (log.activity_type) {
      case 'user_joined':
        return <>{icon} {username} joined the community</>;
      case 'raid_added':
        return <>{icon} {username} added a new tweet to the raid party</>;
      case 'tweet_raided':
        return <>{icon} {username} raided a tweet (+500 gold)</>;
      case 'lizard_levelup':
        const level = log.metadata?.level || '?';
        return <>{icon} {username}'s lizard reached level {level}</>;
      case 'login_streak_milestone':
        const streak = log.metadata?.streak || '?';
        return <>{icon} {username} reached a {streak}-day login streak</>;
      case 'lizard_fed':
        return <>{icon} {username} fed their lizard (2X boost active)</>;
      case 'daily_reward_claimed':
        const reward = log.metadata?.reward || '?';
        return <>{icon} {username} claimed daily reward (+{reward} gold)</>;
      default:
        return <>{icon} {username} performed an action</>;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <Window window={window}>
        <LoadingState message="Initializing terminal..." />
      </Window>
    );
  }

  return (
    <Window window={window}>
      <div className="flex flex-col h-full bg-black font-mono">
        {/* Terminal Header */}
        <div className="bg-gray-800 border-b-2 border-green-500 p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-green-500 font-bold">root@creepz:~#</div>
            <div className="text-green-400 text-xs animate-pulse">ACTIVITY MONITOR</div>
          </div>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 overflow-y-auto p-3 text-green-400 text-sm leading-relaxed">
          {/* System Info */}
          <div className="text-green-500 mb-3 opacity-75">
            <div>╔════════════════════════════════════════════════════╗</div>
            <div>║  CREEPZ COMMUNITY HUB - ACTIVITY MONITOR v2.0     ║</div>
            <div>║  Real-time event tracking system                  ║</div>
            <div>║  Monitoring {logs.length} recent events                        ║</div>
            <div>╚════════════════════════════════════════════════════╝</div>
            <div className="mt-2 text-xs">&gt; Streaming live events...</div>
            <div className="text-xs mb-3">&gt; Press Ctrl+C to exit (just kidding, this is read-only)</div>
          </div>

          {error && (
            <div className="text-red-500 mb-3 border border-red-500 p-2">
              ERROR: {error}
            </div>
          )}

          {/* Activity Logs */}
          {logs.length === 0 && !loading && (
            <div className="text-yellow-500 animate-pulse">
              &gt; No activity detected yet. Waiting for events...
            </div>
          )}

          <div className="space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="hover:bg-gray-900 p-1 rounded transition-colors border-l-2 border-transparent hover:border-green-500"
              >
                <span className="text-cyan-400">{formatTime(log.created_at)}</span>
                <span className="text-gray-500 mx-2">│</span>
                <span className="text-green-300">{getActivityMessage(log)}</span>
              </div>
            ))}
          </div>

          <div ref={logsEndRef} />

          {/* Blinking cursor */}
          <div className="mt-4 flex items-center">
            <span className="text-green-500">&gt;</span>
            <span className="ml-1 w-2 h-4 bg-green-500 animate-pulse"></span>
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="bg-gray-800 border-t-2 border-green-500 p-1 text-xs text-green-400 flex items-center justify-between">
          <div>
            <span className="text-gray-500">Status:</span>
            <span className="text-green-500 ml-2">● ONLINE</span>
            <span className="text-gray-500 ml-4">Events:</span>
            <span className="text-cyan-400 ml-2">{logs.length}</span>
          </div>
          <div className="text-gray-500">
            Read-only terminal • Real-time updates enabled
          </div>
        </div>
      </div>
    </Window>
  );
}
