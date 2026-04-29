'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { Zap, Clock, CheckCircle, XCircle, Trophy, Star } from 'lucide-react';

interface Question {
  _id?: string;
  question: string;
  options: string[];
  type: string;
  points: number;
}

interface GradedQuestion {
  question: string;
  options: string[];
  studentAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

interface QuestResult {
  score: number;
  total: number;
  percentage: number;
  xpEarned: number;
  totalXP: number;
  streak: number;
  newMilestones: { label: string; icon: string }[];
  gradedQuestions: GradedQuestion[];
}

interface QuestModalProps {
  questId: string;
  subjectName: string;
  questions: Question[];
  secondsPerQuestion: number;
  onSubmit: (answers: (string | null)[], timeTaken: number) => Promise<QuestResult>;
  onClose: () => void;
}

/* ─── Circular Timer ── */
function CircularTimer({ seconds, total, urgent }: { seconds: number; total: number; urgent: boolean }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const progress = seconds / total;
  return (
    <svg width="72" height="72" className="rotate-[-90deg]">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#1f1f1f" strokeWidth="5" />
      <motion.circle
        cx="36" cy="36" r={r} fill="none"
        stroke={urgent ? '#f43f5e' : seconds <= total * 0.4 ? '#fb923c' : '#6366f1'}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - progress)}
        transition={{ duration: 0.9, ease: 'linear' }}
      />
      <text x="36" y="40" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" className="rotate-[90deg]"
        style={{ transform: 'rotate(90deg)', transformOrigin: '36px 36px' }}>
        {seconds}
      </text>
    </svg>
  );
}

/* ─── XP Burst Particles ── */
function XPBurst({ show }: { show: boolean }) {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const rad = (angle * Math.PI) / 180;
    return { x: Math.cos(rad) * 70, y: Math.sin(rad) * 70, color: i % 3 === 0 ? '#facc15' : i % 3 === 1 ? '#6366f1' : '#f43f5e' };
  });
  return (
    <AnimatePresence>
      {show && particles.map((p, i) => (
        <motion.div key={i} className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{ background: p.color, boxShadow: `0 0 6px ${p.color}`, left: '50%', top: '50%' }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
          exit={{}}
          transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.02 }}
        />
      ))}
    </AnimatePresence>
  );
}

/* ─── Result Screen ── */
function ResultScreen({ result, onClose }: { result: QuestResult; onClose: () => void }) {
  const [displayXP, setDisplayXP] = useState(0);
  const grade = result.percentage >= 90 ? 'S' : result.percentage >= 75 ? 'A' : result.percentage >= 60 ? 'B' : 'C';
  const gradeColor = grade === 'S' ? 'text-yellow-400' : grade === 'A' ? 'text-green-400' : grade === 'B' ? 'text-blue-400' : 'text-gray-400';

  useEffect(() => {
    let current = 0;
    const step = Math.ceil(result.xpEarned / 40);
    const interval = setInterval(() => {
      current = Math.min(current + step, result.xpEarned);
      setDisplayXP(current);
      if (current >= result.xpEarned) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [result.xpEarned]);

  return (
    <motion.div className="flex flex-col items-center justify-center h-full gap-8 px-6 text-center"
      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>

      {/* Grade badge */}
      <motion.div className="relative" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="absolute inset-0 blur-3xl opacity-40" style={{ background: grade === 'S' ? '#facc15' : '#6366f1' }} />
        <div className={cn('relative text-[120px] font-black leading-none', gradeColor)}
          style={{ textShadow: `0 0 40px currentColor`, filter: 'drop-shadow(0 0 30px currentColor)' }}>
          {grade}
        </div>
      </motion.div>

      {/* Score */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-1">
        <p className="text-white/60 text-sm font-bold uppercase tracking-widest">Score</p>
        <p className="text-5xl font-black text-white">{result.score} <span className="text-white/30 text-3xl">/ {result.total}</span></p>
        <p className="text-white/50 text-sm">{result.percentage}% de réussite</p>
      </motion.div>

      {/* XP counter */}
      <motion.div className="relative flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-8 py-4"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <XPBurst show={displayXP === result.xpEarned} />
        <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
        <span className="text-3xl font-black text-yellow-400">+{displayXP} XP</span>
      </motion.div>

      {/* Streak */}
      {result.streak >= 2 && (
        <motion.div className="flex items-center gap-2 text-orange-400 font-bold"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          🔥 {result.streak} jours consécutifs — bonus ×1.5 appliqué !
        </motion.div>
      )}

      {/* New milestones */}
      {result.newMilestones.map((ms, i) => (
        <motion.div key={ms.label} className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-2 text-purple-300 font-bold"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }}>
          <Trophy className="w-4 h-4" /> Nouveau palier débloqué : {ms.label} !
        </motion.div>
      ))}

      {/* Review */}
      <motion.div className="w-full space-y-2 max-h-48 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
        {result.gradedQuestions.map((q, i) => (
          <div key={i} className={cn('flex items-start gap-3 p-3 rounded-xl text-left text-sm',
            q.isCorrect ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20')}>
            {q.isCorrect ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <p className="text-white/80 font-medium line-clamp-1">{q.question}</p>
              {!q.isCorrect && <p className="text-green-400 text-xs mt-0.5">✓ {q.correctAnswer}</p>}
            </div>
          </div>
        ))}
      </motion.div>

      <motion.button onClick={onClose}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-lg transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        Terminer
      </motion.button>
    </motion.div>
  );
}

/* ─── Main Quest Modal ── */
export function QuestModal({ questId, subjectName, questions, secondsPerQuestion, onSubmit, onClose }: QuestModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(Array(questions.length).fill(null));
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(secondsPerQuestion);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [shake, setShake] = useState(false);
  const [result, setResult] = useState<QuestResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQ = questions[currentIdx];
  const isUrgent = timeLeft <= 5;

  const advance = useCallback(async (finalSelected: string | null) => {
    setRevealed(true);
    const newAnswers = [...answers];
    newAnswers[currentIdx] = finalSelected;
    setAnswers(newAnswers);

    // Combo tracking: skipped (timeout) resets streak
    if (!finalSelected) {
      setCombo(0);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } else {
      setCombo(c => c + 1);
    }

    await new Promise(r => setTimeout(r, 1200));

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setRevealed(false);
      setTimeLeft(secondsPerQuestion);
    } else {
      // Final submit
      setSubmitting(true);
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
      const res = await onSubmit(newAnswers, timeTaken);
      setResult(res);
      setSubmitting(false);
    }
  }, [answers, currentIdx, currentQ, questions, onSubmit, secondsPerQuestion]);

  // Countdown
  useEffect(() => {
    if (revealed || result) return;
    setTimeLeft(secondsPerQuestion);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); advance(null); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [currentIdx, revealed, result]);

  const handleSelect = (option: string) => {
    if (revealed) return;
    setSelected(option);
    clearInterval(timerRef.current!);
    advance(option);
  };

  const getOptionStyle = (option: string) => {
    if (!revealed) {
      return selected === option
        ? 'border-indigo-500 bg-indigo-500/20 text-white'
        : 'border-white/10 bg-white/5 text-white/80 hover:border-indigo-400/50 hover:bg-indigo-500/10';
    }
    // After selecting — just highlight the choice, correctness revealed on result screen
    if (option === selected) return 'border-indigo-400 bg-indigo-500/25 text-white';
    return 'border-white/5 bg-white/5 text-white/30';
  };

  return (
    <motion.div className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <motion.div className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
        style={{ minHeight: '600px', maxHeight: '90vh' }}
        initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)' }} />

        {result ? (
          <div className="flex-1 overflow-y-auto py-8">
            <ResultScreen result={result} onClose={onClose} />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-indigo-400">{subjectName}</p>
                <p className="text-white/50 text-xs mt-0.5">Question {currentIdx + 1} sur {questions.length}</p>
              </div>
              <CircularTimer seconds={timeLeft} total={secondsPerQuestion} urgent={isUrgent} />
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 px-6 pt-4">
              {questions.map((_, i) => (
                <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300',
                  i < currentIdx ? 'bg-indigo-500' : i === currentIdx ? 'bg-indigo-400 animate-pulse' : 'bg-white/10')} />
              ))}
            </div>

            {/* Combo banner */}
            <AnimatePresence>
              {combo >= 2 && (
                <motion.div className="mx-6 mt-3 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 font-black text-sm">COMBO ×{combo} ! Bonus actif</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div key={currentIdx} className="flex-1 flex flex-col px-6 py-6 gap-4"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}>

                <motion.p className="text-xl font-bold text-white leading-snug"
                  animate={shake ? { x: [-8, 8, -6, 6, 0] } : {}}
                  transition={{ duration: 0.4 }}>
                  {currentQ.question}
                </motion.p>

                <div className="grid grid-cols-1 gap-3 mt-2">
                  {currentQ.options.map((opt, i) => (
                    <motion.button key={opt} onClick={() => handleSelect(opt)} disabled={revealed}
                      className={cn('relative text-left px-5 py-4 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 overflow-hidden', getOptionStyle(opt))}
                      whileHover={!revealed ? { scale: 1.02, x: 4 } : {}}
                      whileTap={!revealed ? { scale: 0.98 } : {}}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}>
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-white/40">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="pl-9">{opt}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Submitting overlay */}
            {submitting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
