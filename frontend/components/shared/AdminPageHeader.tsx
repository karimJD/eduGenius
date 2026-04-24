'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface AdminPageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  actions?: ReactNode;
  className?: string;
}

export const AdminPageHeader = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  iconColor = "text-blue-500",
  actions, 
  className 
}: AdminPageHeaderProps) => {
  return (
    <header className={cn(
      "flex justify-between items-center bg-white/50 dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-gray-100 dark:border-white/5 mb-6",
      className
    )}>
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-bold ml-0.5 flex items-center gap-1.5 uppercase tracking-wider">
            {Icon && <Icon size={12} className={cn("fill-current", iconColor)} />}
            {subtitle}
          </div>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </header>
  );
};
