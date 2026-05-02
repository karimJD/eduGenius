'use client';

import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Button } from './button';
import { GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              EduGenius
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">Welcome, {user.name}</span>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">Dashboard</Button>
                </Link>
                <Button onClick={logout} variant="outline" className="border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md shadow-blue-600/20 font-semibold">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
