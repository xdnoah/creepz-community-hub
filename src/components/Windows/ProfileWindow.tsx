import { useState, useEffect } from 'react';
import { Window } from './Window';
import { useProfile } from '../../hooks/useProfile';
import { formatDate } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useWindowManager } from '../../contexts/WindowContext';
import type { WindowState } from '../../types';

interface ProfileWindowProps {
  window: WindowState;
}

export function ProfileWindow({ window }: ProfileWindowProps) {
  const userId = window.data?.userId;
  const { profile, loading } = useProfile(userId);
  const { user } = useAuth();
  const { openWindow } = useWindowManager();
  const [hasLizard, setHasLizard] = useState(false);

  // Check if this user has a lizard
  useEffect(() => {
    async function checkLizard() {
      if (!userId) return;

      const { data, error } = await supabase
        .from('lizards')
        .select('id')
        .eq('id', userId)
        .single();

      setHasLizard(!!data && !error);
    }

    checkLizard();
  }, [userId]);

  const handleStartFight = () => {
    if (!user?.id || !userId || user.id === userId) return;

    openWindow('lizardFight', {
      attacker: user.id,
      defender: userId,
    });
  };

  if (loading) {
    return (
      <Window window={window}>
        <div className="flex items-center justify-center h-full bg-white">
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </Window>
    );
  }

  if (!profile) {
    return (
      <Window window={window}>
        <div className="flex items-center justify-center h-full bg-white">
          <div className="text-red-600">Profile not found</div>
        </div>
      </Window>
    );
  }

  const memberSince = formatDate(profile.created_at);

  // Check if user has filled out any favorites
  const hasFavorites = profile.favorite_singer || profile.favorite_show ||
    profile.favorite_movie || profile.favorite_food ||
    profile.favorite_country || profile.favorite_animal;

  // Check if user has basic profile info
  const hasBasicInfo = profile.age || profile.location || profile.bio;

  return (
    <Window window={window}>
      <div className="flex flex-col h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-y-auto">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 border-b-2 border-gray-400">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-4xl border-4 border-white shadow-xl">
              {profile.username[0].toUpperCase()}
            </div>
            {/* User Info */}
            <div className="flex-1">
              <div className="text-2xl font-bold text-white mb-1">{profile.username}</div>
              <div className="text-sm text-white opacity-90">Member since {memberSince}</div>
              <div className="flex gap-2 mt-2">
                <div className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs text-white">
                  📅 Joined {memberSince}
                </div>
                {profile.location && (
                  <div className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs text-white">
                    📍 {profile.location}
                  </div>
                )}
                {profile.age && (
                  <div className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs text-white">
                    🎂 {profile.age}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* About Section */}
          {hasBasicInfo && (
            <div className="bg-white p-4 rounded-lg shadow-md border-2 border-indigo-200">
              <div className="text-lg font-bold mb-3 text-indigo-700 flex items-center gap-2">
                <span>👤</span> About
              </div>

              <div className="space-y-3">
                {profile.age && (
                  <div className="p-2 bg-indigo-50 rounded">
                    <div className="text-xs font-bold text-gray-600 mb-1">Age</div>
                    <div className="text-sm font-semibold text-indigo-900">{profile.age} years old</div>
                  </div>
                )}

                {profile.location && (
                  <div className="p-2 bg-purple-50 rounded">
                    <div className="text-xs font-bold text-gray-600 mb-1">📍 Location</div>
                    <div className="text-sm font-semibold text-purple-900">{profile.location}</div>
                  </div>
                )}

                {profile.bio && (
                  <div className="p-3 bg-pink-50 rounded">
                    <div className="text-xs font-bold text-gray-600 mb-1">✍️ Bio</div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{profile.bio}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Favorites Section */}
          {hasFavorites && (
            <>
              {/* Entertainment Favorites */}
              {(profile.favorite_singer || profile.favorite_show || profile.favorite_movie) && (
                <div className="bg-white p-4 rounded-lg shadow-md border-2 border-purple-200">
                  <div className="text-lg font-bold mb-3 text-purple-700 flex items-center gap-2">
                    <span>🎵</span> Entertainment
                  </div>

                  <div className="space-y-2">
                    {profile.favorite_singer && (
                      <div className="p-2 bg-purple-50 rounded">
                        <div className="text-xs font-bold text-gray-600 mb-1">🎤 Favorite Singer/Band</div>
                        <div className="text-sm font-semibold text-purple-900">{profile.favorite_singer}</div>
                      </div>
                    )}

                    {profile.favorite_show && (
                      <div className="p-2 bg-purple-50 rounded">
                        <div className="text-xs font-bold text-gray-600 mb-1">📺 Favorite TV Show</div>
                        <div className="text-sm font-semibold text-purple-900">{profile.favorite_show}</div>
                      </div>
                    )}

                    {profile.favorite_movie && (
                      <div className="p-2 bg-purple-50 rounded">
                        <div className="text-xs font-bold text-gray-600 mb-1">🎬 Favorite Movie</div>
                        <div className="text-sm font-semibold text-purple-900">{profile.favorite_movie}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Life & Preferences */}
              {(profile.favorite_food || profile.favorite_country || profile.favorite_animal) && (
                <div className="bg-white p-4 rounded-lg shadow-md border-2 border-pink-200">
                  <div className="text-lg font-bold mb-3 text-pink-700 flex items-center gap-2">
                    <span>🌍</span> Life & Preferences
                  </div>

                  <div className="space-y-2">
                    {profile.favorite_food && (
                      <div className="p-2 bg-pink-50 rounded">
                        <div className="text-xs font-bold text-gray-600 mb-1">🍕 Favorite Food</div>
                        <div className="text-sm font-semibold text-pink-900">{profile.favorite_food}</div>
                      </div>
                    )}

                    {profile.favorite_country && (
                      <div className="p-2 bg-pink-50 rounded">
                        <div className="text-xs font-bold text-gray-600 mb-1">✈️ Best Country Visited</div>
                        <div className="text-sm font-semibold text-pink-900">{profile.favorite_country}</div>
                      </div>
                    )}

                    {profile.favorite_animal && (
                      <div className="p-2 bg-pink-50 rounded">
                        <div className="text-xs font-bold text-gray-600 mb-1">🐾 Favorite Animal</div>
                        <div className="text-sm font-semibold text-pink-900">{profile.favorite_animal}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!hasBasicInfo && !hasFavorites && (
            <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-300 text-center">
              <div className="text-4xl mb-2">👤</div>
              <div className="text-gray-600 font-semibold">
                {profile.username} hasn't filled out their profile yet
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Check back later to learn more about them!
              </div>
            </div>
          )}

          {/* Username History */}
          {profile.username_history && profile.username_history.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-md border-2 border-gray-300">
              <details className="cursor-pointer">
                <summary className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <span>📜</span> Username History ({profile.username_history.length})
                </summary>
                <div className="mt-3 space-y-2">
                  {profile.username_history.map((history) => (
                    <div key={history.id} className="p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="text-xs text-gray-500">{formatDate(history.changed_at)}</div>
                      <div className="text-sm font-semibold">
                        <span className="line-through text-gray-400">{history.old_username}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="text-gray-900">{history.new_username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Fight Button */}
        {hasLizard && user && user.id !== userId && (
          <div className="border-t-2 border-gray-400 p-3 bg-gradient-to-r from-red-50 to-orange-50">
            <button
              onClick={handleStartFight}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span className="text-xl">⚔️</span>
              <span>Challenge to Lizard Fight!</span>
              <span className="text-xl">🦎</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-gray-400 p-2 bg-white">
          <div className="text-xs text-center text-gray-500">
            Viewing {profile.username}'s profile
          </div>
        </div>
      </div>
    </Window>
  );
}
