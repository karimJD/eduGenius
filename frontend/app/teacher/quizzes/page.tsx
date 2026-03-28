'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, PlusCircle, Eye, EyeOff, Trash2, ChevronRight, Search } from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Quiz {
  _id: string;
  title: string;
  description: string;
  isPublished: boolean;
  questions: any[];
  classId?: { name: string; code: string };
  courseId?: { title: string };
  difficulty: string;
  createdAt: string;
}

const difficultyColors: Record<string, string> = {
  easy: 'text-green-500 bg-green-500/10',
  medium: 'text-amber-500 bg-amber-500/10',
  hard: 'text-red-500 bg-red-500/10',
  mixed: 'text-violet-500 bg-violet-500/10',
};

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () =>
    api.get('/teacher/quizzes')
      .then(r => { setQuizzes(r.data); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const togglePublish = async (id: string) => {
    await api.patch(`/teacher/quizzes/${id}/publish`);
    load();
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm('Delete this quiz? This cannot be undone.')) return;
    await api.delete(`/teacher/quizzes/${id}`);
    load();
  };

  const filtered = quizzes.filter(q =>
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    q.classId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quizzes</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage quizzes for your classes.</p>
        </div>
        <Link href="/teacher/quizzes/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          <PlusCircle className="w-4 h-4" /> New Quiz
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search quizzes..."
          className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-card border border-border rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No quizzes yet</p>
          <p className="text-sm mt-1">Create your first quiz to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((quiz, i) => (
            <motion.div key={quiz._id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/30 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{quiz.title}</p>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${difficultyColors[quiz.difficulty] || difficultyColors.mixed}`}>
                      {quiz.difficulty}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${quiz.isPublished ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                      {quiz.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{quiz.questions.length} questions</span>
                    {quiz.classId && <span>{quiz.classId.name} ({quiz.classId.code})</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => togglePublish(quiz._id)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                    title={quiz.isPublished ? 'Unpublish' : 'Publish'}>
                    {quiz.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteQuiz(quiz._id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link href={`/teacher/quizzes/${quiz._id}`}
                    className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
