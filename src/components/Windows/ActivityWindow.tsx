import { useEffect, useRef, useState } from 'react';
import { Window } from './Window';
import { useActivityLogs } from '../../hooks/useActivityLogs';
import { useWindowManager } from '../../contexts/WindowContext';
import { LoadingState } from '../ui/LoadingSkeleton';
import type { WindowState, ActivityLog, ActivityType } from '../../types';

interface ActivityWindowProps {
  window: WindowState;
}

export function ActivityWindow({ window }: ActivityWindowProps) {
  const { logs, loading, error } = useActivityLogs();
  const { openWindow } = useWindowManager();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [activeFilters, setActiveFilters] = useState<Set<ActivityType>>(new Set());

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const toggleFilter = (type: ActivityType) => {
    setActiveFilters((prev) => {
      const newFilters = new Set(prev);
      if (newFilters.has(type)) {
        newFilters.delete(type);
      } else {
        newFilters.add(type);
      }
      return newFilters;
    });
  };

  const filteredLogs = activeFilters.size === 0
    ? logs
    : logs.filter((log) => activeFilters.has(log.activity_type));

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
      case 'lizard_fight_won':
        return '🏆';
      case 'lizard_fight_lost':
        return '💔';
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
      case 'lizard_fight_won':
        const wonOpponent = log.metadata?.opponent || 'an opponent';
        const wonPoints = log.metadata?.rank_points || 0;
        return (
          <>
            {icon} {username} defeated {wonOpponent} in battle
            {wonPoints > 0 && <span className="text-yellow-400"> (+{wonPoints} rank points)</span>}
          </>
        );
      case 'lizard_fight_lost':
        const lostOpponent = log.metadata?.opponent || 'an opponent';
        const lostPoints = log.metadata?.rank_points || 0;
        return (
          <>
            {icon} {username} was defeated by {lostOpponent}
            {lostPoints < 0 && <span className="text-red-400"> ({lostPoints} rank points)</span>}
          </>
        );
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

          {/* Filters */}
          <div className="mb-4 p-2 border border-green-500 rounded bg-gray-900 bg-opacity-50">
            <div className="text-xs text-green-500 mb-2 font-bold">&gt; FILTERS:</div>
            <div className="flex flex-wrap gap-1">
              {[
                { type: 'user_joined' as ActivityType, label: '🆕 Joins', activeClass: 'bg-cyan-500 border-cyan-600' },
                { type: 'raid_added' as ActivityType, label: '📢 Raids', activeClass: 'bg-blue-500 border-blue-600' },
                { type: 'lizard_levelup' as ActivityType, label: '⬆️ Levels', activeClass: 'bg-yellow-500 border-yellow-600' },
                { type: 'lizard_fight_won' as ActivityType, label: '🏆 Wins', activeClass: 'bg-green-500 border-green-600' },
                { type: 'lizard_fight_lost' as ActivityType, label: '💔 Losses', activeClass: 'bg-red-500 border-red-600' },
                { type: 'lizard_fed' as ActivityType, label: '🍖 Fed', activeClass: 'bg-orange-500 border-orange-600' },
                { type: 'daily_reward_claimed' as ActivityType, label: '🎁 Rewards', activeClass: 'bg-pink-500 border-pink-600' },
              ].map(({ type, label, activeClass }) => (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className={`text-xs px-2 py-1 rounded border transition-all ${
                    activeFilters.has(type)
                      ? `${activeClass} text-white font-bold`
                      : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
              {activeFilters.size > 0 && (
                <button
                  onClick={() => setActiveFilters(new Set())}
                  className="text-xs px-2 py-1 rounded border border-red-500 bg-red-900 bg-opacity-30 text-red-400 hover:bg-red-800 hover:bg-opacity-50"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {activeFilters.size === 0
                ? `Showing all ${logs.length} events`
                : `Showing ${filteredLogs.length} of ${logs.length} events`}
            </div>
          </div>

          {error && (
            <div className="text-red-500 mb-3 border border-red-500 p-2">
              ERROR: {error}
            </div>
          )}

          {/* Activity Logs */}
          {filteredLogs.length === 0 && !loading && (
            <div className="text-yellow-500 animate-pulse">
              &gt; {activeFilters.size > 0 ? 'No events match the selected filters' : 'No activity detected yet. Waiting for events...'}
            </div>
          )}

          <div className="space-y-1">
            {filteredLogs.map((log) => (
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
