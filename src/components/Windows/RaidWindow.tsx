import { useState } from 'react';
import { Window } from './Window';
import { Input95 } from '../ui/Input95';
import { Button95 } from '../ui/Button95';
import { LoadingState } from '../ui/LoadingSkeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useRaidLinks } from '../../hooks/useRaidLinks';
import { useRaidTracking } from '../../hooks/useRaidTracking';
import { useActivityLogs } from '../../hooks/useActivityLogs';
import { formatRelativeTime } from '../../lib/utils';
import type { WindowState } from '../../types';

interface RaidWindowProps {
  window: WindowState;
}

type TabType = 'new' | 'raided';

export function RaidWindow({ window }: RaidWindowProps) {
  const { user } = useAuth();
  const { links, loading: linksLoading, error: linksError, addLink, deleteLink, retry } = useRaidLinks();
  const { raidedTweets, loading: raidedLoading, markAsRaided, isRaided } = useRaidTracking();
  const { logActivity } = useActivityLogs();
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [tweetUrl, setTweetUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [goldNotification, setGoldNotification] = useState(false);

  const isValidTwitterUrl = (url: string) => {
    const twitterRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/;
    return twitterRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tweetUrl) return;

    if (!isValidTwitterUrl(tweetUrl)) {
      setSubmitError('Please enter a valid Twitter/X tweet URL');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const result = await addLink(tweetUrl, description || null, user.id);

    if (result.error) {
      setSubmitError(result.error);
    } else {
      // Log activity
      await logActivity('raid_added');
      setTweetUrl('');
      setDescription('');
    }

    setSubmitting(false);
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm('Delete this raid link?')) return;
    await deleteLink(linkId);
  };

  const handleRaidClick = async (linkId: string, url: string) => {
    // Mark as raided and get gold reward
    const result = await markAsRaided(linkId);

    if (!result.error && result.goldEarned) {
      // Show gold notification
      setGoldNotification(true);
      setTimeout(() => setGoldNotification(false), 3000);

      // Log activity
      await logActivity('tweet_raided');
    }

    // Open tweet in new tab
    globalThis.window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Filter links based on tab
  const newRaidLinks = links.filter(link => !isRaided(link.id));
  const recentlyRaidedLinks = links.filter(link => {
    const raided = raidedTweets.find(rt => rt.raid_link_id === link.id);
    return raided;
  });

  const loading = linksLoading || raidedLoading;
  const error = linksError;

  return (
    <Window window={window}>
      <div className="flex flex-col h-full relative">
        {/* Gold Reward Notification */}
        {goldNotification && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 border-4 border-yellow-600 p-4 rounded-lg shadow-2xl animate-bounce">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">💰 +500 GOLD!</div>
                <div className="text-sm text-yellow-900 font-bold">Raid successful!</div>
              </div>
            </div>
          </div>
        )}

        {/* Header/Info */}
        <div className="bg-red-600 text-white p-3 border-b-2 border-gray-400">
          <div className="font-bold text-lg">🚀 RAID PARTY</div>
          <div className="text-xs opacity-90">
            Share tweets to raid together! Support = +500 gold!
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-gray-400 bg-win95-gray">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 px-4 py-2 font-bold text-sm border-r-2 border-gray-400 ${
              activeTab === 'new'
                ? 'bg-white border-b-2 border-white -mb-[2px] relative z-10'
                : 'bg-win95-gray hover:bg-gray-300'
            }`}
          >
            🆕 New Raids ({newRaidLinks.length})
          </button>
          <button
            onClick={() => setActiveTab('raided')}
            className={`flex-1 px-4 py-2 font-bold text-sm ${
              activeTab === 'raided'
                ? 'bg-white border-b-2 border-white -mb-[2px] relative z-10'
                : 'bg-win95-gray hover:bg-gray-300'
            }`}
          >
            ✅ Recently Raided ({recentlyRaidedLinks.length}/10)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-3 bg-white">
          {loading && <LoadingState message="Loading raid links..." />}

          {error && (
            <div className="bg-red-100 border-2 border-red-600 p-3 text-center">
              <div className="text-red-700 font-bold mb-2">⚠️ Error</div>
              <div className="text-sm text-red-600 mb-3">{error}</div>
              <Button95 onClick={retry}>🔄 Retry</Button95>
            </div>
          )}

          {/* New Raids Tab */}
          {!loading && !error && activeTab === 'new' && (
            <>
              {newRaidLinks.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  <div className="text-4xl mb-2">🎉</div>
                  <div className="font-bold">All caught up!</div>
                  <div className="text-sm">You've raided all available tweets!</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {newRaidLinks.map((link) => (
                    <div
                      key={link.id}
                      className="border-2 border-gray-400 p-3 bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="font-bold text-sm text-blue-600">
                            @{link.username}
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatRelativeTime(new Date(link.created_at).getTime())}
                          </div>
                        </div>
                        {user?.id === link.user_id && (
                          <button
                            onClick={() => handleDelete(link.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-bold"
                            title="Delete"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {link.description && (
                        <div className="text-sm mb-2 text-gray-700">{link.description}</div>
                      )}

                      <a
                        href={link.tweet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all font-mono block mb-2"
                      >
                        {link.tweet_url}
                      </a>

                      <Button95
                        onClick={() => handleRaidClick(link.id, link.tweet_url)}
                        className="text-xs w-full"
                      >
                        🚀 RAID THIS TWEET
                      </Button95>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Recently Raided Tab */}
          {!loading && !error && activeTab === 'raided' && (
            <>
              {recentlyRaidedLinks.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  <div className="text-4xl mb-2">📭</div>
                  <div className="font-bold">No raided tweets yet</div>
                  <div className="text-sm">Tweets you raid will appear here!</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentlyRaidedLinks.map((link) => {
                    const raidedInfo = raidedTweets.find(rt => rt.raid_link_id === link.id);
                    return (
                      <div
                        key={link.id}
                        className="border-2 border-green-600 p-3 bg-green-50"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="font-bold text-sm text-blue-600">
                              @{link.username}
                            </div>
                            <div className="text-xs text-gray-600">
                              Posted {formatRelativeTime(new Date(link.created_at).getTime())}
                            </div>
                            {raidedInfo && (
                              <div className="text-xs text-green-700 font-bold mt-1">
                                ✅ Raided {formatRelativeTime(new Date(raidedInfo.raided_at).getTime())}
                              </div>
                            )}
                          </div>
                        </div>

                        {link.description && (
                          <div className="text-sm mb-2 text-gray-700">{link.description}</div>
                        )}

                        <a
                          href={link.tweet_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all font-mono block"
                        >
                          {link.tweet_url}
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Form */}
        <div className="border-t-2 border-gray-400 p-3 bg-gray-100">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="field-row-stacked">
              <label className="text-xs font-bold">Tweet URL:</label>
              <Input95
                type="url"
                value={tweetUrl}
                onChange={(e) => {
                  setTweetUrl(e.target.value);
                  setSubmitError('');
                }}
                placeholder="https://twitter.com/username/status/123456..."
                disabled={!user || submitting}
                className="text-sm"
              />
            </div>

            <div className="field-row-stacked">
              <label className="text-xs font-bold">Description (optional):</label>
              <Input95
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this tweet about?"
                disabled={!user || submitting}
                maxLength={100}
                className="text-sm"
              />
            </div>

            {submitError && (
              <div className="text-xs text-red-600 bg-red-100 border border-red-400 p-1">
                {submitError}
              </div>
            )}

            <Button95
              type="submit"
              disabled={!user || !tweetUrl || submitting || !isValidTwitterUrl(tweetUrl)}
              className="w-full"
            >
              {submitting ? '⏳ Adding...' : '➕ Add Raid Link'}
            </Button95>

            <div className="text-xs text-gray-600 text-center">
              💡 Tip: Paste a Twitter/X tweet URL to share it with the community!
            </div>
          </form>
        </div>
      </div>
    </Window>
  );
}
