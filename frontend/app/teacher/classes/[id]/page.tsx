'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users, BookOpen, ClipboardList, Megaphone, ArrowLeft,
  CheckCircle, XCircle, Clock, Video, FileText, BarChart3,
  Calendar, MoreVertical, Mail, GraduationCap
} from 'lucide-react';
import { getClassDetails } from '@/lib/api/teacher';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId?: string;
}

interface ClassDetail {
  _id: string;
  name: string;
  code: string;
  studentIds: Student[];
  departmentId?: { name: string };
  schedule?: any[];
}

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'schedule'>('overview');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await getClassDetails(id);
        setCls(data);
      } catch (err) {
        console.error('Failed to fetch class details:', err);
        toast.error('Erreur lors du chargement des détails de la classe');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetails();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!cls) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <XCircle className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground font-medium">Classe non trouvée ou accès refusé.</p>
      <Button variant="outline" onClick={() => router.push('/teacher/classes')}>Retour aux classes</Button>
    </div>
  );

  const quickLinks = [
    { href: `/teacher/courses?classId=${cls._id}`, label: 'Supports de Cours', icon: BookOpen, color: 'text-emerald-400 bg-emerald-500/10' },
    { href: `/teacher/quizzes?classId=${cls._id}`, label: 'Quiz & Évaluations', icon: ClipboardList, color: 'text-blue-400 bg-blue-500/10' },
    { href: `/teacher/attendance?classId=${cls._id}`, label: 'Gestion Présence', icon: Clock, color: 'text-violet-400 bg-violet-500/10' },
    { href: `/teacher/announcements?classId=${cls._id}`, label: 'Annonces Classe', icon: Megaphone, color: 'text-amber-400 bg-amber-500/10' },
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#111111] border border-[#222222] rounded-[2.5rem] p-8 md:p-12">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4">
                  <Link 
                    href="/teacher/classes" 
                    className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    <ArrowLeft className="w-4 h-4" /> Retour au Dashboard
                  </Link>
                  <div className="space-y-2">
                      <div className="flex items-center gap-3">
                          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{cls.name}</h1>
                          <Badge className="bg-primary/20 text-primary border-primary/20 px-3 py-1 font-black text-xs uppercase shadow-sm">
                              {cls.code}
                          </Badge>
                      </div>
                      {cls.departmentId && (
                          <div className="flex items-center gap-2 text-muted-foreground font-medium">
                              <GraduationCap className="w-4 h-4" />
                              <span>Département de {cls.departmentId.name}</span>
                          </div>
                      )}
                  </div>
              </div>

              <div className="flex flex-wrap gap-4">
                  <div className="bg-background/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl min-w-[120px] text-center">
                      <p className="text-3xl font-black text-white">{cls.studentIds.length}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 text-nowrap">Étudiants</p>
                  </div>
                  <div className="bg-background/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl min-w-[120px] text-center">
                      <p className="text-3xl font-black text-white">{cls.schedule?.length || 0}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 text-nowrap">Séances / Sem</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Area: Quick Links & Stats */}
          <div className="space-y-6">
              <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
                  <h3 className="font-black text-sm uppercase tracking-[0.2em] text-muted-foreground">Outils de Classe</h3>
                  <div className="grid grid-cols-1 gap-3">
                      {quickLinks.map(ql => {
                          const Icon = ql.icon;
                          return (
                              <Link
                                  key={ql.href}
                                  href={ql.href}
                                  className="flex items-center gap-3 p-3 bg-muted/20 border border-border rounded-2xl hover:bg-muted/40 hover:border-primary/20 transition-all group"
                              >
                                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105", ql.color)}>
                                      <Icon className="w-5 h-5" />
                                  </div>
                                  <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">{ql.label}</span>
                              </Link>
                          );
                      })}
                  </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                          <BarChart3 className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm">Vue d'ensemble</h4>
                  </div>
                  <div className="space-y-4">
                      <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                              <span>Présence Moyenne</span>
                              <span className="text-foreground">92%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 w-[92%]" />
                          </div>
                      </div>
                      <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                              <span>Taux de Réussite</span>
                              <span className="text-foreground">85%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 w-[85%]" />
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 p-1 bg-muted/30 border border-border rounded-2xl w-fit">
                  {(['overview', 'students', 'schedule'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-xs font-bold transition-all capitalize",
                            activeTab === tab 
                                ? "bg-background text-primary shadow-sm border border-border" 
                                : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab === 'overview' ? 'Aperçu' : tab === 'students' ? 'Étudiants' : 'Planning'}
                      </button>
                  ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                                  <h4 className="font-bold flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-primary" /> Détails du Module
                                  </h4>
                                  <div className="space-y-4 pt-2">
                                      <div className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                                          <span className="text-muted-foreground">Type de Module</span>
                                          <span className="font-bold text-foreground">Élément Constitutif (EC)</span>
                                      </div>
                                      <div className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                                          <span className="text-muted-foreground">Coefficient</span>
                                          <span className="font-bold text-foreground">2.0</span>
                                      </div>
                                      <div className="flex justify-between items-center py-2 text-sm text-foreground">
                                          <span className="text-muted-foreground">Crédits ECTS</span>
                                          <span className="font-bold">4</span>
                                      </div>
                                  </div>
                              </div>

                              <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                                  <h4 className="font-bold flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-primary" /> Prochaine Séance
                                  </h4>
                                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                          <Clock className="w-6 h-6" />
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold">Lundi, 21 Mars</p>
                                          <p className="text-xs text-muted-foreground">08:30 - 10:00 · Salle 402</p>
                                      </div>
                                  </div>
                                  <Button variant="outline" className="w-full rounded-xl text-xs font-bold border-border">Voir l'emploi du temps complet</Button>
                              </div>
                          </div>

                          <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-4">
                              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Megaphone className="w-8 h-8 text-blue-500" />
                              </div>
                              <h3 className="text-xl font-bold">Publier une annonce</h3>
                              <p className="text-sm text-muted-foreground max-w-sm mx-auto">Informez vos étudiants des dernières nouvelles, changements d'emploi du temps ou ressources partagées.</p>
                              <Button className="rounded-xl px-8 shadow-lg shadow-primary/20">Créer une annonce</Button>
                          </div>
                      </motion.div>
                  )}

                  {activeTab === 'students' && (
                      <motion.div
                        key="students"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-card border border-border rounded-3xl overflow-hidden"
                      >
                          <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <h3 className="font-bold text-lg">Liste des Étudiants</h3>
                              <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold gap-2">
                                      <Mail className="w-3.5 h-3.5" /> Contacter tous
                                  </Button>
                                  <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold gap-2">
                                      <FileText className="w-3.5 h-3.5" /> Exporter Liste
                                  </Button>
                              </div>
                          </div>

                          {cls.studentIds.length === 0 ? (
                            <div className="py-24 text-center text-muted-foreground space-y-4">
                                <Users className="w-12 h-12 mx-auto opacity-20" />
                                <p className="font-medium">Aucun étudiant inscrit dans cette classe.</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/30">
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Étudiant</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest hidden md:table-cell">ID Étudiant</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Statut</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {cls.studentIds.map((student) => (
                                            <tr key={student._id} className="hover:bg-accent/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center text-primary text-xs font-black shadow-inner border border-primary/5">
                                                            {student.firstName[0]}{student.lastName[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                                                {student.firstName} {student.lastName}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground font-medium">{student.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <span className="text-xs font-mono text-muted-foreground">{student.studentId || "N/A"}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/10 font-bold lowercase">
                                                        Inscrit
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                          )}
                      </motion.div>
                  )}

                  {activeTab === 'schedule' && (
                      <motion.div
                        key="schedule"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="bg-card border border-border rounded-3xl p-12 text-center space-y-4"
                      >
                          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Calendar className="w-8 h-8 text-purple-500" />
                          </div>
                          <h3 className="text-xl font-bold text-white">Emploi du temps de la classe</h3>
                          <p className="text-sm text-muted-foreground max-w-md mx-auto">
                              Consultez le planning hebdomadaire détaillé pour cette classe. Fonctionnalité en cours de synchronisation.
                          </p>
                          <Button asChild variant="outline" className="rounded-xl mt-4">
                              <Link href="/teacher/schedule">Planning Global</Link>
                          </Button>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>
      </div>
    </div>
  );
}
