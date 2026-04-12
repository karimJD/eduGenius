'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, ChevronRight, Folder } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import Link from 'next/link';

interface SubjectInfo {
  _id: string;
  name: string;
  code: string;
}

interface AssignedSubject {
  subjectId: SubjectInfo;
}

interface ClassDetail {
  _id: string;
  name: string;
  code: string;
  assignedSubjects: AssignedSubject[];
}

export default function SubjectSelectorPage() {
  const { classId } = useParams<{ classId: string }>();
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get('/teacher/classes')
      .then(res => {
        const cls = res.data.find((c: any) => c._id === classId);
        if (cls) {
          setClassDetail(cls);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [classId]);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!classDetail) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground font-bold">Classe introuvable.</p>
      <Link href="/teacher/courses" className="text-primary hover:underline mt-4 inline-block">Retour aux cours</Link>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/teacher/courses" 
          className="p-3 bg-card border border-border rounded-2xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Matières — {classDetail.name}
          </h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Sélectionnez une matière pour accéder à l'espace de dépôt
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classDetail.assignedSubjects?.map((item, i) => (
          <motion.div
            key={item.subjectId._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={`/teacher/courses/${classId}/${item.subjectId._id}`}
              className="group block relative bg-card border border-border/60 rounded-[2rem] p-6 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 overflow-hidden"
            >
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    <Folder className="w-6 h-6" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-muted/50 border border-border/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    {item.subjectId.code}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors leading-tight">
                    {item.subjectId.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">
                    Dossier de cours
                  </p>
                </div>

                <div className="pt-4 mt-auto border-t border-border/40 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Accéder au dépôt</span>
                  <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {(!classDetail.assignedSubjects || classDetail.assignedSubjects.length === 0) && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-[2rem] bg-card/50">
             <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-20" />
             <p className="text-sm font-bold text-muted-foreground">Aucune matière assignée à cet espace.</p>
          </div>
        )}
      </div>
    </div>
  );
}
