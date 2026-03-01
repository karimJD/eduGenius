'use client';

import { ReactNode } from 'react';
import { Sidebar } from '../../components/ui/Sidebar';

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
