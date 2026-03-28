'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CheckSquare,
  Users,
  Megaphone,
  MessageSquare,
  Video,
  LogOut,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';
import { ModeToggle } from '@/components/mode-toggle';

const teacherLinks = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { href: '/teacher/classes', label: 'My Classes', icon: GraduationCap, group: 'Teaching' },
  { href: '/teacher/schedule', label: 'Emploi du temps', icon: Calendar, group: 'Teaching' },
  { href: '/teacher/courses', label: 'Course Materials', icon: BookOpen, group: 'Teaching' },
  { href: '/teacher/quizzes', label: 'Quizzes', icon: ClipboardList, group: 'Assessments' },
  { href: '/teacher/grading', label: 'Grading', icon: CheckSquare, group: 'Assessments' },
  { href: '/teacher/attendance', label: 'Attendance', icon: Users, group: 'Classes' },
  { href: '/teacher/announcements', label: 'Announcements', icon: Megaphone, group: 'Classes' },
  { href: '/teacher/messages', label: 'Messages', icon: MessageSquare, group: 'Communication' },
  { href: '/teacher/sessions', label: 'Live Sessions', icon: Video, group: 'Communication' },
];

const groups = ['Overview', 'Teaching', 'Assessments', 'Classes', 'Communication'];

export function TeacherSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-40 overflow-y-auto">
      {/* Logo */}
      <div className="p-5 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-bold text-sm text-foreground">EduGenius</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Teacher Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-6">
        {groups.map((group) => {
          const groupLinks = teacherLinks.filter((l) => l.group === group);
          return (
            <div key={group}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                {group}
              </p>
              <div className="space-y-1">
                {groupLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative text-sm font-medium',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{link.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="teacher-active-pill"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                        />
                      )}
                      {!isActive && (
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Apparence
          </span>
          <ModeToggle />
        </div>

        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.firstName?.[0] || 'T'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
