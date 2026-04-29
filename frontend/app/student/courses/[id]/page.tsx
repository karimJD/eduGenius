'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, ChevronRight, Folder } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/axios';
import Link from 'next/link';
import { PageHeader } from '../../../../components/student/PageHeader';

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

export default function StudentSubjectSelectorPage() {
  const { id: classId } = useParams<{ id: string }>();
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get('/student/courses')
      .then(res => {
        if (res.data.success) {
          const cls = res.data.data.find((c: any) => c._id === classId);
          if (cls) {
            setClassDetail(cls);
          }
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
      <p className="text-muted-foreground font-bold text-foreground dark:text-white">Classe introuvable.</p>
      <Link href="/student/courses" className="text-primary hover:underline mt-4 inline-block">Retour aux cours</Link>
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Espace de dépôt — ${classDetail.name}`}
        description="Sélectionnez une matière pour voir le contenu"
        icon={Folder}
        badgeText="Cours & Matériels"
        badgeClassName="bg-blue-500/10 border-blue-500/20 text-blue-400"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classDetail.assignedSubjects?.map((item, i) => (
          <motion.div
            key={item.subjectId._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={`/student/courses/${classId}/${item.subjectId._id}`}
              className="group block relative bg-card dark:bg-[#111111] border border-border dark:border-[#222222] rounded-[2rem] p-6 transition-all hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-500/30 overflow-hidden"
            >
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
                    <Folder className="w-6 h-6" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-muted dark:bg-[#1a1a1a] border border-border dark:border-[#222222] text-[10px] font-black uppercase tracking-wider text-muted-foreground dark:text-gray-500">
                    {item.subjectId.code}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-foreground dark:text-white group-hover:text-blue-400 transition-colors leading-tight">
                    {item.subjectId.name}
                  </h3>
                  <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1 uppercase tracking-widest font-bold">
                    Dossier de cours
                  </p>
                </div>

                <div className="pt-4 mt-auto border-t border-border dark:border-[#222222] flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground dark:text-gray-500 uppercase tracking-widest">Voir le contenu</span>
                  <div className="w-8 h-8 rounded-full bg-blue-500/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-foreground dark:group-hover:text-white transition-all duration-300">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {(!classDetail.assignedSubjects || classDetail.assignedSubjects.length === 0) && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border dark:border-[#222222] rounded-[2rem] bg-muted/20 dark:bg-[#0a0a0a]">
             <BookOpen className="w-10 h-10 text-muted-foreground dark:text-gray-600 mx-auto mb-4 opacity-20" />
             <p className="text-sm font-bold text-muted-foreground dark:text-gray-500">Aucune matière n'a encore été assignée à cet espace.</p>
          </div>
        )}
      </div>
    </div>
  );
}
