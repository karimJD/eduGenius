'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, Calendar, PlusCircle } from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Class {
  _id: string;
  name: string;
  code: string;
  departmentId?: { name: string };
  students: any[];
}

interface Course {
  _id: string;
  title: string;
  classId: string;
  chapters: any[];
}

export default function CoursesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/teacher/classes'),
      api.get('/teacher/courses')
    ]).then(([classesRes, coursesRes]) => {
      setClasses(classesRes.data);
      // Map courses by classId for easy lookup
      const courseMap: Record<string, Course> = {};
      coursesRes.data.forEach((c: Course) => {
        if (c.classId) courseMap[c.classId] = c;
      });
      setCourses(courseMap);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Espaces de Dépôt</h1>
        <p className="text-muted-foreground text-base">Gérez les chapitres et les supports de cours pour chacun de vos groupes.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-card border border-border rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground border-2 border-dashed border-border rounded-[2.5rem] bg-card/50">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-primary opacity-40" />
          </div>
          <p className="text-xl font-bold text-foreground">Aucune classe pour le moment</p>
          <p className="max-w-xs mx-auto mt-2">Vous n'avez pas encore de classes assignées pour lesquelles déposer des cours.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls, i) => {
            const course = courses[cls._id];
            return (
              <motion.div
                key={cls._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
              >
                <Link
                  href={`/teacher/courses/${cls._id}`}
                  className="group block relative h-full bg-card border border-border/60 rounded-[2rem] p-6 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 overflow-hidden"
                >
                  {/* Decorative background element */}
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                  
                  <div className="relative flex flex-col h-full space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 border border-border/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{cls.code}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                        Espace {cls.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {cls.departmentId?.name || 'Département Général'}
                      </p>
                    </div>

                    <div className="pt-4 mt-auto border-t border-border/40 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contenu</span>
                        <span className="text-sm font-black text-foreground">
                          {course?.chapters?.length || 0} Chapitres
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
