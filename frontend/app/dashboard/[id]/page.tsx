'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Clock, Play, ArrowLeft, BrainCircuit, Sparkles, Minimize2, Target, Award } from 'lucide-react';
import { fetchCourseById, generateEnhancedSummary, ensureQuizCount, Course } from '../../../services/api';
import { Sidebar } from '../../../components/ui/Sidebar';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../../context/AuthContext';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [userProgress, setUserProgress] = useState<{ questionsAnswered: number; correctAnswers: number } | null>(null);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      const data = await fetchCourseById(id);
      setCourse(data);
      
      // Fetch user progress
      if (user) {
        await fetchUserProgress();
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/progress/${id}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const startQuiz = async () => {
    if (!selectedTime) return;
    
    setActionLoading('quiz');
    try {
      // Estimate: 1 minute ≈ 3 questions (approx 20 sec per question)
      const questionCount = selectedTime * 3;
      
      // Ensure we have enough questions
      await ensureQuizCount(id, questionCount);
      
      router.push(`/quiz/${id}?limit=${questionCount}`);
    } catch (error) {
      console.error('Error starting quiz:', error);
      // Fallback to existing quiz if generation fails
      router.push(`/quiz/${id}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!course) return null;

  const timeOptions = [
    { label: '1 Min', value: 1, desc: 'Quick refresh (~3 questions)' },
    { label: '5 Mins', value: 5, desc: 'Standard quiz (~15 questions)' },
    { label: '10 Mins', value: 10, desc: 'Deep dive (~30 questions)' },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header */}
            <div>
              <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                {course.title}
              </h1>
              <div className="flex items-center gap-4 text-gray-400 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Created {new Date(course.createdAt).toLocaleDateString()}
                </span>
                {userProgress && (
                  <>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {userProgress.questionsAnswered} Questions Answered
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {userProgress.correctAnswers > 0 
                        ? `${Math.round((userProgress.correctAnswers / userProgress.questionsAnswered) * 100)}% Score`
                        : '0% Score'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Summary Card */}
            {/* Summary Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-400">
                  <BookOpen className="w-6 h-6" />
                  Course Summary
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        setActionLoading('summary');
                        const updatedCourse = await generateEnhancedSummary(id, 'enhanced');
                        setCourse(updatedCourse);
                      } catch (error) {
                        console.error('Failed to generate summary', error);
                      } finally {
                        setActionLoading(null);
                      }
                    }}
                    disabled={!!actionLoading}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                      course.summary 
                        ? "bg-purple-600 hover:bg-purple-700" 
                        : "bg-green-600 hover:bg-green-700",
                      !!actionLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {actionLoading === 'summary' ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {course.summary ? 'Enhance Summary' : 'Generate Summary'}
                  </button>
                  
                  {course.summary && (
                    <button
                      onClick={async () => {
                        try {
                          setActionLoading('shrink');
                          const updatedCourse = await generateEnhancedSummary(id, 'shrink');
                          setCourse(updatedCourse);
                        } catch (error) {
                          console.error('Failed to shrink summary', error);
                        } finally {
                          setActionLoading(null);
                        }
                      }}
                      disabled={!!actionLoading}
                      className={clsx(
                        "px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                        !!actionLoading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {actionLoading === 'shrink' ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Minimize2 className="w-4 h-4" />
                      )}
                      Shrink
                    </button>
                  )}
                </div>
              </div>
              
              {course.summary ? (
                <div className="prose prose-invert prose-lg max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-4 text-blue-400" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-2xl font-bold mb-3 mt-6 text-purple-400" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-xl font-semibold mb-2 mt-4 text-gray-200" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 text-gray-300 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-300" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-300" {...props} />,
                      li: ({node, ...props}) => <li className="ml-4" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                      em: ({node, ...props}) => <em className="italic text-gray-200" {...props} />,
                      code: ({node, ...props}) => <code className="bg-gray-800 px-2 py-1 rounded text-sm text-blue-300" {...props} />,
                      pre: ({node, ...props}) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
                    }}
                  >
                    {course.summary}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-gray-500 italic flex flex-col items-center justify-center py-8 gap-2">
                  <BookOpen className="w-8 h-8 opacity-50" />
                  <p>No summary available yet. Generate one to get started!</p>
                </div>
              )}
            </div>

            {/* Quiz Section */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-2xl font-bold mb-2">Ready to test your knowledge?</h2>
              <p className="text-gray-400 mb-8">Select your availability to generate a custom quiz session.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {timeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedTime(option.value)}
                    className={clsx(
                      "p-4 rounded-xl border transition-all duration-200 text-left hover:scale-105",
                      selectedTime === option.value
                        ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20"
                        : "bg-black/40 border-white/10 hover:bg-white/5 hover:border-white/20"
                    )}
                  >
                    <div className="text-xl font-bold mb-1">{option.label}</div>
                    <div className={clsx("text-sm", selectedTime === option.value ? "text-blue-100" : "text-gray-500")}>
                      {option.desc}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={startQuiz}
                disabled={!selectedTime || !!actionLoading}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading === 'quiz' ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                Start Adaptive Quiz
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
