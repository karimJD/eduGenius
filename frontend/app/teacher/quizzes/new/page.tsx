'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, Trash2, Save, Sparkles } from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';

interface Question {
  question: string;
  type: 'mcq' | 'true-false' | 'short-answer';
  options: string[];
  correctAnswer: number | boolean | string;
  points: number;
}

interface Class { _id: string; name: string; code: string }

const defaultQuestion = (): Question => ({
  question: '',
  type: 'mcq',
  options: ['', '', '', ''],
  correctAnswer: 0,
  points: 1,
});

export default function NewQuizPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [difficulty, setDifficulty] = useState('mixed');
  const [duration, setDuration] = useState<number | ''>('');
  const [questions, setQuestions] = useState<Question[]>([defaultQuestion()]);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');

  useEffect(() => {
    api.get('/teacher/classes').then(r => setClasses(r.data)).catch(console.error);
  }, []);

  const addQuestion = () => setQuestions(p => [...p, defaultQuestion()]);
  const removeQuestion = (i: number) => setQuestions(p => p.filter((_, idx) => idx !== i));

  const updateQuestion = (i: number, field: keyof Question, value: any) => {
    setQuestions(p => p.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    setQuestions(p => p.map((q, idx) => {
      if (idx !== qi) return q;
      const opts = [...q.options];
      opts[oi] = value;
      return { ...q, options: opts };
    }));
  };

  const generateAI = async () => {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post('/teacher/quizzes', {
        title: title || aiTopic,
        classId,
        isAIGenerated: true,
        generatedFrom: aiTopic,
        questionCount: 5,
        difficulty,
      });
      router.push(`/teacher/quizzes/${res.data._id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const save = async (publish = false) => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/teacher/quizzes', {
        title,
        description,
        classId: classId || undefined,
        difficulty,
        questions,
        settings: { duration: duration || null },
        isPublished: publish,
      });
      router.push(`/teacher/quizzes/${res.data._id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/teacher/quizzes" className="p-2 hover:bg-accent rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-bold text-foreground">New Quiz</h1>
      </div>

      {/* Basic info */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Quiz Details</h2>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz title *"
          className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2}
          className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        <div className="grid grid-cols-3 gap-3">
          <select value={classId} onChange={e => setClassId(e.target.value)}
            className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm">
            <option value="">No class</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
          </select>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
            className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="mixed">Mixed</option>
          </select>
          <input type="number" value={duration} onChange={e => setDuration(+e.target.value || '')}
            placeholder="Duration (min)"
            className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm" />
        </div>
      </div>

      {/* AI Quick Generate */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> AI Quick Generate
        </h2>
        <p className="text-xs text-muted-foreground">Enter a topic and let AI generate 5 questions automatically.</p>
        <div className="flex gap-3">
          <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="Topic or paste content..."
            className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button onClick={generateAI} disabled={aiLoading || !aiTopic.trim()}
            className="px-5 py-2.5 bg-amber-500/10 text-amber-500 rounded-xl text-sm font-medium hover:bg-amber-500/20 disabled:opacity-50 transition-colors flex items-center gap-2">
            {aiLoading ? <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Question {qi + 1}</span>
              <div className="flex items-center gap-2">
                <select value={q.type} onChange={e => updateQuestion(qi, 'type', e.target.value)}
                  className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs">
                  <option value="mcq">MCQ</option>
                  <option value="true-false">True/False</option>
                  <option value="short-answer">Short Answer</option>
                </select>
                <input type="number" value={q.points} onChange={e => updateQuestion(qi, 'points', +e.target.value)}
                  className="w-16 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-center" placeholder="pts" />
                {questions.length > 1 && (
                  <button onClick={() => removeQuestion(qi)} className="p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <textarea value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)}
              placeholder="Question text *" rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />

            {q.type === 'mcq' && (
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input type="radio" name={`correct-${qi}`} checked={q.correctAnswer === oi}
                      onChange={() => updateQuestion(qi, 'correctAnswer', oi)}
                      className="accent-primary" />
                    <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                ))}
              </div>
            )}

            {q.type === 'true-false' && (
              <div className="flex gap-4">
                {['True', 'False'].map((v, i) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name={`tf-${qi}`} checked={q.correctAnswer === (i === 0)}
                      onChange={() => updateQuestion(qi, 'correctAnswer', i === 0)}
                      className="accent-primary" />
                    <span className="text-sm">{v}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'short-answer' && (
              <input value={q.correctAnswer as string} onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)}
                placeholder="Expected answer (for auto-grading reference)"
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            )}
          </div>
        ))}

        <button onClick={addQuestion}
          className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-border rounded-2xl text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors">
          <PlusCircle className="w-4 h-4" /> Add Question
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <button onClick={() => save(false)} disabled={saving || !title}
          className="flex items-center gap-2 px-6 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors">
          <Save className="w-4 h-4" /> Save Draft
        </button>
        <button onClick={() => save(true)} disabled={saving || !title}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
          Save & Publish
        </button>
      </div>
    </div>
  );
}
