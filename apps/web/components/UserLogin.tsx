'use client';

import { useState } from 'react';
import { createUser } from '../lib/api';
import type { User } from '../lib/types';

interface UserLoginProps {
  onLogin: (user: User) => void;
}

export function UserLogin({ onLogin }: UserLoginProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    try {
      const user = await createUser(username.trim());
      onLogin(user);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join the Chat
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your username to get started
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="sr-only">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter your username"
              disabled={isLoading}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Joining...' : 'Join Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
