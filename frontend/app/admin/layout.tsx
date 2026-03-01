import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex relative overflow-hidden">
      {/* Creative Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full bg-vantage-pattern pointer-events-none opacity-50"></div>
      <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <AdminSidebar />
      <main className="flex-1 ml-64 p-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
