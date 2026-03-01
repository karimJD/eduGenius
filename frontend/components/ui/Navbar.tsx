'use client';

import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Button } from './button';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 w-full z-50 bg-black/30 backdrop-blur-xl border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xl font-bold text-white">
              eduGenius
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-300">Welcome, {user.name}</span>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-white hover:bg-white/10">Dashboard</Button>
                </Link>
                <Button onClick={logout} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-white hover:bg-white/10">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none">
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
