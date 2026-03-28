'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudentSidebar } from '../../components/student/StudentSidebar';
import { useAuth } from '../../context/AuthContext';

export default function StudentLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      // In a real app we might redirect to /login or /dashboard depending on role
      // For now, if not a student, send to login
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex selection:bg-indigo-500/30">
      <StudentSidebar />
      <main className="flex-1 lg:ml-64 p-4 md:p-8 overflow-y-auto h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-[#111111]">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
