'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RefreshCcw,
  Trophy,
  BrainCircuit,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

interface Question {
  _id?: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizPlayerProps {
  quizId?: string; // If loading an existing quiz
  courseId?: string; // If generating a new quiz
  onComplete: () => void;
  onCancel: () => void;
}

export function QuizPlayer({ quizId, courseId, onComplete, onCancel }: QuizPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [quizDetails, setQuizDetails] = useState<{ _id: string, title: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const initQuiz = async () => {
      try {
        setLoading(true);
        if (quizId) {
          // TODO: Fetch existing quiz if needed
          // For now, assume generated fresh
        } else if (courseId) {
          // Generate new
          const res = await api.post('/ai/quiz', { classId: courseId, difficulty: 'Medium', questionCount: 5 });
          if (res.data.success) {
             setQuizDetails({ _id: res.data.data._id, title: res.data.data.title });
             setQuestions(res.data.data.questions);
          }
        }
      } catch (err) {
        setError("Erreur lors de la préparation du quiz.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initQuiz();
  }, [quizId, courseId]);

  const handleSelect = (option: string) => {
    if (showExplanation) return; // Prevent changing answer
    setSelectedOption(option);
  };

  const handleCheck = () => {
    if (!selectedOption) return;
    
    const isCorrect = selectedOption === questions[currentIndex].correctAnswer;
    if (isCorrect) setScore(s => s + 1);
    
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsFinished(true);
    if (!quizDetails?._id) return;

    try {
      setSaving(true);
      await api.put(`/ai/quiz/${quizDetails._id}/submit`, { score });
    } catch (err) {
      console.error('Failed to save score', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#111111] rounded-3xl border border-[#222222]">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Génération du Quiz</h3>
        <p className="text-gray-400">L'IA analyse vos cours pour créer des questions pertinentes...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="p-12 text-center bg-[#111111] rounded-3xl border border-red-500/20">
        <p className="text-red-400 mb-4">{error || "Aucune question trouvée."}</p>
        <Button onClick={onCancel} variant="outline" className="text-white border-[#333333]">Retour</Button>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111111] border border-[#222222] rounded-3xl p-8 overflow-hidden relative text-center"
      >
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
           <Trophy className="w-12 h-12 text-green-400" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">Quiz Terminé !</h2>
        <p className="text-gray-400 mb-8">Voici votre résultat pour : {quizDetails?.title}</p>
        
        <div className="flex justify-center gap-8 mb-8">
           <div className="text-center">
              <div className="text-5xl font-black text-white mb-1">{score}<span className="text-2xl text-gray-500">/{questions.length}</span></div>
              <div className="text-sm text-gray-500 uppercase font-bold tracking-wider">Score</div>
           </div>
           <div className="w-px bg-[#222222]" />
           <div className="text-center">
              <div className={cn("text-5xl font-black mb-1", percentage >= 80 ? "text-green-400" : percentage >= 50 ? "text-yellow-400" : "text-red-400")}>
                {percentage}%
              </div>
              <div className="text-sm text-gray-500 uppercase font-bold tracking-wider">Précision</div>
           </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
           <Button onClick={onCancel} className="bg-[#222222] text-white hover:bg-[#333333] border-0 h-12 px-8 rounded-xl font-bold">
             Terminer
           </Button>
           <Button onClick={onComplete} className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white h-12 px-8 border-0 shadow-lg rounded-xl font-bold">
             Voir l'historique
           </Button>
        </div>
        
        {saving && <p className="text-xs text-purple-400 mt-4 animate-pulse">Enregistrement de votre score...</p>}
      </motion.div>
    );
  }

  const question = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-3xl overflow-hidden shadow-xl max-w-3xl mx-auto flex flex-col">
      {/* Progress Bar */}
      <div className="h-2 bg-[#222222] w-full">
        <motion.div 
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
          initial={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="p-6 md:p-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-2 text-purple-400 font-medium text-sm">
             <BrainCircuit className="w-4 h-4" />
             {quizDetails?.title || 'Quiz IA'}
           </div>
           <div className="text-sm font-bold text-gray-500">
             Question {currentIndex + 1} / {questions.length}
           </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white leading-tight">
            {question.questionText}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3 flex-1">
          <AnimatePresence mode="popLayout">
            {question.options.map((opt, i) => {
              const isSelected = selectedOption === opt;
              const isCorrect = opt === question.correctAnswer;
              
              let stateClass = "bg-[#1a1a1a] border-[#333333] hover:border-purple-500/50 hover:bg-[#222222] text-gray-200";
              
              if (showExplanation) {
                if (isCorrect) {
                  stateClass = "bg-green-500/10 border-green-500 text-green-100";
                } else if (isSelected && !isCorrect) {
                  stateClass = "bg-red-500/10 border-red-500 text-red-100";
                } else {
                  stateClass = "bg-[#1a1a1a] border-[#222222] text-gray-500 opacity-50";
                }
              } else if (isSelected) {
                stateClass = "bg-purple-500/20 border-purple-500 text-white";
              }

              return (
                <motion.button
                  key={opt}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleSelect(opt)}
                  disabled={showExplanation}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border-2 transition-all font-medium flex items-center justify-between",
                    stateClass
                  )}
                >
                  <span>{opt}</span>
                  {showExplanation && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {showExplanation && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm"
            >
              <p className="font-bold mb-1 text-blue-400">Explication :</p>
              <p>{question.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-[#222222] flex justify-between items-center">
          <Button variant="ghost" className="text-gray-500 hover:text-white" onClick={onCancel}>
            Quitter
          </Button>

          {!showExplanation ? (
            <Button 
              onClick={handleCheck} 
              disabled={!selectedOption}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-8 h-12 font-bold"
            >
              Valider
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              className="bg-white text-black hover:bg-gray-200 rounded-xl px-8 h-12 font-bold"
            >
              {currentIndex < questions.length - 1 ? 'Question Suivante' : 'Terminer le Quiz'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
