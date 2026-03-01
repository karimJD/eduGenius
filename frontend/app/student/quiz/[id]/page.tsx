'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trophy, 
  ChevronRight,
  Sparkles,
  Timer
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

interface Quiz {
  _id: string;
  questions: Question[];
  quizType: string;
}

export default function QuizTakingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        // Note: We need a way to get the specific self-quiz. 
        // For now let's assume get /api/ai/quiz/:id works (need to verify/implement)
        const res = await api.get(`/ai/quiz/${id}`);
        setQuiz(res.data);
      } catch (error) {
        console.error('Failed to fetch quiz:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuiz();
  }, [id]);

  const handleSelectOption = (idx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = idx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentStep < (quiz?.questions.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    let correctCount = 0;
    quiz?.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswerIndex) correctCount++;
    });
    
    const finalScore = Math.round((correctCount / (quiz?.questions.length || 1)) * 100);
    setScore(finalScore);
    setIsFinished(true);

    try {
        await api.put(`/ai/quiz/${id}/submit`, { score: finalScore });
    } catch (err) {
        console.error('Failed to submit quiz score:', err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!quiz) return <div className="text-center py-20 text-gray-400">Quiz not found.</div>;

  if (isFinished) {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-6"
            >
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto text-yellow-400">
                    <Trophy className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Quiz Terminé !</h1>
                    <p className="text-gray-400">Excellent effort ! Voici vos résultats :</p>
                </div>
                
                <div className="py-8 bg-black/40 rounded-2xl border border-white/5">
                    <p className="text-5xl font-black text-white">{score}%</p>
                    <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest font-bold">Score Final</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-xl font-bold text-blue-400">+{Math.round(score * 1.5)}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">XP Gagnés</p>
                    </div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-xl font-bold text-purple-400">A-</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Rang</p>
                    </div>
                </div>

                <Button 
                    onClick={() => router.push('/student/dashboard')}
                    className="w-full bg-white text-black font-bold h-12 rounded-xl active:scale-95 transition-all"
                >
                    Retour au Dashboard
                </Button>
            </motion.div>
        </div>
    );
  }

  const currentQuestion = quiz.questions[currentStep];
  const progress = ((currentStep + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <header className="p-6 border-b border-white/10 flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()} className="rounded-xl text-gray-400">
                <ArrowLeft className="w-5 h-5 mr-2" /> Quitter
            </Button>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                    <Timer className="w-4 h-4" /> 04:52
                </div>
                <div className="w-32 bg-white/5 h-2 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="bg-blue-600 h-full rounded-full"
                    />
                </div>
                <span className="text-xs font-bold text-gray-500">{currentStep + 1} / {quiz.questions.length}</span>
            </div>
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center p-6 pb-24">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="max-w-2xl w-full space-y-8"
                >
                    <div className="space-y-4">
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                           <Sparkles className="w-3 h-3" /> Question {currentStep + 1}
                        </span>
                        <h2 className="text-2xl font-bold leading-tight">{currentQuestion.question}</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {currentQuestion.options.map((option, idx) => (
                            <button 
                                key={idx}
                                onClick={() => handleSelectOption(idx)}
                                className={`p-5 rounded-2xl border text-left transition-all relative group overflow-hidden ${
                                    answers[currentStep] === idx 
                                        ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                                        answers[currentStep] === idx ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500'
                                    }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="font-medium">{option}</span>
                                </div>
                                {answers[currentStep] === idx && (
                                    <motion.div layoutId="selection-glow" className="absolute inset-0 bg-blue-500/5" />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 w-full p-6 bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-center">
             <div className="max-w-2xl w-full flex justify-end">
                <Button 
                    onClick={handleNext}
                    disabled={answers[currentStep] === undefined}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 px-10 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                    {currentStep === quiz.questions.length - 1 ? 'Terminer le Quiz' : 'Question Suivante'}
                    <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
             </div>
        </footer>
    </div>
  );
}
