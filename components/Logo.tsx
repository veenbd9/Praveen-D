
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 40 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >
        {/* Background Document Shape with Gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" /> {/* Emerald 500 */}
            <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan 500 */}
          </linearGradient>
          
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Main Icon Shape: The "Rocket-Doc" */}
        <path 
          d="M25 20C25 17.2386 27.2386 15 30 15H60L75 30V80C75 82.7614 72.7614 85 70 85H30C27.2386 85 25 82.7614 25 80V20Z" 
          fill="url(#logoGradient)"
        />
        
        {/* White Accent Lines (Simulating Resume Content) */}
        <rect x="35" y="40" width="30" height="4" rx="2" fill="white" fillOpacity="0.8" />
        <rect x="35" y="52" width="20" height="4" rx="2" fill="white" fillOpacity="0.8" />
        <rect x="35" y="64" width="25" height="4" rx="2" fill="white" fillOpacity="0.8" />

        {/* The Rocket Propulsion/Growth Arrow */}
        <path 
          d="M50 10L65 35H35L50 10Z" 
          fill="white" 
          className="animate-pulse"
        />
        
        {/* Glassmorphism Shine */}
        <path 
          d="M30 15H60L35 85H30C27.2386 85 25 82.7614 25 80V20C25 17.2386 27.2386 15 30 15Z" 
          fill="white" 
          fillOpacity="0.1" 
        />
      </svg>
      
      {/* External Glow Ring */}
      <div className="absolute inset-0 rounded-xl border-2 border-emerald-400/20 animate-ping opacity-20"></div>
    </div>
  );
};
