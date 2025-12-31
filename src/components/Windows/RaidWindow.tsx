import { useState } from 'react';
import { Window } from './Window';
import { Input95 } from '../ui/Input95';
import { Button95 } from '../ui/Button95';
import { LoadingState } from '../ui/LoadingSkeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useRaidLinks } from '../../hooks/useRaidLinks';
import { formatRelativeTime } from '../../lib/utils';
import type { WindowState } from '../../types';

interface RaidWindowProps {
  window: WindowState;
}

export function RaidWindow({ window }: RaidWindowProps) {
  const { user } = useAuth();
  const { links, loading, error, addLink, deleteLink, retry } = useRaidLinks();
  const [tweetUrl, setTweetUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isValidTwitterUrl = (url: string) => {
    // Match twitter.com/x.com tweet URLs
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
      setTweetUrl('');
      setDescription('');
    }

    setSubmitting(false);
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm('Delete this raid link?')) return;
    await deleteLink(linkId);
  };

  return (
    <Window window={window}>
      <div className="flex flex-col h-full">
        {/* Header/Info */}
        <div className="bg-red-600 text-white p-3 border-b-2 border-gray-400">
          <div className="font-bold text-lg">🚀 RAID PARTY</div>
          <div className="text-xs opacity-90">
            Share tweets to raid together! Let's support the community!
          </div>
        </div>

        {/* Links List */}
        <div className="flex-1 overflow-y-auto p-3 bg-white">
          {loading && <LoadingState message="Loading raid links..." />}

          {error && (
            <div className="bg-red-100 border-2 border-red-600 p-3 text-center">
              <div className="text-red-700 font-bold mb-2">⚠️ Error</div>
              <div className="text-sm text-red-600 mb-3">{error}</div>
              <Button95 onClick={retry}>🔄 Retry</Button95>
            </div>
          )}

          {!loading && !error && links.length === 0 && (
            <div className="text-center text-gray-600 py-8">
              <div className="text-4xl mb-2">🏜️</div>
              <div className="font-bold">No raid links yet!</div>
              <div className="text-sm">Be the first to share a tweet to raid!</div>
            </div>
          )}

          {!loading && !error && links.length > 0 && (
            <div className="space-y-3">
              {links.map((link) => (
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
                        {formatRelativeTime(link.created_at)}
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
                    className="text-sm text-blue-600 hover:underline break-all font-mono"
                  >
                    {link.tweet_url}
                  </a>

                  <div className="mt-2">
                    <a
                      href={link.tweet_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <Button95 className="text-xs">
                        🚀 RAID THIS TWEET
                      </Button95>
                    </a>
                  </div>
                </div>
              ))}
            </div>
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
