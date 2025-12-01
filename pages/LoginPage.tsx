import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string, password?: string) => void;
  onSwitchToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = email && password;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            ATS Resume Optimizer I
          </h1>
          <p className="mt-2 text-md text-slate-400">
            Log in to continue your journey to a perfect resume.
          </p>
        </div>

        <div className="bg-slate-800/50 p-8 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">
                Email Address / Login ID
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com or Test1"
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-300 placeholder-slate-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-300 placeholder-slate-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-50"
            >
              Log In
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Don't have an account?{' '}
            <button onClick={onSwitchToSignup} className="font-semibold text-indigo-400 hover:text-indigo-300">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;