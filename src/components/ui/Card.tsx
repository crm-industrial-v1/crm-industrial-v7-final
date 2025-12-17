import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = "" }: CardProps) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 w-full ${className}`}>
    {children}
  </div>
);