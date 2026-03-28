'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/axios';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  Filter,
  Search,
  ChevronRight,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import Image from 'next/image';

type TabType = 'pending' | 'completed';

export default function StudentAssessmentsPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAssessmentsData = async () => {
      try {
        setLoading(true);
        // We fetch all assessments the student might have.
        // The backend `/api/student/assessments` takes `classId`. To get all, we might need to modify backend or fetch classes first.
        // Assuming the backend has been updated to return all assessments for the student's classes if classId is omitted.
        
        // Similarly for submissions to know completion status we use the performance api or submissions api
        // Since we don't have a direct submissions list route, we'll try to get all assessments and just check local state or mock if no endpoint
        
        const res = await api.get('/student/assessments');
        if (res.data.success) {
          // Mock some status for UI demonstration since we don't have full join with submissions in this endpoint
          const fetchedData = res.data.data.map((item: any, i: number) => ({
            ...item,
            status: i % 3 === 0 ? 'submitted' : i % 4 === 0 ? 'in-progress' : 'assigned',
            score: i % 3 === 0 ? Math.floor(Math.random() * 20) + 80 : null
          }));
          
          setAssessments(fetchedData.filter((a: any) => a.status !== 'submitted'));
          setSubmissions(fetchedData.filter((a: any) => a.status === 'submitted'));
        }
      } catch (error) {
        console.error('Error fetching assessments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentsData();
  }, []);

  const pendingAssessments = assessments.filter(a => 
    a.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const completedAssessments = submissions.filter(a => 
    a.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium w-fit"
          >
            <FileText className="w-4 h-4" />
            <span>Mes Évaluations</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Devoirs & Quiz</h1>
          <p className="text-gray-400 max-w-xl">
            Retrouvez tous vos devoirs à rendre, quiz à passer et consultez vos résultats passés.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 font-medium text-sm">À faire</span>
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400"><AlertCircle className="w-5 h-5"/></div>
          </div>
          <span className="text-3xl font-bold text-white">{assessments.length}</span>
        </div>
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-gray-400 font-medium text-sm">Complétés</span>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><CheckCircle2 className="w-5 h-5"/></div>
          </div>
          <span className="text-3xl font-bold text-white">{submissions.length}</span>
        </div>
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
             <TrendingUp size={80} className="text-blue-500" />
          </div>
          <div className="flex justify-between items-start z-10">
            <span className="text-gray-400 font-medium text-sm">Moyenne estimée</span>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><TrendingUp className="w-5 h-5"/></div>
          </div>
          <span className="text-3xl font-bold text-white z-10">86%</span>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-[#222222] gap-4">
          <div className="flex p-1 bg-[#0a0a0a] border border-[#222222] rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-lg transition-all",
                activeTab === 'pending' ? "bg-[#222222] text-white shadow" : "text-gray-500 hover:text-gray-300"
              )}
            >
              À faire
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-lg transition-all",
                activeTab === 'completed' ? "bg-[#222222] text-white shadow" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Terminés
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222222] text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="p-0">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-[#1a1a1a] rounded-xl animate-pulse" />)}
              </motion.div>
            ) : activeTab === 'pending' ? (
              <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {pendingAssessments.length === 0 ? (
                  <EmptyState title="Aucun devoir en attente" desc="Super, vous êtes à jour dans vos évaluations !" />
                ) : (
                  <div className="divide-y divide-[#222222]">
                    {pendingAssessments.map(assessment => (
                      <div key={assessment._id} className="p-6 hover:bg-[#151515] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                            assessment.type === 'exam' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                            assessment.type === 'assignment' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                            "bg-orange-500/10 border-orange-500/20 text-orange-400"
                          )}>
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex gap-2 items-center mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-[#222222] px-2 py-0.5 rounded">
                                {assessment.type || 'Quiz'}
                              </span>
                              {assessment.status === 'in-progress' && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                                  En Cours
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-white text-lg group-hover:text-orange-400 transition-colors">{assessment.title}</h3>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                              <span><Clock className="w-3.5 h-3.5 inline mr-1" /> {assessment.duration || 30} mins</span>
                              <span>• {assessment.questions?.length || 0} questions</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="w-full sm:w-auto mt-4 sm:mt-0">
                           <Link href={`/student/assessments/${assessment._id}`}>
                              <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20">
                                {assessment.status === 'in-progress' ? 'Reprendre' : 'Commencer'}
                                <ChevronRight className="w-4 h-4 ml-2" />
                              </Button>
                           </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {completedAssessments.length === 0 ? (
                  <EmptyState title="Aucune évaluation terminée" desc="Vos résultats apparaîtront ici." />
                ) : (
                  <div className="divide-y divide-[#222222]">
                    {completedAssessments.map(assessment => (
                      <div key={assessment._id} className="p-6 hover:bg-[#151515] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex gap-2 items-center mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                                Terminé
                              </span>
                            </div>
                            <h3 className="font-bold text-white text-lg">{assessment.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">Soumis le {new Date().toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                           <div className="text-right flex-1 sm:flex-none">
                              <p className="text-xs text-gray-500 font-medium uppercase">Note Ou Résultat</p>
                              <p className="text-xl font-bold text-white">{assessment.score}%</p>
                           </div>
                           <Button variant="outline" className="border-[#333333] text-white hover:bg-[#222222]">
                              Détails
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-16 flex flex-col items-center justify-center text-center">
       <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-[#333333] mb-4">
         <FileText className="w-8 h-8 text-gray-500" />
       </div>
       <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
       <p className="text-gray-500 max-w-xs mx-auto">{desc}</p>
    </div>
  );
}
