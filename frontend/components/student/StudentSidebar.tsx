'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BrainCircuit,
  FileSpreadsheet,
  TrendingUp,
  Bell,
  MessageSquare,
  Calendar,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  Swords,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ModeToggle } from '../mode-toggle';
import api from '../../lib/axios';

const navigation = [
  { name: 'Vue d\'ensemble', href: '/student/dashboard', icon: LayoutDashboard },
  { name: 'Cours & Matériels', href: '/student/courses', icon: BookOpen },
  { name: 'Arena', href: '/student/arena', icon: Swords },
  { name: 'Outils IA', href: '/student/ai', icon: BrainCircuit },
  { name: 'Évaluations', href: '/student/assessments', icon: FileSpreadsheet },
  { name: 'Ma Performance', href: '/student/performance', icon: TrendingUp },
  { name: 'Annonces', href: '/student/announcements', icon: Bell },
  { name: 'Messages', href: '/student/messages', icon: MessageSquare },
  { name: 'Emploi du temps', href: '/student/schedule', icon: Calendar },
  { name: 'Profil & Paramètres', href: '/student/profile', icon: Settings },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [classId, setClassId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'student') {
      api.get('/student/courses').then(res => {
        if (res.data.success && res.data.data.length > 0) {
          setClassId(res.data.data[0]._id);
        }
      }).catch(console.error);
    }
  }, [user]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-card dark:bg-[#111111] text-foreground dark:text-white border border-border dark:border-[#333333]"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar Content */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card dark:bg-[#0a0a0a] border-r border-border dark:border-[#1f1f1f] text-gray-600 dark:text-gray-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo area */}
        <div className="flex items-center justify-center h-16 border-b border-border dark:border-[#1f1f1f] bg-background/50 dark:bg-black/20">
          <Link href="/student/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <BookOpen className="w-5 h-5 text-foreground dark:text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              EduGenius
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
          <nav className="space-y-1">
            <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground dark:text-gray-500 uppercase tracking-wider">
              Espace Élève
            </div>
            {navigation.map((item) => {
              const targetHref = (item.name === 'Cours & Matériels' && classId)
                ? `/student/courses/${classId}`
                : item.href;
              const isActive = pathname === targetHref || pathname.startsWith(targetHref + '/');
              return (
                <Link
                  key={item.name}
                  href={targetHref}
                  className={cn(
                    "group flex flex-col px-3 py-2 text-sm font-medium rounded-xl relative transition-all duration-200",
                    isActive 
                      ? "text-foreground dark:text-white bg-indigo-500/10 border border-indigo-500/20" 
                      : "text-muted-foreground dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-muted dark:hover:bg-[#1a1a1a]"
                  )}
                >
                  <div className="flex items-center w-full">
                    <item.icon
                      className={cn(
                        "flex-shrink-0 h-5 w-5 mr-3 transition-colors duration-200",
                        isActive ? "text-indigo-400" : "text-muted-foreground dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex-1 whitespace-nowrap">{item.name}</span>
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User area */}
        <div className="p-4 border-t border-border dark:border-[#1f1f1f] bg-muted/30 dark:bg-[#050505]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-md border border-border dark:border-[#2a2a2a]">
              {user?.firstName?.[0] || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground dark:text-gray-500 truncate">Élève</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="flex-1 flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
            <ModeToggle />
          </div>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background dark:bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
