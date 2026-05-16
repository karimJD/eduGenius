import { motion } from 'framer-motion';
import { LucideIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  badgeText?: string;
  badgeClassName?: string;
  backHref?: string;
  titleClassName?: string;
  className?: string;
  actions?: React.ReactNode;
  onBack?: () => void;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  badgeText,
  badgeClassName = "bg-blue-500/10 border-blue-500/20 text-blue-400",
  backHref,
  titleClassName = "text-4xl font-bold text-foreground dark:text-white tracking-tight",
  className,
  actions,
  onBack
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10 mb-8", className)}>
      <div className="flex items-center gap-4">
        {(backHref || onBack) && (
          backHref ? (
            <Link href={backHref} 
              className="p-3 bg-card border border-border rounded-2xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : (
            <button onClick={onBack}
              className="p-3 bg-card border border-border rounded-2xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )
        )}
        <div className="space-y-2">
          {badgeText && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium w-fit",
                badgeClassName
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{badgeText}</span>
            </motion.div>
          )}
          <h1 className={titleClassName}>
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground dark:text-gray-400 max-w-xl">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
