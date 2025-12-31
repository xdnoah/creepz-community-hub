import { useState, useEffect } from 'react';
import { Window } from './Window';
import { Input95 } from '../ui/Input95';
import { Textarea95 } from '../ui/Textarea95';
import { Button95 } from '../ui/Button95';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { formatDate, debounce, validateUsername, validatePassword } from '../../lib/utils';
import type { WindowState } from '../../types';

interface MyProfileWindowProps {
  window: WindowState;
}

export function MyProfileWindow({ window }: MyProfileWindowProps) {
  const { user, signOut, checkUsernameAvailable } = useAuth();
  const { profile, loading, updateProfile, changeUsername, changePassword } = useProfile(user?.id || '');

  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');

  const [age, setAge] = useState<string>('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [newUsername, setNewUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');
  const [changingUsername, setChangingUsername] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setAge(profile.age?.toString() || '');
      setLocation(profile.location || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  // Check username availability
  useEffect(() => {
    if (newUsername && newUsername !== profile?.username) {
      const validation = validateUsername(newUsername);
      if (!validation.valid) {
        setUsernameAvailable(null);
        return;
      }

      const timeout = setTimeout(async () => {
        const available = await checkUsernameAvailable(newUsername);
        setUsernameAvailable(available);
      }, 500);

      return () => clearTimeout(timeout);
    } else {
      setUsernameAvailable(null);
    }
  }, [newUsername, profile?.username, checkUsernameAvailable]);

  // Auto-save profile fields with debounce
  useEffect(() => {
    if (!profile) return;

    const hasChanges =
      age !== (profile.age?.toString() || '') ||
      location !== (profile.location || '') ||
      bio !== (profile.bio || '');

    if (hasChanges) {
      setSaveStatus('saving');
      const debouncedSave = debounce(async () => {
        await updateProfile({
          age: age ? parseInt(age) : undefined,
          location: location || undefined,
          bio: bio || undefined,
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 500);

      debouncedSave();
    }
  }, [age, location, bio]);

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');

    const validation = validateUsername(newUsername);
    if (!validation.valid) {
      setUsernameError(validation.error || 'Invalid username');
      return;
    }

    if (!usernameAvailable) {
      setUsernameError('Username is not available');
      return;
    }

    setChangingUsername(true);
    const result = await changeUsername(newUsername, usernamePassword);
    setChangingUsername(false);

    if (result.error) {
      setUsernameError(result.error);
    } else {
      setNewUsername('');
      setUsernamePassword('');
      setUsernameAvailable(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setPasswordError(validation.error || 'Invalid password');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setChangingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setChangingPassword(false);

    if (result.error) {
      setPasswordError(result.error);
    } else {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  if (loading || !profile) {
    return (
      <Window window={window}>
        <div className="flex items-center justify-center h-full">
          <div>Loading profile...</div>
        </div>
      </Window>
    );
  }

  return (
    <Window window={window}>
      <div className="flex flex-col h-full">
        {/* Header with username and member info */}
        <div className="bg-gray-200 p-3 border-b-2 border-gray-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold">{profile.username}</div>
              <div className="text-xs text-gray-600">
                Member since {formatDate(profile.created_at)}
              </div>
            </div>
            {saveStatus !== 'idle' && (
              <div className={`text-sm font-bold ${saveStatus === 'saving' ? 'text-blue-600' : 'text-green-600'}`}>
                {saveStatus === 'saving' ? '💾 Saving...' : '✓ Saved'}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-gray-400">
          <button
            className={`px-4 py-2 font-bold ${
              activeTab === 'profile'
                ? 'bg-white border-t-2 border-l-2 border-r-2 border-gray-400 -mb-0.5'
                : 'bg-gray-200'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            📝 Profile
          </button>
          <button
            className={`px-4 py-2 font-bold ${
              activeTab === 'account'
                ? 'bg-white border-t-2 border-l-2 border-r-2 border-gray-400 -mb-0.5'
                : 'bg-gray-200'
            }`}
            onClick={() => setActiveTab('account')}
          >
            🔐 Account
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-4">
              <div className="field-row-stacked">
                <label className="font-bold text-sm">Age:</label>
                <Input95
                  type="number"
                  min="1"
                  max="150"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Not specified"
                />
              </div>

              <div className="field-row-stacked">
                <label className="font-bold text-sm">Location:</label>
                <Input95
                  type="text"
                  maxLength={50}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Not specified"
                />
              </div>

              <div className="field-row-stacked">
                <label className="font-bold text-sm">Bio:</label>
                <Textarea95
                  maxLength={280}
                  rows={6}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                />
                <div className="text-xs text-gray-600 text-right">{bio.length}/280 characters</div>
              </div>

              <div className="text-xs text-gray-600 bg-blue-50 border-2 border-blue-400 p-2">
                💡 <strong>Tip:</strong> Your profile information is saved automatically as you type!
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="flex flex-col gap-4">
              {/* Change Username Section */}
              <div className="bg-gray-100 border-2 border-gray-400 p-3">
                <h3 className="font-bold mb-3 text-sm border-b border-gray-400 pb-1">
                  Change Username
                </h3>
                <form onSubmit={handleChangeUsername} className="flex flex-col gap-3">
                  <div className="field-row-stacked">
                    <label className="text-sm">New Username:</label>
                    <div className="flex items-center gap-2">
                      <Input95
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder={profile.username}
                        className="flex-1"
                      />
                      {newUsername && newUsername !== profile.username && (
                        <span className="text-2xl">
                          {usernameAvailable === true ? '✅' : usernameAvailable === false ? '❌' : '⏳'}
                        </span>
                      )}
                    </div>
                    {newUsername && usernameAvailable === false && (
                      <div className="text-xs text-red-600">Username already taken</div>
                    )}
                  </div>

                  <div className="field-row-stacked">
                    <label className="text-sm">Confirm with Password:</label>
                    <Input95
                      type="password"
                      value={usernamePassword}
                      onChange={(e) => setUsernamePassword(e.target.value)}
                      placeholder="Enter your current password"
                    />
                  </div>

                  {usernameError && (
                    <div className="bg-red-100 border-2 border-red-600 p-2 text-sm text-red-700">
                      ⚠️ {usernameError}
                    </div>
                  )}

                  <Button95
                    type="submit"
                    disabled={!newUsername || !usernamePassword || !usernameAvailable || changingUsername}
                  >
                    {changingUsername ? '⏳ Changing...' : '✏️ Change Username'}
                  </Button95>
                </form>

                {/* Username History */}
                {profile.username_history && profile.username_history.length > 0 && (
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer text-gray-600 hover:text-black">
                      📜 Username History ({profile.username_history.length} changes)
                    </summary>
                    <div className="mt-2 ml-4 space-y-1 max-h-24 overflow-y-auto">
                      {profile.username_history.map((history) => (
                        <div key={history.id} className="text-xs">
                          <span className="text-gray-500">{formatDate(history.changed_at)}:</span>{' '}
                          <span className="line-through opacity-60">{history.old_username}</span> →{' '}
                          <span className="font-bold">{history.new_username}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              {/* Change Password Section */}
              <div className="bg-gray-100 border-2 border-gray-400 p-3">
                <h3 className="font-bold mb-3 text-sm border-b border-gray-400 pb-1">
                  Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                  <div className="field-row-stacked">
                    <label className="text-sm">Current Password:</label>
                    <Input95
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="field-row-stacked">
                    <label className="text-sm">New Password:</label>
                    <Input95
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <div className="field-row-stacked">
                    <label className="text-sm">Confirm New Password:</label>
                    <Input95
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                  </div>

                  {passwordError && (
                    <div className="bg-red-100 border-2 border-red-600 p-2 text-sm text-red-700">
                      ⚠️ {passwordError}
                    </div>
                  )}

                  <Button95
                    type="submit"
                    disabled={!currentPassword || !newPassword || !confirmNewPassword || changingPassword}
                  >
                    {changingPassword ? '⏳ Updating...' : '🔒 Update Password'}
                  </Button95>
                </form>
              </div>

              {/* Logout Section */}
              <div className="bg-red-50 border-2 border-red-400 p-3">
                <h3 className="font-bold mb-2 text-sm">Logout</h3>
                <p className="text-xs text-gray-700 mb-3">
                  Sign out of your account on this device.
                </p>
                <Button95 onClick={signOut} className="w-full bg-red-100">
                  🚪 Logout
                </Button95>
              </div>
            </div>
          )}
        </div>
      </div>
    </Window>
  );
}
