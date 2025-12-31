import { Window } from './Window';
import { useProfile } from '../../hooks/useProfile';
import { formatDate } from '../../lib/utils';
import type { WindowState } from '../../types';

interface ProfileWindowProps {
  window: WindowState;
}

export function ProfileWindow({ window }: ProfileWindowProps) {
  const userId = window.data?.userId;
  const { profile, loading } = useProfile(userId);

  if (loading) {
    return (
      <Window window={window}>
        <div className="flex items-center justify-center h-full">
          <div>Loading profile...</div>
        </div>
      </Window>
    );
  }

  if (!profile) {
    return (
      <Window window={window}>
        <div className="flex items-center justify-center h-full">
          <div>Profile not found</div>
        </div>
      </Window>
    );
  }

  return (
    <Window window={window}>
      <div className="flex flex-col gap-4">
        {/* Username */}
        <div>
          <div className="text-2xl font-bold mb-2">{profile.username}</div>
        </div>

        {/* Basic Info */}
        <div className="field-row-stacked">
          <label className="font-bold text-sm">Age:</label>
          <div className="text-sm">{profile.age || 'Not specified'}</div>
        </div>

        <div className="field-row-stacked">
          <label className="font-bold text-sm">Location:</label>
          <div className="text-sm">{profile.location || 'Not specified'}</div>
        </div>

        <div className="field-row-stacked">
          <label className="font-bold text-sm">Bio:</label>
          <div className="text-sm whitespace-pre-wrap">
            {profile.bio || 'No bio provided'}
          </div>
        </div>

        <div className="field-row-stacked">
          <label className="font-bold text-sm">Member Since:</label>
          <div className="text-sm">{formatDate(profile.created_at)}</div>
        </div>

        {/* Username History */}
        {profile.username_history && profile.username_history.length > 0 && (
          <div className="field-row-stacked">
            <details>
              <summary className="font-bold text-sm cursor-pointer">
                Username History ({profile.username_history.length})
              </summary>
              <div className="mt-2 ml-4 space-y-1">
                {profile.username_history.map((history) => (
                  <div key={history.id} className="text-xs">
                    <span className="text-gray-600">{formatDate(history.changed_at)}:</span>{' '}
                    <span className="line-through">{history.old_username}</span> →{' '}
                    <span>{history.new_username}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </Window>
  );
}
