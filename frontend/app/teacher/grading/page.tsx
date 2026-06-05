'use client';

import { useEffect, useState } from 'react';
import { CheckSquare, ChevronRight, Clock, User, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Submission {
  _id: string;
  type: 'quiz' | 'exam' | 'exercise';
  studentId: { firstName: string; lastName: string; email: string; profileImage?: string };
  title: string;
  className: string;
  classId?: string | { _id: string; name: string };
  subjectId?: string | { _id: string; name: string };
  score?: number;
  totalPoints?: number;
  percentage?: number;
  status: string;
  submittedAt: string;
}

const exportToCsv = (submissions: Submission[]) => {
  // Define CSV headers
  const headers = ['First Name', 'Last Name', 'Email', 'Assessment Title', 'Class', 'Score', 'Total Points', 'Percentage', 'Status', 'Submitted At'];
  
  // Format rows
  const rows = submissions.map(sub => [
    sub.studentId.firstName || '',
    sub.studentId.lastName || '',
    sub.studentId.email || '',
    sub.title,
    sub.className || '',
    sub.score ?? '-',
    sub.totalPoints ?? '-',
    sub.percentage ? `${sub.percentage}%` : '-',
    sub.status || 'En attente',
    new Date(sub.submittedAt).toLocaleDateString()
  ]);

  // Escape strategy for fields containing commas in CSV format
  const csvContent = [headers, ...rows]
    .map(e => e.map(f => typeof f === 'string' && f.includes(',') ? `"${f}"` : f).join(",")) 
    .join("\n");
  
  // Create Blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', 'submissions_export.csv');
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};


import { TeacherPageHeader } from '@/components/teacher/TeacherPageHeader';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function GradingPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/grading/pending')
      .then(r => setSubmissions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <TeacherPageHeader
        title="Corrections"
        subtitle="Révisez et notez les travaux soumis par les étudiants."
        category="Évaluation"
        icon={CheckSquare}
        stats={[
          { label: 'À Corriger', value: submissions.length }
        ]}
        actions={
          <Button 
            onClick={() => exportToCsv(submissions)}
            disabled={submissions.length === 0}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        }
      />


      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-card border border-border rounded-2xl animate-pulse" />)}</div>
      ) : submissions.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
          <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm mt-1">No submissions waiting for grading.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{submissions.length}</span> submissions awaiting review
          </p>
          <div className="space-y-3">
            {submissions.map((sub, i) => {
              const href = sub.type === 'exercise' 
                ? `/teacher/grading/work/${sub._id}`
                : `/teacher/grading/${sub._id}`;

              return (
                <motion.div key={sub._id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={href}
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/30 transition-all group">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center overflow-hidden border border-border shrink-0">
                      {sub.studentId.profileImage ? (
                        <img src={sub.studentId.profileImage} alt={sub.studentId.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                          {sub.studentId.firstName?.[0]}{sub.studentId.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-sm">
                          {sub.studentId.firstName} {sub.studentId.lastName}
                        </p>
                        <Badge variant="outline" className="text-[9px] font-bold py-0 h-4 uppercase">
                          {sub.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sub.title}{sub.className ? ` · ${sub.className}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 font-semibold rounded-full uppercase tracking-wide text-[10px]",
                        sub.type === 'exercise' ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {sub.type === 'exercise' ? 'À corriger' : sub.status}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
