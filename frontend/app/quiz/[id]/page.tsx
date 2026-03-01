'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Trophy, AlertCircle, ArrowRight, RefreshCw, BookOpen, Lightbulb } from 'lucide-react';
import { fetchCourseById, submitQuizResult, reviewQuiz, Course } from '../../../services/api';
import { Sidebar } from '../../../components/ui/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useAuth } from '../../../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { user } = useAuth();

  const searchParams = useSearchParams();
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : null;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [aiExplanations, setAiExplanations] = useState<string | null>(null);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      const data = await fetchCourseById(id);
      setCourse(data);
      
      // Handle limit
      let quizQuestions = data.quiz;
      if (limit && limit > 0) {
        // Shuffle and slice
        quizQuestions = [...data.quiz]
          .sort(() => 0.5 - Math.random())
          .slice(0, limit);
      }
      setQuestions(quizQuestions);
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!course || selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswerIndex;
    if (isCorrect) setScore(score + 1);

    // Track user answer
    setUserAnswers([...userAnswers, selectedAnswer]);

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
      
      // Submit quiz results
      if (user) {
        try {
          await submitQuizResult(id, questions.length, score + (isCorrect ? 1 : 0), user.token);
        } catch (error) {
          console.error('Failed to submit quiz result:', error);
        }
      }
    }
  };

  const handleReviewMistakes = async () => {
    if (!course) return;
    
    setReviewLoading(true);
    try {
      const result = await reviewQuiz(id, questions, userAnswers);
      setAiExplanations(result.explanation);
      setShowReview(true);
    } catch (error) {
      console.error('Failed to review quiz:', error);
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!course || questions.length === 0) return null;

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8 flex items-center justify-center">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            {showResult ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-xl"
              >
                <Trophy className={clsx(
                  "w-24 h-24 mx-auto mb-6",
                  score / questions.length >= 0.7 ? "text-yellow-400" : "text-gray-500"
                )} />
                
                <h2 className="text-4xl font-bold mb-2">Quiz Completed!</h2>
                <p className="text-gray-400 mb-8">Here is your performance summary</p>
                
                <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                  {Math.round((score / questions.length) * 100)}%
                </div>
                
                <p className="text-xl text-gray-300 mb-12">
                  You answered {score} out of {questions.length} questions correctly
                </p>

                {!showReview ? (
                  <div className="flex justify-center gap-4">
                    <Link href={`/dashboard/${id}`}>
                      <button className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors">
                        Back to Course
                      </button>
                    </Link>
                    <button 
                      onClick={handleReviewMistakes}
                      disabled={reviewLoading}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {reviewLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Lightbulb className="w-4 h-4" />
                      )}
                      Review Mistakes
                    </button>
                    <button 
                      onClick={() => {
                        setShowResult(false);
                        setCurrentQuestion(0);
                        setScore(0);
                        setSelectedAnswer(null);
                        setUserAnswers([]);
                        setShowReview(false);
                        setAiExplanations(null);
                      }}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retake Quiz
                    </button>
                  </div>
                ) : (
                  <div className="mt-8">
                    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6 mb-6">
                      <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Lightbulb className="w-6 h-6 text-yellow-400" />
                        AI Explanation of Your Mistakes
                      </h3>
                      <div className="prose prose-invert prose-lg max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-3 text-purple-400" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-2 mt-4 text-blue-400" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 mt-3 text-gray-200" {...props} />,
                            p: ({node, ...props}) => <p className="mb-3 text-gray-300 leading-relaxed" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-300" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-300" {...props} />,
                            li: ({node, ...props}) => <li className="ml-4" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                            em: ({node, ...props}) => <em className="italic text-gray-200" {...props} />,
                          }}
                        >
                          {aiExplanations || ''}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <div className="flex justify-center gap-4">
                      <Link href={`/dashboard/${id}`}>
                        <button className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors">
                          Back to Course
                        </button>
                      </Link>
                      <button 
                        onClick={() => {
                          setShowResult(false);
                          setCurrentQuestion(0);
                          setScore(0);
                          setSelectedAnswer(null);
                          setUserAnswers([]);
                          setShowReview(false);
                          setAiExplanations(null);
                        }}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Retake Quiz
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="quiz"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Question {currentQuestion + 1} / {questions.length}
                  </span>
                  <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-8 leading-relaxed">
                  {questions[currentQuestion].question}
                </h2>

                <div className="space-y-4 mb-8">
                  {questions[currentQuestion].options.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAnswer(index)}
                      className={clsx(
                        "w-full p-6 text-left rounded-xl border-2 transition-all duration-200 flex items-center justify-between group",
                        selectedAnswer === index 
                          ? "border-blue-500 bg-blue-500/10 text-blue-400" 
                          : "border-white/5 bg-black/20 hover:border-white/20 hover:bg-white/5 text-gray-300"
                      )}
                    >
                      <span className="font-medium text-lg">{option}</span>
                      {selectedAnswer === index && (
                        <CheckCircle className="w-6 h-6 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    disabled={selectedAnswer === null}
                    onClick={handleNext}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {currentQuestion + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
