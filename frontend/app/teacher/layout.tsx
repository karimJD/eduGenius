'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TeacherSidebar } from '../../components/teacher/TeacherSidebar';
import { useAuth } from '../../context/AuthContext';

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'teacher' && user.role !== 'admin'))) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <TeacherSidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
