'use client';

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Stat {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}

interface TeacherPageHeaderProps {
  title: string;
  subtitle?: string;
  category?: string;
  icon?: LucideIcon;
  stats?: Stat[];
  actions?: ReactNode;
  className?: string;
}

export function TeacherPageHeader({
  title,
  subtitle,
  category,
  icon: Icon,
  stats,
  actions,
  className
}: TeacherPageHeaderProps) {
  return (
    <header className={cn("flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12", className)}>
      <div className="space-y-4">
        {(category || Icon) && (
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm shadow-primary/5">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            )}
            {category && (
              <div className="px-3 py-1 rounded-full bg-secondary border border-border">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">{category}</span>
              </div>
            )}
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-[1.1]">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground max-w-2xl text-base md:text-lg font-medium leading-relaxed opacity-80">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
        {stats && stats.length > 0 && (
          <div className="flex items-center bg-card/40 backdrop-blur-xl border border-border/60 p-1.5 rounded-3xl shadow-xl shadow-black/5 ring-1 ring-border/20">
            {stats.map((stat, i) => (
              <div 
                key={stat.label} 
                className={cn(
                  "px-6 py-3 flex flex-col items-center justify-center transition-all hover:bg-primary/5 rounded-2xl group",
                  i < stats.length - 1 && "relative after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-px after:bg-border/60"
                )}
              >
                <div className="flex items-center gap-2">
                  {stat.icon && (
                    <stat.icon className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                  )}
                  <p className="text-2xl md:text-3xl font-black text-foreground tabular-nums tracking-tighter group-hover:text-primary transition-colors">
                    {stat.value}
                  </p>
                </div>
                <p className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em] mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}
        {actions && (
          <div className="flex items-center gap-3 bg-secondary/50 p-1.5 rounded-3xl border border-border/40">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
