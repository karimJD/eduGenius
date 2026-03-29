'use client';

import { useEffect, useState } from 'react';
import { 
  Users, BookOpen, ChevronRight, Search, 
  Plus, Calendar, LayoutGrid, List, Filter
} from 'lucide-react';
import { getMyClasses } from '@/lib/api/teacher';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ClassItem {
  _id: string;
  name: string;
  code: string;
  students: { studentId: any; status: string }[];
  teachers: { subjectId: any; teacherId: any }[];
  departmentId?: { name: string };
  level: string;
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const data = await getMyClasses();
        setClasses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const filtered = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = classes.reduce((acc, c) => acc + (c.students?.length || 0), 0);

  return (
    <div className="p-6 space-y-8 mx-auto">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Users className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Éducation</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Mes Classes</h1>
          <p className="text-muted-foreground max-w-md">Gérez vos classes assignées, consultez les listes d'étudiants et suivez le planning.</p>
        </div>

        <div className="flex items-center gap-4 bg-card border border-border p-4 rounded-3xl shadow-sm">
            <div className="px-4 border-r border-border text-center">
                <p className="text-2xl font-bold text-foreground">{classes.length}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Classes</p>
            </div>
            <div className="px-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Étudiants</p>
            </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111111]/50 p-2 rounded-2xl border border-[#222222]">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une classe..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 bg-background border-[#222222] rounded-xl focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center bg-background border border-[#222222] p-1 rounded-xl mr-2">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                    <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                    <List className="w-4 h-4" />
                </button>
            </div>
            <Button className="h-11 rounded-xl font-bold shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Nouveau Cours
            </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-card border border-border rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="py-24 text-center bg-card/50 border border-dashed border-border rounded-[2.5rem]"
        >
          <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Aucune classe trouvée</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {search ? `Aucun résultat pour "${search}"` : "Vous n'avez pas encore de classes assignées."}
          </p>
          {!search && (
               <Button variant="outline" className="mt-6 rounded-xl">Contacter l'administrateur</Button>
          )}
        </motion.div>
      ) : (
        <div className={cn(
            viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"
        )}>
          <AnimatePresence mode="popLayout">
            {filtered.map((cls, i) => (
              <motion.div
                key={cls._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                    "group relative overflow-hidden transition-all",
                    viewMode === 'grid' 
                        ? "bg-card border border-border rounded-[2rem] p-6 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5" 
                        : "bg-card border border-border rounded-2xl p-4 flex items-center justify-between hover:bg-muted/30"
                )}
              >
                {/* Accent Background for grid */}
                {viewMode === 'grid' && (
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
                )}

                <div className={cn(
                    "flex gap-4",
                    viewMode === 'grid' ? "flex-col" : "items-center flex-1"
                )}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-primary/10">
                      {cls.code || 'CLS'}
                    </span>
                    {cls.departmentId && (
                      <Badge variant="outline" className="text-[10px] font-bold border-border bg-muted/10">
                        {cls.departmentId.name}
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                        "font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors",
                        viewMode === 'grid' ? "text-xl mt-2 mb-4" : "text-base"
                    )}>{cls.name}</h3>

                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <Users className="w-3.5 h-3.5" /> 
                        <span><b className="text-foreground">{cls.students?.length || 0}</b> Étudiants</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        <BookOpen className="w-3.5 h-3.5" /> 
                        <span><b className="text-foreground text-xs">{cls.teachers?.length || 0}</b> Matières</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={cn(
                    viewMode === 'grid' ? "mt-8" : "ml-6"
                )}>
                  <Link
                    href={`/teacher/classes/${cls._id}`}
                    className={cn(
                        "flex items-center justify-center gap-2 font-bold transition-all",
                        viewMode === 'grid'
                            ? "w-full py-4 bg-background border border-border rounded-2xl text-sm text-foreground hover:bg-primary hover:text-white hover:border-primary shadow-sm"
                            : "px-6 py-2.5 bg-background border border-border rounded-xl text-xs hover:bg-primary hover:text-white"
                    )}
                  >
                    Détails <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function Badge({ children, variant = 'default', className }: { children: React.ReactNode, variant?: string, className?: string }) {
    return (
        <span className={cn(
            "px-2 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-wider",
            variant === 'outline' ? "border border-border" : "bg-primary text-white",
            className
        )}>
            {children}
        </span>
    );
}
