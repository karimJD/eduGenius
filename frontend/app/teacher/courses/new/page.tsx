'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, FileText, Loader2, ArrowLeft, BookOpen, Layers, Target, GraduationCap } from 'lucide-react';
import api from '@/lib/axios';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [classId, setClassId] = useState('');
  const [level, setLevel] = useState('Intermediate');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'text' | 'pdf'>('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data);
        } catch (err) {
            console.error('Failed to fetch classes:', err);
        }
    };
    fetchClasses();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('classId', classId);
      formData.append('level', level);
      formData.append('subject', subject);
      
      if (mode === 'text') {
        if (!content) throw new Error('Please provide content');
        formData.append('content', content);
      } else {
        if (!file) throw new Error('Please upload a PDF file');
        formData.append('file', file);
      }
      
      await api.post('/courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      router.push('/teacher/courses');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to generate course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl border border-white/10 hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-green-500" />
            Create AI Course
          </h1>
          <p className="text-gray-400 text-sm">Convert text or PDF into structured chapters, summaries, and quizzes.</p>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
        
        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm italic">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Course Title
                </Label>
                <Input
                    id="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-black/40 border-white/10 rounded-xl py-6"
                    placeholder="e.g., Introduction to Modern History"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="subject" className="text-gray-400 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Subject
                </Label>
                <Input
                    id="subject"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-black/40 border-white/10 rounded-xl py-6"
                    placeholder="e.g., History, Physics, Math"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="class" className="text-gray-400 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Assign to Class
                </Label>
                <select
                    id="class"
                    required
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full flex h-12 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm focus:ring-green-500"
                >
                    <option value="" disabled className="bg-zinc-900">Select class</option>
                    {classes.map(cls => (
                        <option key={cls._id} value={cls._id} className="bg-zinc-900">{cls.name} ({cls.code})</option>
                    ))}
                </select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="level" className="text-gray-400 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Difficulty Level
                </Label>
                <select
                    id="level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full flex h-12 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm focus:ring-green-500"
                >
                    <option value="Beginner" className="bg-zinc-900">Beginner</option>
                    <option value="Intermediate" className="bg-zinc-900">Intermediate</option>
                    <option value="Advanced" className="bg-zinc-900">Advanced</option>
                </select>
            </div>
          </div>

          <div className="flex gap-4 p-1 bg-black/40 border border-white/5 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'text' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'text-gray-500 hover:text-white'}`}
            >
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => setMode('pdf')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'pdf' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'text-gray-500 hover:text-white'}`}
            >
              Upload PDF
            </button>
          </div>

          {mode === 'text' ? (
            <div className="space-y-2">
              <Label className="text-gray-400">Content Source</Label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none font-mono text-sm placeholder:text-gray-700"
                placeholder="Paste your course material, lecture notes, or textbook content here. The AI will extract key concepts, create summaries, and generate quizzes."
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-gray-400">PDF Document</Label>
              <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:bg-white/5 hover:border-green-500/50 transition-all group">
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                     <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-gray-200 font-bold text-lg">
                      {file ? file.name : 'Drop your lecture PDF here'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Maximum file size: 10MB</p>
                  </div>
                  {file && (
                    <span className="text-xs text-green-500 bg-green-500/10 px-3 py-1 rounded-full font-bold">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • READY
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-8 border-t border-white/5">
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-12 py-7 rounded-2xl font-bold text-lg shadow-xl shadow-green-600/20 disabled:opacity-50 flex gap-3 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing Knowledge...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Generate AI Course
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
