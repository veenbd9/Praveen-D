import React from 'react';

/**
 * Public-facing "Coming Soon" page shown to all visitors before official
 * launch. The app itself (Auth / dashboard / optimizer, etc.) is only
 * reachable by appending a one-time secret access code to the URL, e.g.
 * https://scaleupresume.com/?access=<PREVIEW_ACCESS_CODE>
 * Once granted, the bypass is remembered in this browser via localStorage.
 */
export const ComingSoon: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-6 text-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <img
        src="/icon-192.png"
        alt="ScaleupResume"
        className="w-28 h-28 rounded-2xl shadow-2xl shadow-cyan-500/20 mb-8 relative"
      />

      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight relative">
        ScaleupResume
      </h1>
      <p className="mt-4 text-lg sm:text-2xl font-semibold text-cyan-300 relative">
        🚀 Coming Soon
      </p>
      <p className="mt-4 max-w-md text-slate-400 relative">
        We're putting the finishing touches on your AI-powered resume optimizer,
        job search, and career copilot. Launch is right around the corner —
        stay tuned!
      </p>

      <div className="mt-10 text-sm text-slate-500 relative">
        Questions? Reach us at{' '}
        <a href="mailto:hello@scaleupresume.com" className="text-cyan-400 hover:underline">
          hello@scaleupresume.com
        </a>
      </div>
    </div>
  );
};

export default ComingSoon;
