'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';

interface Answer {
  questionId: string;
  answer: any;
  isCorrect: boolean | null;
  pointsEarned: number;
  feedback: string;
}

interface Question {
  _id: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer: any;
  points: number;
}

interface Submission {
  _id: string;
  studentId: { firstName: string; lastName: string; email: string };
  answers: Answer[];
  score: number;
  totalPoints: number;
  percentage: number;
  status: string;
  quizId?: { title: string; questions: Question[] };
  examId?: { title: string; questions: Question[] };
}

export default function GradeSubmissionPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const router = useRouter();
  const [sub, setSub] = useState<Submission | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/teacher/grading/submission/${submissionId}`)
      .then(r => {
        setSub(r.data);
        setAnswers(r.data.answers.map((a: Answer) => ({ ...a })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [submissionId]);

  const questions: Question[] = sub?.quizId?.questions || sub?.examId?.questions || [];
  const title = sub?.quizId?.title || sub?.examId?.title || 'Assessment';

  const setPoints = (qId: string, pts: number) => {
    setAnswers(prev => prev.map(a => a.questionId === qId ? { ...a, pointsEarned: pts } : a));
  };

  const setAnswerFeedback = (qId: string, text: string) => {
    setAnswers(prev => prev.map(a => a.questionId === qId ? { ...a, feedback: text } : a));
  };

  const save = async () => {
    setSaving(true);
    try {
      const totalPoints = questions.reduce((s, q) => s + q.points, 0);
      await api.put(`/teacher/grading/submission/${submissionId}`, {
        answers: answers.map(a => ({
          questionId: a.questionId,
          pointsEarned: a.pointsEarned,
          feedback: a.feedback,
        })),
        totalPoints,
        overallFeedback: feedback,
      });
      router.push('/teacher/grading');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!sub) return <div className="text-center py-16 text-muted-foreground">Submission not found.</div>;

  const totalEarned = answers.reduce((s, a) => s + (a.pointsEarned || 0), 0);
  const totalPossible = questions.reduce((s, q) => s + q.points, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/grading" className="p-2 hover:bg-accent rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {sub.studentId.firstName} {sub.studentId.lastName} · {sub.studentId.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{totalEarned} / {totalPossible}</p>
          <p className="text-xs text-muted-foreground">
            {totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Per-question grading */}
      <div className="space-y-4">
        {questions.map((q, qi) => {
          const answer = answers.find(a => a.questionId === q._id);
          const maxPts = q.points;
          const earned = answer?.pointsEarned ?? 0;
          return (
            <div key={q._id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Q{qi + 1} · {q.type} · {q.points} pts</p>
                  <p className="text-sm font-semibold text-foreground">{q.question}</p>
                </div>
                <div className={`flex items-center gap-1 shrink-0 ${earned === maxPts ? 'text-green-500' : earned === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                  {earned === maxPts ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
              </div>

              {/* Student answer */}
              <div className="p-3 bg-background border border-border rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Student answer</p>
                <p className="text-sm text-foreground">
                  {answer?.answer !== undefined && answer.answer !== null
                    ? String(answer.answer)
                    : <span className="italic text-muted-foreground">No answer</span>
                  }
                </p>
              </div>

              {/* Correct answer */}
              {q.correctAnswer !== undefined && (
                <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                  <p className="text-xs text-green-600 mb-1">Correct answer</p>
                  <p className="text-sm text-foreground">{String(q.correctAnswer)}</p>
                </div>
              )}

              {/* Points input */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground">Points awarded:</label>
                <input type="number" min={0} max={maxPts} value={earned}
                  onChange={e => setPoints(q._id, Math.min(maxPts, Math.max(0, +e.target.value)))}
                  className="w-20 px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <span className="text-xs text-muted-foreground">/ {maxPts}</span>
                <div className="flex gap-2 ml-auto">
                  <button onClick={() => setPoints(q._id, 0)}
                    className="px-2 py-1 text-xs rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">0</button>
                  <button onClick={() => setPoints(q._id, maxPts)}
                    className="px-2 py-1 text-xs rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20">Full</button>
                </div>
              </div>

              <textarea value={answer?.feedback || ''} onChange={e => setAnswerFeedback(q._id, e.target.value)}
                placeholder="Feedback for this answer (optional)..." rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
          );
        })}
      </div>

      {/* Overall feedback */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Overall Feedback</h3>
        <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
          placeholder="General comments for the student..." rows={3}
          className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      </div>

      <div className="flex gap-3 pb-8">
        <Link href="/teacher/grading" className="px-5 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-accent transition-colors">
          Cancel
        </Link>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Grades'}
        </button>
      </div>
    </div>
  );
}
