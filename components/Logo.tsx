import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 40 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <img
        src="/icon-192.png"
        alt="ScaleupResume"
        width={size}
        height={size}
        className="w-full h-full rounded-xl object-contain drop-shadow-xl"
      />
    </div>
  );
};
