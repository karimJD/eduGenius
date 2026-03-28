'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, GraduationCap, Calendar, Activity,
  BarChart2, FileText, Settings, BookOpen, Building2, ClipboardList, LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clsx } from 'clsx';
import { ModeToggle } from '@/components/mode-toggle';

const navGroups = [
  {
    label: 'Principal',
    items: [
      { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Utilisateurs',
    items: [
      { href: '/admin/users/students', label: 'Étudiants', icon: GraduationCap },
      { href: '/admin/users/teachers', label: 'Enseignants', icon: Users },
    ],
  },
  {
    label: 'Académique',
    items: [
      { href: '/admin/schedules', label: 'Emplois du temps', icon: Calendar },
      { href: '/admin/attendance/live', label: 'Surveillance en direct', icon: Activity },
      { href: '/admin/attendance/reports', label: 'Rapports de présence', icon: BarChart2 },
      { href: '/admin/grades', label: 'Notes', icon: BookOpen },
      { href: '/admin/pv', label: 'Procès-verbal', icon: FileText },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/admin/academic-years', label: 'Années Académiques', icon: Calendar },
      { href: '/admin/subjects', label: 'Matières', icon: BookOpen },
      { href: '/admin/classes', label: 'Classes', icon: Building2 },
      { href: '/admin/departments', label: 'Départements', icon: Building2 },
      { href: '/admin/programs', label: 'Programmes', icon: ClipboardList },
      { href: '/admin/settings', label: 'Paramètres', icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-screen w-64 bg-background/80 backdrop-blur-xl border-r border-border flex flex-col z-40"
    >
      {/* Logo */}
      <div className="p-6 border-b border-border text-center">
        <Link href="/" className="flex items-center justify-center gap-2">
          <GraduationCap className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            EduGenius
          </span>
        </Link>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 block">
          Admin Panel
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative',
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon
                      className={clsx(
                        'w-4 h-4 flex-shrink-0 transition-colors',
                        isActive
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-accent-foreground'
                      )}
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="admin-active-pill"
                        className="absolute left-0 w-1 h-7 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between px-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Apparence
          </span>
          <ModeToggle />
        </div>

        <div className="px-4 py-3 flex items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {user?.firstName?.[0] || 'A'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-foreground truncate">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-muted-foreground truncate w-36">
              {user?.email}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </motion.aside>
  );
}
