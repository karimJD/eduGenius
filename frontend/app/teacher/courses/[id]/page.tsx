'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  BookOpen, 
  Sparkles, 
  FileText, 
  Edit2, 
  Plus, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Monitor
} from 'lucide-react';
import api from '@/lib/axios';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface Course {
  _id: string;
  title: string;
  description: string;
  content: string;
  summary: string;
  quiz: any[];
  level?: string;
  subject?: string;
  chapters: any[];
  createdAt: string;
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data);
      } catch (error) {
        console.error('Failed to fetch course details:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCourse();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>
  );

  if (!course) return <div className="text-center py-20 text-gray-400">Course not found.</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl border border-white/10">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-white">{course.title}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/10 font-bold uppercase">{course.subject || 'GENERAL'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(course.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
        <div className="flex gap-3">
            <Button variant="ghost" className="bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex gap-2">
                <Edit2 className="w-4 h-4" /> Edit Details
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white rounded-xl flex gap-2 font-bold px-6">
                <Monitor className="w-4 h-4" /> Present Mode
            </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
            {/* AI Summary Section */}
            <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Sparkles size={120} />
                </div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    AI Executive Summary
                </h2>
                <div className="prose prose-invert max-w-none text-gray-400 leading-relaxed whitespace-pre-wrap">
                    {course.summary || 'Summary is being generated or not available for this course.'}
                </div>
            </motion.section>

            {/* Chapters Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        Curriculum
                    </h2>
                    <Button variant="ghost" size="sm" className="text-blue-400 hover:bg-blue-500/10 rounded-lg">
                        <Plus className="w-4 h-4 mr-1" /> Add Chapter
                    </Button>
                </div>
                <div className="space-y-4">
                    {course.chapters?.map((chapter: any, index: number) => (
                        <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6 group hover:bg-white/10 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/10">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-100">{chapter.title}</h3>
                                        <p className="text-xs text-gray-500">{chapter.materials?.length || 0} Learning Materials</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>

        {/* Sidebar / Stats */}
        <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                <h3 className="font-bold flex items-center gap-2 text-green-400">
                    <Sparkles className="w-4 h-4" />
                    AI Insights
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Quiz Complexity</span>
                        <span className="text-sm font-bold text-white">Mixed</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Estimated Reading</span>
                        <span className="text-sm font-bold text-white">15 Minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Key Concepts</span>
                        <span className="text-sm font-bold text-white">8 Identified</span>
                    </div>
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12">
                    Regenerate AI Content
                </Button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <h3 className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400" />
                    Generated Quizzes
                </h3>
                <div className="space-y-3">
                    {course.quiz?.length ? (
                        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                             <p className="font-bold text-white text-sm">{course.quiz.length} Questions</p>
                             <p className="text-[10px] text-gray-500 uppercase mt-1">Ready for Class Assignment</p>
                             <Button variant="ghost" className="w-full mt-4 bg-white/5 border border-white/5 text-xs rounded-lg hover:text-orange-400">
                                Preview Quiz
                             </Button>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-600 italic">No quiz generated yet.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
