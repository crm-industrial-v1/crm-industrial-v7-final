import type { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  subtitle?: string;
}

export const SectionHeader = ({ title, icon: Icon, subtitle }: SectionHeaderProps) => (
  <div className="mt-6 md:mt-8 mb-4 md:mb-6 border-b border-slate-200 pb-3 w-full">
    <div className="flex items-center gap-3 text-slate-800">
      <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
        {Icon && <Icon size={22} className="md:w-6 md:h-6" />}
      </div>
      <div className="min-w-0">
        <h3 className="text-lg md:text-xl font-bold uppercase tracking-tight truncate">{title}</h3>
        {subtitle && <p className="text-xs md:text-sm text-slate-500 font-normal normal-case mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  </div>
);