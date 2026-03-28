'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Users, ClipboardList, Eye, EyeOff, ChevronRight, BarChart2
} from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';

interface Submission {
  _id: string;
  studentId: { firstName: string; lastName: string; email: string };
  score: number;
  totalPoints: number;
  percentage: number;
  status: string;
  submittedAt: string;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  isPublished: boolean;
  questions: any[];
  classId?: { name: string; code: string };
  difficulty: string;
  settings?: any;
}

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([
      api.get(`/teacher/quizzes/${id}`),
      api.get(`/teacher/quizzes/${id}/submissions`),
    ]).then(([q, s]) => {
      setQuiz(q.data);
      setSubmissions(s.data);
    }).catch(console.error).finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const togglePublish = async () => {
    await api.patch(`/teacher/quizzes/${id}/publish`);
    load();
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!quiz) return <div className="text-center py-16 text-muted-foreground">Quiz not found.</div>;

  const avg = submissions.length
    ? Math.round(submissions.reduce((s, sub) => s + (sub.percentage || 0), 0) / submissions.length * 10) / 10
    : null;
  const pending = submissions.filter(s => s.status !== 'graded').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/quizzes" className="p-2 hover:bg-accent rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
          {quiz.classId && <p className="text-sm text-muted-foreground">{quiz.classId.name}</p>}
        </div>
        <button onClick={togglePublish}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            quiz.isPublished ? 'bg-muted text-muted-foreground hover:bg-accent' : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}>
          {quiz.isPublished ? <><EyeOff className="w-4 h-4" /> Unpublish</> : <><Eye className="w-4 h-4" /> Publish</>}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Questions', value: quiz.questions.length, icon: ClipboardList },
          { label: 'Submissions', value: submissions.length, icon: Users },
          { label: 'Avg Score', value: avg !== null ? `${avg}%` : '—', icon: BarChart2 },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="p-4 bg-card border border-border rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submissions */}
      <div className="bg-card border border-border rounded-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">
            Submissions
            {pending > 0 && (
              <span className="ml-2 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {pending} pending grading
              </span>
            )}
          </h2>
          {pending > 0 && (
            <Link href="/teacher/grading" className="text-xs text-primary hover:underline flex items-center gap-1">
              Grade now <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No submissions yet for this quiz.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {submissions.map(sub => (
              <div key={sub._id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {sub.studentId.firstName?.[0]}{sub.studentId.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{sub.studentId.firstName} {sub.studentId.lastName}</p>
                  <p className="text-xs text-muted-foreground">{sub.studentId.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{sub.score}/{sub.totalPoints}</p>
                  <p className="text-xs text-muted-foreground">{sub.percentage}%</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  sub.status === 'graded' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                }`}>{sub.status}</span>
                {sub.status !== 'graded' && (
                  <Link href={`/teacher/grading/${sub._id}`}
                    className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                    Grade
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
