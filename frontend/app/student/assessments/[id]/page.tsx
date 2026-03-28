'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../lib/axios';
import {
  FileText,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../../components/ui/button';
import Link from 'next/link';
import { cn } from '../../../../lib/utils';
import { useParams, useRouter } from 'next/navigation';

export default function StudentTakeAssessmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [assessment, setAssessment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        // Step 1: Get Details
        const res = await api.get(`/student/assessments/${id}`);
        if (res.data.success) {
          setAssessment(res.data.data);
          
          // Step 2: Start / Resume submission
          // In a real flow, this would check if a submission already exists, else create one
          const startRes = await api.post(`/student/assessments/${id}/start`);
          if (startRes.data.success) {
            setSubmission(startRes.data.data);
            // Restore previous answers if any
            const restoredAnswers: Record<string, string> = {};
            startRes.data.data.answers?.forEach((a: any) => {
              if (a.answer) restoredAnswers[a.questionId] = a.answer;
            });
            setAnswers(restoredAnswers);
          }
        }
      } catch (error) {
        console.error('Error fetching assessment:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAssessment();
  }, [id]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Update the submission draft
      const submissionAnswers = assessment.questions.map((q: any) => ({
        questionId: q._id,
        answer: answers[q._id] || null
      }));

      // In real scenario, we might need a separate endpoint to update draft answers before submit
      
      const res = await api.post(`/student/assessments/${submission._id}/submit`, {
        answers: submissionAnswers
      });

      if (res.data.success) {
        router.push('/student/assessments?tab=completed');
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-center space-y-4">
        <AlertTriangle className="w-16 h-16 text-yellow-500" />
        <h2 className="text-2xl font-bold text-white">Évaluation introuvable</h2>
        <Button onClick={() => router.push('/student/assessments')} variant="outline" className="border-[#333333] text-white">
          Retour
        </Button>
      </div>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / assessment.questions.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
      {/* Quiz Header */}
      <div className="h-16 border-b border-[#222222] bg-[#111111] flex flex-col justify-center px-6 relative shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">{assessment.title}</h1>
            <p className="text-xs text-gray-400">Question {currentQuestionIndex + 1} sur {assessment.questions.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20">
              <Clock className="w-4 h-4" />
              <span>{assessment.duration || 30}:00</span> {/* Timer logic would go here */}
            </div>
            <Button 
               onClick={() => setShowConfirm(true)}
               className="bg-orange-600 hover:bg-orange-500 text-white font-medium shadow-lg shadow-orange-500/20"
            >
              Terminer & Soumettre
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 bg-orange-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 relative">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Question Info */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-orange-400 font-bold tracking-widest text-xs uppercase px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    {currentQuestion.type === 'mcq' ? 'QCM' : currentQuestion.type === 'true-false' ? 'Vrai ou Faux' : 'Question Courte'}
                  </span>
                  <span className="text-gray-500 text-sm font-medium">{currentQuestion.points || 1} Point(s)</span>
                </div>

                <h2 className="text-2xl lg:text-3xl font-bold text-white leading-relaxed">
                  {currentQuestion.question}
                </h2>

                {/* Options */}
                <div className="space-y-3 mt-8">
                  {currentQuestion.options?.map((option: string, idx: number) => {
                     const isSelected = answers[currentQuestion._id] === option;
                     return (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(currentQuestion._id, option)}
                        className={cn(
                          "w-full p-5 flex items-center gap-4 border rounded-2xl text-left transition-all",
                          isSelected 
                            ? "bg-orange-500/10 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.15)]" 
                            : "bg-[#111111] border-[#333333] hover:border-gray-500 text-gray-300 hover:bg-[#1a1a1a]"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected ? "border-orange-500" : "border-gray-600"
                        )}>
                          {isSelected && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
                        </div>
                        <span className="text-lg">{option}</span>
                      </button>
                     );
                  })}

                  {currentQuestion.type === 'short-answer' && (
                    <textarea 
                      value={answers[currentQuestion._id] || ''}
                      onChange={(e) => handleAnswerSelect(currentQuestion._id, e.target.value)}
                      placeholder="Saisissez votre réponse ici..."
                      className="w-full bg-[#111111] border border-[#333333] rounded-2xl p-5 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 min-h-[200px] text-lg resize-none"
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="hidden lg:flex flex-col w-80 bg-[#111111] border-l border-[#222222]">
          <div className="p-6 border-b border-[#222222]">
            <h3 className="text-lg font-bold text-white mb-2">Navigation</h3>
            <p className="text-sm text-gray-500 flex items-center justify-between">
              <span>Répondues: {answeredCount}</span>
              <span>Total: {assessment.questions.length}</span>
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-5 gap-3">
               {assessment.questions.map((q: any, i: number) => {
                 const isAnswered = !!answers[q._id];
                 const isCurrent = currentQuestionIndex === i;
                 return (
                   <button
                     key={q._id}
                     onClick={() => setCurrentQuestionIndex(i)}
                     className={cn(
                       "aspect-square rounded-xl font-bold flex items-center justify-center transition-all",
                       isCurrent ? "bg-orange-500 text-white shadow-lg ring-2 ring-orange-500 ring-offset-2 ring-offset-[#111111]" :
                       isAnswered ? "bg-[#222222] text-gray-300 border border-[#444444]" :
                       "bg-transparent border border-[#333333] text-gray-600 hover:border-gray-500 hover:text-gray-400"
                     )}
                   >
                     {i + 1}
                   </button>
                 );
               })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="h-20 border-t border-[#222222] bg-[#111111] flex justify-between items-center px-6 lg:px-12 shrink-0">
         <Button 
            variant="outline" 
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="border-[#333333] text-white hover:bg-[#222222] gap-2 lg:px-8 h-12 rounded-xl"
         >
            <ChevronLeft className="w-4 h-4" /> Précédent
         </Button>

         <div className="lg:hidden text-sm font-bold text-gray-400">
           {currentQuestionIndex + 1} / {assessment.questions.length}
         </div>

         <Button 
            onClick={() => {
              if (currentQuestionIndex < assessment.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
              } else {
                setShowConfirm(true);
              }
            }}
            className={cn(
              "gap-2 lg:px-8 h-12 rounded-xl font-bold transition-all",
              currentQuestionIndex === assessment.questions.length - 1 
                ? "bg-orange-600 hover:bg-orange-500 text-white" 
                : "bg-white text-black hover:bg-gray-200"
            )}
         >
            {currentQuestionIndex === assessment.questions.length - 1 ? 'Soumettre' : 'Suivant'}
            {currentQuestionIndex !== assessment.questions.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
         </Button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] border border-[#333333] rounded-3xl p-8 max-w-sm w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <CheckCircle2 className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-2">Prêt à soumettre ?</h3>
            
            {answeredCount < assessment.questions.length ? (
              <p className="text-center text-gray-400 mb-6">
                Attention, vous avez répondu à <strong className="text-white">{answeredCount}</strong> questions sur <strong className="text-white">{assessment.questions.length}</strong>. Vous pouvez y retourner pour compléter.
              </p>
            ) : (
              <p className="text-center text-gray-400 mb-6">
                Vous avez répondu à toutes les questions. Confirmez-vous la soumission définitive de cette évaluation ?
              </p>
            )}

            <div className="space-y-3">
              <Button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white h-12 rounded-xl font-bold"
              >
                {submitting ? 'Soumission...' : 'Confirmer et Soumettre'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowConfirm(false)}
                className="w-full text-gray-400 hover:text-white hover:bg-[#222222] h-12 rounded-xl"
              >
                Retour au Quiz
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
