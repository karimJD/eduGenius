'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Swords, Trophy, Zap, Flame, Star, Play, CheckCircle, Clock, Medal, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../components/student/PageHeader';
import { QuestModal } from '../../../components/student/QuestModal';
import { arenaApi } from '../../../lib/api/arena';
import { useAuth } from '../../../context/AuthContext';
import { cn } from '../../../lib/utils';

/* ── Types ─────────────────────────────────────────────── */
interface Challenge { _id: string; title: string; weekEnd: string; milestones: { xp: number; label: string; icon: string }[]; questsConfig: { secondsPerQuestion: number } }
interface Quest { _id: string; questIndex: number; subjectName: string; status: 'pending' | 'in_progress' | 'completed'; xpEarned: number; score: number; totalQuestions: number }
interface LeaderEntry { rank: number; studentId?: string; name: string; avatar: string; totalXP: number; completedQuests: number; streak: number; milestones: string[]; isMe: boolean }
interface Progress { totalXP: number; completedQuestsCount: number; currentStreak: number; longestStreak: number; milestonesReached: string[]; rank: number }

/* ── Countdown timer hook ───────────────────────────────── */
function useCountdown(deadline: string | undefined) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setParts({ d: 0, h: 0, m: 0, s: 0 }); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setParts(prev =>
        prev.d === d && prev.h === h && prev.m === m && prev.s === s ? prev : { d, h, m, s }
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return parts;
}

/* ── Intro splash ───────────────────────────────────────── */
function ArenaIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'approach' | 'clash' | 'text' | 'out'>('approach');
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('clash'), 900);
    const t2 = setTimeout(() => setPhase('text'), 1400);
    const t3 = setTimeout(() => setPhase('out'), 2900);
    const t4 = setTimeout(() => onDone(), 3500);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [onDone]);
  const clashed = phase !== 'approach';
  const showText = phase === 'text' || phase === 'out';
  const particles = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * 360; const r = (a * Math.PI) / 180; return { x: Math.cos(r) * 120, y: Math.sin(r) * 120, color: i % 3 === 0 ? '#f43f5e' : i % 3 === 1 ? '#fb923c' : '#facc15' }; });
  return (
    <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #1a0a1e 0%, #0a0010 55%, #000 100%)' }}
      animate={phase === 'out' ? { opacity: 0, scale: 1.06 } : { opacity: 1 }}
      transition={{ duration: 0.6 }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.6) 2px,rgba(255,255,255,0.6) 4px)' }} />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(244,63,94,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(244,63,94,0.07) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

      {/* Sword */}
      <motion.div className="absolute" initial={{ x: '-55vw', y: '-30vh', rotate: 45, opacity: 0 }}
        animate={clashed ? { x: 0, y: 0, rotate: 45, opacity: 1 } : { x: '-55vw', y: '-30vh', rotate: 45, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
        <div className="absolute inset-0 blur-2xl opacity-60" style={{ background: 'radial-gradient(circle,#f43f5e,transparent 70%)' }} />
        <svg width="180" height="36" viewBox="0 0 120 24" fill="none" style={{ filter: 'drop-shadow(0 0 14px #f43f5e)' }}>
          <polygon points="0,12 100,6 110,12 100,18" fill="url(#sg)" /><rect x="96" y="4" width="8" height="16" rx="2" fill="#fb923c" /><rect x="104" y="9" width="16" height="6" rx="3" fill="#7c3aed" />
          <defs><linearGradient id="sg" x1="0" y1="0" x2="120" y2="0"><stop offset="0%" stopColor="#e2e8f0" /><stop offset="100%" stopColor="#f8fafc" /></linearGradient></defs>
        </svg>
      </motion.div>

      {/* Pencil */}
      <motion.div className="absolute" initial={{ x: '55vw', y: '30vh', rotate: -45, opacity: 0 }}
        animate={clashed ? { x: 0, y: 0, rotate: -45, opacity: 1 } : { x: '55vw', y: '30vh', rotate: -45, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
        <div className="absolute inset-0 blur-2xl opacity-60" style={{ background: 'radial-gradient(circle,#a78bfa,transparent 70%)' }} />
        <svg width="180" height="36" viewBox="0 0 120 24" fill="none" style={{ filter: 'drop-shadow(0 0 14px #a78bfa)' }}>
          <rect x="10" y="8" width="90" height="8" rx="2" fill="#facc15" /><polygon points="10,8 0,12 10,16" fill="#f97316" /><rect x="100" y="8" width="16" height="8" rx="2" fill="#f9a8d4" /><rect x="97" y="8" width="5" height="8" fill="#9ca3af" />
        </svg>
      </motion.div>

      {/* Sparks */}
      <AnimatePresence>{clashed && particles.map((p, i) => (
        <motion.div key={i} className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }} />
      ))}</AnimatePresence>

      {/* Text */}
      <AnimatePresence>{showText && (
        <motion.div className="absolute flex flex-col items-center gap-3" style={{ top: '58%' }}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: '#f43f5e' }}>Bienvenue dans</p>
          <h1 className="text-7xl font-black uppercase" style={{ background: 'linear-gradient(135deg,#fff 0%,#fca5a5 40%,#a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 24px rgba(244,63,94,0.6))' }}>L'ARENA</h1>
          <motion.div className="h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg,#f43f5e,#a78bfa,#f43f5e)' }} initial={{ width: 0 }} animate={{ width: 260 }} transition={{ duration: 0.5 }} />
          <p className="text-sm font-bold text-white/60 tracking-widest uppercase">Que le meilleur gagne</p>
        </motion.div>
      )}</AnimatePresence>
    </motion.div>
  );
}

/* ── Countdown unit ──────────────────────────────────────── */
function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl font-black text-foreground dark:text-white tabular-nums">{String(value).padStart(2, '0')}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{label}</div>
    </div>
  );
}

/* ── Quest Card ─────────────────────────────────────────── */
function QuestCard({ quest, onStart, delay }: { quest: Quest; onStart: () => void; delay: number }) {
  const subjectColors = ['from-indigo-600 to-purple-700', 'from-rose-600 to-orange-600', 'from-emerald-600 to-teal-700'];
  const grad = subjectColors[(quest.questIndex - 1) % 3];
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      className={cn('relative rounded-3xl overflow-hidden border transition-all group', quest.status === 'completed' ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-card hover:border-primary/20')}>
      <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', grad)} />
      <div className="p-6 flex items-center gap-5">
        {/* Icon */}
        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br text-white font-black text-lg shadow-lg', grad)}>
          {quest.status === 'completed' ? <CheckCircle className="w-7 h-7" /> : quest.questIndex}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Quête {quest.questIndex}</p>
          <h3 className="text-lg font-bold text-foreground truncate">{quest.subjectName}</h3>
          {quest.status === 'completed' && (
            <p className="text-sm text-green-500 dark:text-green-400 font-semibold mt-0.5">+{quest.xpEarned} XP · {quest.score}/{quest.totalQuestions} ✓</p>
          )}
          {quest.status !== 'completed' && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> 5 questions · Récompense XP</p>
          )}
        </div>
        {/* Action */}
        {quest.status === 'pending' && (
          <button onClick={onStart} className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-500/20 text-sm">
            <Play className="w-4 h-4 fill-white" /> Jouer
          </button>
        )}
        {quest.status === 'in_progress' && (
          <button onClick={onStart} className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all active:scale-95 text-sm">
            <RefreshCw className="w-4 h-4" /> Reprendre
          </button>
        )}
        {quest.status === 'completed' && <CheckCircle className="w-7 h-7 text-green-500 dark:text-green-400 shrink-0" />}
      </div>
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */
export default function ArenaPage() {
  const { user } = useAuth();
  const [introVisible, setIntroVisible] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuest, setActiveQuest] = useState<{ quest: Quest; questions: any[]; secondsPerQuestion: number } | null>(null);
  const countdown = useCountdown(challenge?.weekEnd);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cRes, qRes, lRes, pRes] = await Promise.allSettled([
        arenaApi.getChallenge(), arenaApi.getTodayQuests(), arenaApi.getLeaderboard(), arenaApi.getMyProgress()
      ]);
      if (cRes.status === 'fulfilled' && cRes.value.data.success) setChallenge(cRes.value.data.data);
      if (qRes.status === 'fulfilled' && qRes.value.data.success) setQuests(qRes.value.data.data || []);
      if (lRes.status === 'fulfilled' && lRes.value.data.success) setLeaderboard(lRes.value.data.data || []);
      if (pRes.status === 'fulfilled' && pRes.value.data.success) setProgress(pRes.value.data.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!introVisible) load(); }, [introVisible, load]);

  const handleStartQuest = async (quest: Quest) => {
    try {
      const res = await arenaApi.startQuest(quest._id);
      if (res.data.success) {
        setActiveQuest({ quest, questions: res.data.data.questions, secondsPerQuestion: res.data.data.secondsPerQuestion });
      }
    } catch (e) { console.error(e); }
  };

  const handleSubmitQuest = async (answers: (string | null)[], timeTaken: number) => {
    const res = await arenaApi.submitQuest(activeQuest!.quest._id, answers, timeTaken);
    await load();
    return res.data.data;
  };

  const nextMilestone = challenge?.milestones.find(ms => !progress?.milestonesReached.includes(ms.label));
  const xpToNext = nextMilestone ? nextMilestone.xp - (progress?.totalXP || 0) : 0;
  const milestoneProgress = nextMilestone && progress ? Math.min(100, (progress.totalXP / nextMilestone.xp) * 100) : 100;

  if (introVisible) return <ArenaIntro onDone={() => setIntroVisible(false)} />;

  return (
    <>
      <AnimatePresence>
        {activeQuest && (
          <QuestModal key={activeQuest.quest._id} questId={activeQuest.quest._id} subjectName={activeQuest.quest.subjectName}
            questions={activeQuest.questions} secondsPerQuestion={activeQuest.secondsPerQuestion}
            onSubmit={handleSubmitQuest} onClose={() => setActiveQuest(null)} />
        )}
      </AnimatePresence>

      <div className="space-y-8 pb-12">
        <PageHeader title="L'Arena" description="Complétez vos quêtes quotidiennes, gagnez de l'XP et dominez le classement."
          icon={Swords} badgeText="Compétition & Défis" badgeClassName="bg-rose-500/10 border-rose-500/20 text-rose-500" />

        {/* Stats row */}
        {progress && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'XP Total', value: progress.totalXP.toLocaleString(), icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
              { label: 'Rang', value: `#${progress.rank}`, icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { label: 'Série', value: `${progress.currentStreak}j`, icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: 'Quêtes', value: progress.completedQuestsCount, icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-5 bg-card border border-border rounded-3xl relative overflow-hidden group">
                <div className={cn('absolute -right-3 -top-3 w-16 h-16 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity', s.bg)} />
                <div className="flex justify-between items-start mb-3">
                  <div className={cn('p-2 rounded-xl', s.bg)}><s.icon className={cn('w-4 h-4', s.color)} /></div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
                </div>
                <p className="text-2xl font-black text-foreground">{s.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Challenge + Quests */}
          <div className="lg:col-span-2 space-y-6">

            {/* Weekly challenge card */}
            {challenge && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="relative rounded-[2rem] overflow-hidden border border-indigo-100 dark:border-white/5 p-6 bg-gradient-to-br from-indigo-50 to-rose-50 dark:from-[#1a0a2e] dark:via-[#0f0518] dark:to-[#1a0a0a] shadow-xl shadow-indigo-500/5 dark:shadow-none">
                <div className="absolute inset-0 opacity-40 dark:opacity-20 bg-[radial-gradient(ellipse_at_80%_20%,#f43f5e44_0%,transparent_60%)]" />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-rose-500 dark:text-rose-400 mb-1">Défi de la semaine</p>
                    <h2 className="text-xl sm:text-2xl font-black text-foreground dark:text-white mb-4">{challenge.title}</h2>
                    {/* Countdown */}
                    <div className="flex items-center gap-4">
                      <Clock className="w-4 h-4 text-muted-foreground dark:text-white/40" />
                      <div className="flex items-center gap-3">
                        <TimeUnit value={countdown.d} label="Jours" />
                        <span className="text-muted-foreground/30 dark:text-white/30 font-bold text-xl">:</span>
                        <TimeUnit value={countdown.h} label="Heures" />
                        <span className="text-muted-foreground/30 dark:text-white/30 font-bold text-xl">:</span>
                        <TimeUnit value={countdown.m} label="Min" />
                        <span className="text-muted-foreground/30 dark:text-white/30 font-bold text-xl">:</span>
                        <TimeUnit value={countdown.s} label="Sec" />
                      </div>
                    </div>
                  </div>
                  {/* Milestone progress */}
                  {nextMilestone && progress && (
                    <div className="shrink-0 flex flex-col items-center gap-2 min-w-[140px] p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 backdrop-blur-sm">
                      <p className="text-[10px] text-muted-foreground dark:text-white/40 font-bold uppercase tracking-wider">Prochain palier</p>
                      <div className="text-3xl">🎯</div>
                      <p className="text-foreground dark:text-white font-black text-sm">{nextMilestone.label}</p>
                      <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#f43f5e,#a78bfa)' }}
                          initial={{ width: 0 }} animate={{ width: `${milestoneProgress}%` }} transition={{ duration: 1, delay: 0.5 }} />
                      </div>
                      <p className="text-muted-foreground dark:text-white/40 text-[10px] font-bold">{Math.max(0, xpToNext)} XP restants</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Milestones timeline */}
            {challenge && progress && (
              <div className="flex items-center gap-0">
                {challenge.milestones.map((ms, i) => {
                  const reached = progress.milestonesReached.includes(ms.label);
                  return (
                    <div key={ms.label} className="flex items-center flex-1">
                      <div className={cn('flex flex-col items-center gap-1.5 flex-1')}>
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all', reached ? 'border-yellow-500 bg-yellow-500/20' : 'border-border bg-secondary')}>
                          {reached ? '✅' : ms.icon === 'shield' ? '🛡️' : ms.icon === 'book' ? '📖' : '👑'}
                        </div>
                        <p className={cn('text-[10px] font-black uppercase tracking-wide', reached ? 'text-yellow-500' : 'text-muted-foreground')}>{ms.label}</p>
                        <p className="text-[9px] text-muted-foreground/60">{ms.xp} XP</p>
                      </div>
                      {i < challenge.milestones.length - 1 && (
                        <div className={cn('h-0.5 flex-1 transition-all', progress.totalXP >= challenge.milestones[i + 1].xp ? 'bg-yellow-500/60' : 'bg-border')} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Daily quests */}
            <div>
              <h2 className="text-lg font-black text-foreground dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Quêtes du jour
              </h2>
              {loading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-3xl bg-secondary/50 animate-pulse" />)}</div>
              ) : quests.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-3xl">
                  <Swords className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-bold">Aucune quête disponible — revenez demain !</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quests.map((q, i) => (
                    <QuestCard key={q._id} quest={q} onStart={() => handleStartQuest(q)} delay={i * 0.1} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Leaderboard */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-[2.5rem] p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                  <Medal className="w-5 h-5 text-yellow-500" /> Classement
                </h3>
              </div>

              {loading ? (
                <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 rounded-xl bg-secondary/50 animate-pulse" />)}</div>
              ) : leaderboard.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Soyez le premier à jouer !</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 8).map((entry, i) => (
                    <motion.div key={entry.studentId?.toString() || i}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      className={cn('flex items-center gap-3 p-2 rounded-2xl transition-all', entry.isMe ? 'bg-rose-500/10 border border-rose-500/20' : 'hover:bg-secondary/50')}>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0',
                        entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : entry.rank === 2 ? 'bg-gray-400/20 text-gray-600 dark:text-gray-400' : entry.rank === 3 ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' : 'bg-secondary text-muted-foreground')}>
                        {entry.rank}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {entry.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-bold truncate', entry.isMe ? 'text-rose-500 dark:text-rose-400' : 'text-foreground')}>{entry.name}{entry.isMe ? ' (moi)' : ''}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{entry.totalXP.toLocaleString()} XP · {entry.completedQuests} quêtes</p>
                      </div>
                      {entry.streak >= 2 && <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
