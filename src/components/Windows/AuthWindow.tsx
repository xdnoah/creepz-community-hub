import { useState, useEffect } from 'react';
import { Window } from './Window';
import { Input95 } from '../ui/Input95';
import { Button95 } from '../ui/Button95';
import { useAuth } from '../../contexts/AuthContext';
import { validateUsername, validatePassword } from '../../lib/utils';
import type { WindowState } from '../../types';

interface AuthWindowProps {
  window: WindowState;
}

export function AuthWindow({ window }: AuthWindowProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const { signIn, signUp, checkUsernameAvailable } = useAuth();

  // Real-time username availability check for registration
  useEffect(() => {
    if (mode === 'register' && username) {
      const validation = validateUsername(username);
      if (!validation.valid) {
        setUsernameAvailable(null);
        return;
      }

      setCheckingUsername(true);
      const timeout = setTimeout(async () => {
        const available = await checkUsernameAvailable(username);
        setUsernameAvailable(available);
        setCheckingUsername(false);
      }, 500);

      return () => clearTimeout(timeout);
    } else {
      setUsernameAvailable(null);
    }
  }, [username, mode, checkUsernameAvailable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      const result = await signIn(username, password);
      if (result.error) {
        setError(result.error);
      }
    } else {
      // Validation for registration
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        setError(usernameValidation.error || 'Invalid username');
        return;
      }

      if (!usernameAvailable) {
        setError('Username is not available');
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.error || 'Invalid password');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const result = await signUp(username, password);
      if (result.error) {
        setError(result.error);
      }
    }
  };

  const isFormValid = () => {
    if (mode === 'login') {
      return username && password;
    } else {
      const usernameValidation = validateUsername(username);
      const passwordValidation = validatePassword(password);
      return (
        usernameValidation.valid &&
        usernameAvailable === true &&
        passwordValidation.valid &&
        password === confirmPassword &&
        !checkingUsername
      );
    }
  };

  return (
    <Window window={window} canClose={false}>
      <div className="flex flex-col h-full">
        {/* Header with Welcome Message */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white text-center">
          <h1 className="text-2xl font-bold mb-1">🦎 Welcome to Creepz Hub</h1>
          <p className="text-sm opacity-90">
            {mode === 'login'
              ? 'Log in to access your account'
              : 'Create a new account to get started'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b-2 border-gray-300">
          <button
            onClick={() => {
              setMode('login');
              setError('');
              setUsername('');
              setPassword('');
              setConfirmPassword('');
            }}
            className={`flex-1 py-3 px-4 font-bold transition-colors ${
              mode === 'login'
                ? 'bg-blue-500 text-white border-b-4 border-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl">🔐</span>
              <span>LOGIN</span>
              <span className="text-xs opacity-80">Already have an account</span>
            </div>
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError('');
              setUsername('');
              setPassword('');
              setConfirmPassword('');
            }}
            className={`flex-1 py-3 px-4 font-bold transition-colors ${
              mode === 'register'
                ? 'bg-green-500 text-white border-b-4 border-green-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl">✨</span>
              <span>SIGN UP</span>
              <span className="text-xs opacity-80">New user? Start here</span>
            </div>
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {mode === 'register' && (
            <div className="mb-4 bg-green-50 border-2 border-green-500 rounded p-3">
              <p className="text-sm text-green-800">
                <strong>New to Creepz Hub?</strong> Create an account to chat, collect lizards, and battle players!
              </p>
            </div>
          )}

          {mode === 'login' && (
            <div className="mb-4 bg-blue-50 border-2 border-blue-500 rounded p-3">
              <p className="text-sm text-blue-800">
                <strong>Welcome back!</strong> Enter your credentials to continue.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Username */}
          <div className="field-row-stacked">
            <label htmlFor="username" className="text-sm font-bold">
              Username:
            </label>
            <div className="flex items-center gap-2">
              <Input95
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1"
                autoFocus
              />
              {mode === 'register' && username && (
                <span className="text-lg">
                  {checkingUsername ? '⏳' : usernameAvailable === true ? '✓' : usernameAvailable === false ? '✗' : ''}
                </span>
              )}
            </div>
            {mode === 'register' && username && (
              <span className="text-xs text-gray-600">
                3-20 characters, alphanumeric + underscore only
              </span>
            )}
          </div>

          {/* Password */}
          <div className="field-row-stacked">
            <label htmlFor="password" className="text-sm font-bold">
              Password:
            </label>
            <div className="flex items-center gap-2">
              <Input95
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1"
              />
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                id="show-password"
              />
              <label htmlFor="show-password" className="text-xs">
                Show
              </label>
            </div>
            {mode === 'register' && (
              <span className="text-xs text-gray-600">Minimum 6 characters</span>
            )}
          </div>

          {/* Confirm Password (Register only) */}
          {mode === 'register' && (
            <div className="field-row-stacked">
              <label htmlFor="confirm-password" className="text-sm font-bold">
                Confirm Password:
              </label>
              <Input95
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {/* Error Message */}
          {error && <div className="error-text">{error}</div>}

          {/* Submit Button */}
          <Button95 type="submit" disabled={!isFormValid()} variant="primary" className="mt-2">
            {mode === 'login' ? 'Login' : 'Create Account'}
          </Button95>
        </form>
        </div>
      </div>
    </Window>
  );
}
