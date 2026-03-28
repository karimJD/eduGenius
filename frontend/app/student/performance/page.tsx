'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/axios';
import {
  TrendingUp,
  Award,
  BookOpen,
  Target,
  BarChart3,
  ChevronUp,
  Star
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Grade {
  _id: string;
  quizId?: { title: string; courseId: { name: string } };
  score: number;
  totalQuestions: number;
  completedAt: string;
}

interface PerformanceData {
  gpa: number;
  totalXP: number;
  completedClasses: number;
  attendanceRate: number;
  recentGrades: {
    subject: string;
    title: string;
    score: number;
    max: number;
    date: string;
  }[];
  subjectAverages: {
    subject: string;
    average: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

export default function StudentPerformancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        // Fetch real grades and attendance
        const [gradesRes, attendanceRes] = await Promise.all([
          api.get('/student/performance/grades'),
          api.get('/student/performance/attendance')
        ]);

        const grades: Grade[] = gradesRes.data;
        const attendance = attendanceRes.data;

        // Compute GPA
        let totalScore = 0;
        let totalMax = 0;
        const subjectScores: Record<string, { total: number, count: number }> = {};
        
        const recentGrades = grades.slice(0, 5).map(g => {
           const subject = g.quizId?.courseId?.name || 'Quiz AI';
           const max = g.totalQuestions;
           // normalize to /20 for gpa calculation if we want, or just raw
           const normalizedScore = (g.score / max) * 20;

           if (!subjectScores[subject]) subjectScores[subject] = { total: 0, count: 0 };
           subjectScores[subject].total += normalizedScore;
           subjectScores[subject].count += 1;

           totalScore += normalizedScore;
           totalMax += 20;

           return {
              subject,
              title: g.quizId?.title || 'Exercice généré',
              score: g.score,
              max: g.totalQuestions,
              date: g.completedAt
           };
        });

        const gpa = totalMax > 0 ? (totalScore / totalMax) * 20 : 0;
        
        const subjectAverages = Object.entries(subjectScores).map(([sub, data]) => ({
           subject: sub,
           average: data.total / data.count,
           trend: 'stable' as const // Simplified trend for now
        }));

        setPerformanceData({
          gpa: Number(gpa.toFixed(1)),
          totalXP: grades.reduce((acc, g) => acc + (g.score * 10), 0), // Mock XP calculation
          completedClasses: Object.keys(subjectScores).length,
          attendanceRate: attendance.rate || 100, // Fallback if no attendance records
          recentGrades,
          subjectAverages,
        });

      } catch (error) {
        console.error('Error fetching performance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, []);

  if (loading || !performanceData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium w-fit"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Mes Performances</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Vue d'ensemble</h1>
          <p className="text-gray-400 max-w-xl">
            Suivez votre progression, analysez vos résultats et restez au top de vos objectifs.
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111111] border border-[#222222] rounded-3xl p-6 relative overflow-hidden group hover:border-[#333333] transition-all">
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-gray-400 font-medium mb-1 relative z-10">Moyenne Générale</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-4xl font-black text-white">{performanceData.gpa}</h3>
            <span className="text-sm font-medium text-gray-500">/ 20</span>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded-3xl p-6 relative overflow-hidden group hover:border-[#333333] transition-all">
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-400">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <p className="text-gray-400 font-medium mb-1 relative z-10">Total XP</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-4xl font-black text-white">{performanceData.totalXP}</h3>
            <span className="text-sm font-medium text-gray-500">XP</span>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded-3xl p-6 relative overflow-hidden group hover:border-[#333333] transition-all">
          <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <p className="text-gray-400 font-medium mb-1 relative z-10">Matières actives</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-4xl font-black text-white">{performanceData.completedClasses}</h3>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded-3xl p-6 relative overflow-hidden group hover:border-[#333333] transition-all">
          <div className="absolute right-0 top-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-3 bg-green-500/10 rounded-2xl text-green-400">
              <Target className="w-6 h-6" />
            </div>
          </div>
          <p className="text-gray-400 font-medium mb-1 relative z-10">Assiduité</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-4xl font-black text-white">{performanceData.attendanceRate}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <div className="bg-[#111111] border border-[#222222] rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">Dernières Évaluations</h2>
            {performanceData.recentGrades.length > 0 && (
                <button className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors">Tout voir</button>
            )}
          </div>
          
          <div className="space-y-4">
            {performanceData.recentGrades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Aucune évaluation passée.</div>
            ) : (
                performanceData.recentGrades.map((grade, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-2xl border border-[#2b2b2b] hover:border-[#333333] transition-colors">
                    <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#222222] border border-[#333333] flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-base">{grade.title}</h4>
                        <p className="text-xs font-medium text-gray-400 mt-0.5">{grade.subject} • {new Date(grade.date).toLocaleDateString()}</p>
                    </div>
                    </div>
                    <div className="text-right">
                    <div className="text-xl font-bold text-white">{grade.score}<span className="text-sm text-gray-500">/{grade.max}</span></div>
                    </div>
                </div>
                ))
            )}
          </div>
        </div>

        {/* Moyennes par matière */}
        <div className="bg-[#111111] border border-[#222222] rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">Moyennes par Matière</h2>
          </div>

          <div className="space-y-8">
            {performanceData.subjectAverages.length === 0 ? (
                 <div className="text-center py-8 text-gray-500">Aucune moyenne disponible.</div>
            ) : (
                performanceData.subjectAverages.map((subject, idx) => (
                <div key={idx} className="group">
                    <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="font-semibold text-gray-300 group-hover:text-white transition-colors">{subject.subject}</span>
                    <span className="font-bold text-white flex items-center gap-2">
                        {subject.average.toFixed(1)} <span className="text-gray-500 font-medium">/ 20</span>
                    </span>
                    </div>
                    <div className="h-3 w-full bg-[#222222] rounded-full overflow-hidden border border-[#333333]">
                    <div 
                        className="h-full bg-blue-500 rounded-full relative"
                        style={{ width: `${(subject.average / 20) * 100}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 w-1/2 blur-sm" />
                    </div>
                    </div>
                </div>
                ))
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
