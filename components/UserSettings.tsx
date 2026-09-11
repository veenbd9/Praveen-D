import React, { useState } from 'react';

interface UserSettingsProps {
  onClose: () => void;
  onChangePassword: (password: string) => Promise<void>;
}

export const UserSettings: React.FC<UserSettingsProps> = ({ onClose, onChangePassword }) => {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await onChangePassword(password);
      setPassword('');
      setConfirmation('');
      setStatus('Password updated successfully.');
    } catch (changeError: any) {
      setError(changeError.message || 'Unable to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">User Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close user settings">✕</button>
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3">Change password</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="w-full rounded border border-slate-700 bg-slate-950 p-3 text-slate-200" />
          <input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Confirm new password" className="w-full rounded border border-slate-700 bg-slate-950 p-3 text-slate-200" />
          {error && <p className="text-sm text-red-300">{error}</p>}
          {status && <p className="text-sm text-emerald-300">{status}</p>}
          <button type="submit" disabled={saving} className="w-full rounded bg-emerald-600 py-3 font-bold text-white disabled:opacity-50">
            {saving ? 'Updating...' : 'Update password'}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">Use at least 8 characters. Your password is handled by Supabase Auth and is never stored by ScaleupResume.</p>
      </div>
    </div>
  );
};
