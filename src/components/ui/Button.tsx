import React from 'react';
import type { LucideIcon } from 'lucide-react'; 

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent | React.FormEvent) => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
  className?: string;
  icon?: LucideIcon;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, type = "button", disabled = false }: ButtonProps) => {
  const variants: any = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:bg-blue-300",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm",
    danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
  };
  return (
    <button 
      type={type} onClick={onClick} disabled={disabled}
      className={`px-4 md:px-5 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm md:text-base whitespace-nowrap ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} className="shrink-0" />} {children}
    </button>
  );
};