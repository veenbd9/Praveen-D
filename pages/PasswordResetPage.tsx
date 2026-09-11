import React, { useState } from 'react';

interface PasswordResetPageProps {
  onUpdatePassword: (password: string) => Promise<void>;
  onComplete: () => Promise<void>;
}

export const PasswordResetPage: React.FC<PasswordResetPageProps> = ({ onUpdatePassword, onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Password must contain at least 8 characters.');
    if (password !== confirmation) return setError('Passwords do not match.');
    setSaving(true);
    try {
      await onUpdatePassword(password);
      await onComplete();
    } catch (resetError: any) {
      setError(resetError.message || 'Unable to reset password.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-8 shadow-2xl space-y-4">
        <h1 className="text-2xl font-bold text-white">Set a new password</h1>
        <p className="text-sm text-slate-400">Choose a new password for your ScaleupResume account.</p>
        <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="w-full rounded border border-slate-700 bg-slate-950 p-3 text-white" required />
        <input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Confirm new password" className="w-full rounded border border-slate-700 bg-slate-950 p-3 text-white" required />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={saving} className="w-full rounded bg-emerald-600 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Updating...' : 'Update password'}</button>
      </form>
    </div>
  );
};
