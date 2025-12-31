import { Window } from './Window';
import { Button95 } from '../ui/Button95';
import type { WindowState } from '../../types';

interface TwitterWindowProps {
  window: WindowState;
}

const TWITTER_HANDLE = 'creepz';
const TWITTER_URL = `https://twitter.com/${TWITTER_HANDLE}`;

export function TwitterWindow({ window: windowState }: TwitterWindowProps) {
  // Use direct fallback UI since Twitter widget embed is unreliable
  // This provides a better, more consistent user experience
  return (
    <Window window={windowState}>
      <div className="flex flex-col h-full bg-win95-gray">
        {/* Header */}
        <div className="border-b-2 border-gray-400 p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="text-5xl">🐦</div>
            <div>
              <h2 className="text-lg font-bold">@{TWITTER_HANDLE}</h2>
              <p className="text-sm text-gray-600">Official Creepz Twitter</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
          <div className="text-center max-w-md">
            <p className="text-sm text-gray-700 mb-6">
              Follow Creepz on X (Twitter) for the latest updates, announcements,
              and community news. Stay connected with the Creepz ecosystem!
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button95
              onClick={() => window.open(TWITTER_URL, '_blank')}
              variant="primary"
              className="w-full py-3 text-base"
            >
              🔗 View @{TWITTER_HANDLE}
            </Button95>

            <Button95
              onClick={() => window.open(`https://twitter.com/intent/follow?screen_name=${TWITTER_HANDLE}`, '_blank')}
              className="w-full py-3 text-base"
            >
              ➕ Follow on X
            </Button95>

            <Button95
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=Checking out @${TWITTER_HANDLE}!`, '_blank')}
              className="w-full py-3 text-base"
            >
              💬 Tweet about Creepz
            </Button95>
          </div>

          {/* Recent Activity Mock */}
          <div className="w-full max-w-md mt-6 p-4 bg-white border-2 border-gray-400">
            <div className="text-xs font-bold mb-2 text-gray-600">QUICK LINKS</div>
            <div className="space-y-2 text-sm">
              <a
                href={TWITTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                → View Profile
              </a>
              <a
                href={`${TWITTER_URL}/media`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                → View Media
              </a>
              <a
                href={`${TWITTER_URL}/with_replies`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                → View Replies
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-400 p-3 bg-white text-center">
          <div className="text-xs text-gray-500">
            Direct link: <a
              href={TWITTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-mono"
            >
              twitter.com/{TWITTER_HANDLE}
            </a>
          </div>
        </div>
      </div>
    </Window>
  );
}
