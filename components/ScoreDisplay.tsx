
import React from 'react';

interface ScoreDisplayProps {
  score: number;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getStrokeColor = (score: number) => {
    if (score >= 90) return 'stroke-green-400';
    if (score >= 70) return 'stroke-yellow-400';
    return 'stroke-red-400';
  };

  const strokeColor = getStrokeColor(score);

  return (
    <div className="relative flex items-center justify-center w-32 h-32 flex-shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
        <circle
          className="text-slate-700"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className={`${strokeColor} transition-all duration-1000 ease-out`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
      </svg>
      <span className="absolute text-3xl font-bold text-slate-200">
        {score}
        <span className="text-xl">%</span>
      </span>
    </div>
  );
};
