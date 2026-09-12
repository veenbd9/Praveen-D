import React, { useEffect, useState } from 'react';
import ComingSoon from './ComingSoon';

const STORAGE_KEY = 'scaleupresume_preview_access';

// Set SITE_LAUNCHED=true (Vercel env var) to permanently open the site to
// everyone on launch day. Until then, only visitors with the correct
// ?access=<PREVIEW_ACCESS_CODE> query param (or an existing bypass saved in
// this browser) can reach the real application.
const SITE_LAUNCHED = process.env.SITE_LAUNCHED === 'true';
const PREVIEW_ACCESS_CODE = process.env.PREVIEW_ACCESS_CODE || 'scaleup-preview-2025';

function hasStoredBypass(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'granted';
  } catch {
    return false;
  }
}

function checkAndConsumeUrlAccessCode(): boolean {
  try {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('access');
    if (code && code === PREVIEW_ACCESS_CODE) {
      localStorage.setItem(STORAGE_KEY, 'granted');
      // Strip the access code from the visible URL/history without reloading.
      url.searchParams.delete('access');
      window.history.replaceState({}, '', url.toString());
      return true;
    }
  } catch {
    // Ignore malformed URLs / storage access issues and fall through to Coming Soon.
  }
  return false;
}

interface ComingSoonGateProps {
  children: React.ReactNode;
}

export const ComingSoonGate: React.FC<ComingSoonGateProps> = ({ children }) => {
  const [unlocked, setUnlocked] = useState<boolean>(() => SITE_LAUNCHED || hasStoredBypass());

  useEffect(() => {
    if (!unlocked && checkAndConsumeUrlAccessCode()) {
      setUnlocked(true);
    }
    // Only needs to run once on mount to inspect the initial URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!unlocked) {
    return <ComingSoon />;
  }

  return <>{children}</>;
};

export default ComingSoonGate;
