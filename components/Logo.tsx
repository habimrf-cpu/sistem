import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Tire Tread (Outer Ring) */}
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" className="text-blue-500" />
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" className="text-slate-900" strokeDasharray="10 4" />
      
      {/* Tire Sidewall */}
      <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="18" className="text-slate-700" />
      
      {/* Rim */}
      <circle cx="50" cy="50" r="15" fill="currentColor" className="text-slate-400" />
      <circle cx="50" cy="50" r="6" fill="currentColor" className="text-slate-800" />
      
      {/* Lug Nuts */}
      <circle cx="50" cy="30" r="2" fill="currentColor" className="text-slate-300" />
      <circle cx="69" cy="40" r="2" fill="currentColor" className="text-slate-300" />
      <circle cx="69" cy="60" r="2" fill="currentColor" className="text-slate-300" />
      <circle cx="50" cy="70" r="2" fill="currentColor" className="text-slate-300" />
      <circle cx="31" cy="60" r="2" fill="currentColor" className="text-slate-300" />
      <circle cx="31" cy="40" r="2" fill="currentColor" className="text-slate-300" />
    </svg>
  );
};