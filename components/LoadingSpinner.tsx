
import React from 'react';
import { BrainCircuitIcon } from './icons';

const LoadingSpinner: React.FC<{text?: string}> = ({text = "Analyzing trends..."}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-400">
      <BrainCircuitIcon className="h-12 w-12 text-blue-500 animate-pulse" />
      <p className="mt-4 text-lg font-medium">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
