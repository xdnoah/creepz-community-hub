import { useState, useEffect } from 'react';
import { Window } from './Window';
import { Input95 } from '../ui/Input95';
import { Textarea95 } from '../ui/Textarea95';
import { Button95 } from '../ui/Button95';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { formatDate } from '../../lib/utils';
import type { WindowState } from '../../types';

interface MyProfileWindowProps {
  window: WindowState;
}

export function MyProfileWindow({ window }: MyProfileWindowProps) {
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile(user?.id || '');

  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'account'>('profile');

  // Profile fields
  const [age, setAge] = useState<string>('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  // Favorites fields
  const [favoriteSinger, setFavoriteSinger] = useState('');
  const [favoriteShow, setFavoriteShow] = useState('');
  const [favoriteMovie, setFavoriteMovie] = useState('');
  const [favoriteFood, setFavoriteFood] = useState('');
  const [favoriteCountry, setFavoriteCountry] = useState('');
  const [favoriteAnimal, setFavoriteAnimal] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setAge(profile.age?.toString() || '');
      setLocation(profile.location || '');
      setBio(profile.bio || '');
      setFavoriteSinger(profile.favorite_singer || '');
      setFavoriteShow(profile.favorite_show || '');
      setFavoriteMovie(profile.favorite_movie || '');
      setFavoriteFood(profile.favorite_food || '');
      setFavoriteCountry(profile.favorite_country || '');
      setFavoriteAnimal(profile.favorite_animal || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');

    const updates: any = {
      age: age ? parseInt(age) : null,
      location: location || null,
      bio: bio || null,
      favorite_singer: favoriteSinger || null,
      favorite_show: favoriteShow || null,
      favorite_movie: favoriteMovie || null,
      favorite_food: favoriteFood || null,
      favorite_country: favoriteCountry || null,
      favorite_animal: favoriteAnimal || null,
    };

    const result = await updateProfile(updates);

    if (result.error) {
      setSaveMessage('Error: ' + result.error);
    } else {
      setSaveMessage('✓ Profile updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    }

    setSaving(false);
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

  return (
    <Window window={window}>
      <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 border-b-2 border-gray-400">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-4xl border-4 border-white shadow-xl">
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
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-gray-400 bg-white">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-4 py-2 font-bold text-sm border-r border-gray-400 ${
              activeTab === 'profile'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            👤 Profile
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 px-4 py-2 font-bold text-sm border-r border-gray-400 ${
              activeTab === 'favorites'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            ⭐ Favorites
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 px-4 py-2 font-bold text-sm ${
              activeTab === 'account'
                ? 'bg-pink-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            ⚙️ Account
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-blue-200">
                <div className="text-lg font-bold mb-3 text-blue-700 flex items-center gap-2">
                  <span>📝</span> About Me
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">Age</label>
                    <Input95
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="How old are you?"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">📍 Location</label>
                    <Input95
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Where are you from?"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">✍️ Bio</label>
                    <Textarea95
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full resize-none"
                      maxLength={500}
                    />
                    <div className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-purple-200">
                <div className="text-lg font-bold mb-3 text-purple-700 flex items-center gap-2">
                  <span>🎵</span> Entertainment
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">🎤 Favorite Singer/Band</label>
                    <Input95
                      type="text"
                      value={favoriteSinger}
                      onChange={(e) => setFavoriteSinger(e.target.value)}
                      placeholder="Who's your favorite artist?"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">📺 Favorite TV Show</label>
                    <Input95
                      type="text"
                      value={favoriteShow}
                      onChange={(e) => setFavoriteShow(e.target.value)}
                      placeholder="What show do you love?"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">🎬 Favorite Movie</label>
                    <Input95
                      type="text"
                      value={favoriteMovie}
                      onChange={(e) => setFavoriteMovie(e.target.value)}
                      placeholder="Best movie ever?"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-pink-200">
                <div className="text-lg font-bold mb-3 text-pink-700 flex items-center gap-2">
                  <span>🌍</span> Life & Preferences
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">🍕 Favorite Food</label>
                    <Input95
                      type="text"
                      value={favoriteFood}
                      onChange={(e) => setFavoriteFood(e.target.value)}
                      placeholder="What's your favorite food?"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">✈️ Best Country Visited</label>
                    <Input95
                      type="text"
                      value={favoriteCountry}
                      onChange={(e) => setFavoriteCountry(e.target.value)}
                      placeholder="Where was your best trip?"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1">🐾 Favorite Animal</label>
                    <Input95
                      type="text"
                      value={favoriteAnimal}
                      onChange={(e) => setFavoriteAnimal(e.target.value)}
                      placeholder="What's your favorite animal?"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-red-200">
                <div className="text-lg font-bold mb-3 text-red-700 flex items-center gap-2">
                  <span>🔐</span> Account Settings
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded border border-gray-300">
                    <div className="text-sm font-bold text-gray-700">Username</div>
                    <div className="text-lg font-bold text-blue-600">{profile.username}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Contact support to change your username
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded border border-gray-300">
                    <div className="text-sm font-bold text-gray-700">User ID</div>
                    <div className="text-xs font-mono text-gray-600">{profile.id}</div>
                  </div>

                  <div className="p-3 bg-yellow-50 rounded border border-yellow-300">
                    <div className="text-sm font-bold text-yellow-800 mb-2">⚠️ Danger Zone</div>
                    <Button95
                      onClick={signOut}
                      className="bg-red-500 text-white hover:bg-red-600 w-full"
                    >
                      🚪 Sign Out
                    </Button95>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        {(activeTab === 'profile' || activeTab === 'favorites') && (
          <div className="border-t-2 border-gray-400 p-3 bg-white">
            {saveMessage && (
              <div className={`text-sm mb-2 p-2 rounded ${
                saveMessage.includes('Error')
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-green-100 text-green-700 border border-green-300'
              }`}>
                {saveMessage}
              </div>
            )}
            <Button95
              onClick={handleSave}
              disabled={saving}
              className="w-full font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            >
              {saving ? '💾 Saving...' : '💾 Save Changes'}
            </Button95>
          </div>
        )}
      </div>
    </Window>
  );
}
