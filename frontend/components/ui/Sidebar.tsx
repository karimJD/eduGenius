'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  PlusCircle, 
  LogOut, 
  GraduationCap,
  Settings,
  User,
  BookOpen,
  Send,
  Video
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';
import { ModeToggle } from '../mode-toggle';

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const getLinks = () => {
    const role = user?.role;
    
    if (role === 'admin') {
      return [
        { href: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Manage Users', icon: PlusCircle },
        { href: '/admin/classes', label: 'Manage Classes', icon: GraduationCap },
      ];
    }
    
    if (role === 'teacher') {
      return [
        { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/teacher/classes', label: 'My Classes', icon: GraduationCap },
        { href: '/teacher/courses', label: 'My Courses', icon: BookOpen },
        { href: '/teacher/messages', label: 'Messages', icon: Send },
        { href: '/teacher/sessions', label: 'Live Sessions', icon: Video },
      ];
    }

    // Default student links
    return [
      { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/student/courses', label: 'Courses', icon: BookOpen },
      { href: '/student/messages', label: 'Messages', icon: Send },
      { href: '/student/sessions', label: 'Live Sessions', icon: Video },
    ];
  };

  const links = getLinks();

  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-screen w-64 bg-background/80 backdrop-blur-xl border-r border-border flex flex-col z-40"
    >
      <div className="p-6 border-b border-border text-center">
        <Link href="/" className="flex items-center justify-center gap-2">
          <GraduationCap className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            EduGenius
          </span>
        </Link>
        {user?.role && (
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 block">
            {user.role} Panel
          </span>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className={clsx("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground")} />
              <span className="font-medium">{link.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between px-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appearance</span>
          <ModeToggle />
        </div>
        
        <div className="px-4 py-3 flex items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-foreground truncate">{user?.firstName} {user?.lastName}</span>
            <span className="text-xs text-muted-foreground truncate w-32">{user?.email}</span>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </motion.aside>
  );
}
