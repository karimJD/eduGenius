'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, GraduationCap, Users, User, Building2,
  Calendar, BookOpen, Search, Mail, Hash,
  ChevronRight, CheckCircle2, XCircle, Clock, MapPin,
  ExternalLink, FileText, LayoutDashboard, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getClass, getSchedules } from '@/lib/api/admin';
import clsx from 'clsx';

export default function ClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [cls, setCls] = useState<any>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classData, schedulesData] = await Promise.all([
        getClass(slug),
        getSchedules({ targetId: slug }).catch(() => [])
      ]);
      setCls(classData);
      setSchedules(Array.isArray(schedulesData) ? schedulesData : schedulesData.schedules || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Classe non trouvée.</p>
        <Button variant="link" onClick={() => router.back()}>Retour</Button>
      </div>
    );
  }

  const enrolledStudents = cls.students?.filter((s: any) => s.status === 'enrolled') || [];
  const filteredStudents = enrolledStudents.filter((s: any) => 
    `${s.studentId?.firstName} ${s.studentId?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId?.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8 max-w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl hover:bg-accent hover:text-primary transition-all active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold uppercase tracking-tight text-foreground">
                {cls.name}
              </h1>
              <Badge variant={cls.isActive ? "default" : "destructive"} className="rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {cls.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm flex items-center gap-2 font-medium">
              <Hash className="h-4 w-4 text-primary" /> {cls.code} · {cls.level} · {cls.departmentId?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {schedules.length > 0 && (
            <Button 
              variant="outline" 
              className="rounded-2xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all"
              onClick={() => router.push(`/admin/schedules/${schedules[0]._id}`)}
            >
              <Calendar className="mr-2 h-4 w-4" /> Emploi du Temps
            </Button>
          )}
          <Button 
            className="rounded-2xl px-6 bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold"
            onClick={() => router.push(`/admin/classes`)}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border p-5 rounded-3xl shadow-sm space-y-3 hover:translate-y-[-2px] transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Niveau</p>
            <p className="text-lg font-bold text-foreground mt-1">{cls.level}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-3xl shadow-sm space-y-3 hover:translate-y-[-2px] transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Inscriptions</p>
            <p className="text-lg font-bold text-foreground mt-1">
              {cls.currentEnrollment} <span className="text-sm font-medium text-muted-foreground">/ {cls.capacity}</span>
            </p>
            <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min((cls.currentEnrollment / (cls.capacity || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-3xl shadow-sm space-y-3 lg:col-span-2 hover:translate-y-[-2px] transition-all duration-300">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <User className="h-5 w-5" />
          </div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Conseiller Académique</p>
              <p className="text-lg font-bold text-foreground mt-1">
                {cls.academicAdvisorId ? `${cls.academicAdvisorId.firstName} ${cls.academicAdvisorId.lastName}` : 'Non assigné'}
              </p>
              {cls.academicAdvisorId && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-medium italic">
                  <Mail className="h-3 w-3" /> {cls.academicAdvisorId.email || 'Pas d\'email'}
                </p>
              )}
            </div>
            {cls.academicAdvisorId && (
              <Button size="sm" variant="outline" className="rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 h-8 text-[11px] font-bold">
                Profil Enseignant <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Students */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Étudiants inscrits
                <Badge variant="outline" className="ml-2 bg-background border-primary/20 text-primary">{enrolledStudents.length}</Badge>
              </h2>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-9 bg-background border-border rounded-xl h-10 w-full sm:w-64 focus:ring-primary/40"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              {filteredStudents.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm font-medium">Aucun étudiant trouvé.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/10 text-muted-foreground text-[11px] uppercase tracking-wider font-bold">
                      <th className="p-4 border-b border-border">Étudiant</th>
                      <th className="p-4 border-b border-border">Matricule</th>
                      <th className="p-4 border-b border-border">CIN</th>
                      <th className="p-4 border-b border-border">Date d'inscription</th>
                      <th className="p-4 border-b border-border text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.map((s: any) => (
                      <tr key={s.studentId?._id} className="hover:bg-accent/30 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                              {s.studentId?.firstName.charAt(0)}{s.studentId?.lastName.charAt(0)}
                            </div>
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {s.studentId?.firstName} {s.studentId?.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs opacity-80">{s.studentId?.studentId}</td>
                        <td className="p-4 font-mono text-xs opacity-80">{s.studentId?.cin}</td>
                        <td className="p-4 text-xs opacity-70 italic">
                          {s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="p-4 text-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Academic & Teachers */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Professeurs par matière
              </h2>
              
              <div className="space-y-3">
                {cls.teachers && cls.teachers.length > 0 ? (
                  cls.teachers.map((t: any, idx: number) => (
                    <div key={idx} className="p-4 bg-muted/10 border border-border rounded-2xl space-y-1.5 hover:bg-muted/20 transition-all group">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {t.subjectId?.name}
                        </p>
                        <Badge variant="outline" className="px-1.5 py-0 h-4 text-[9px] uppercase tracking-tighter opacity-70">
                          {t.subjectId?.code || 'Core'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium border-t border-border/50 pt-1.5">
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[10px] text-primary">
                          {t.teacherId?.firstName.charAt(0)}
                        </div>
                        {t.teacherId?.firstName} {t.teacherId?.lastName}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center border border-dashed border-border rounded-2xl space-y-2">
                    <User className="h-8 w-8 mx-auto text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Aucun professeur assigné.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-border space-y-4">
              <h2 className="text-md font-bold text-foreground/80 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Informations Structurelles
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Département', value: cls.departmentId?.name, icon: Building2 },
                  { label: 'Programme', value: cls.programId?.name || 'Tronc Commun', icon: FileText },
                  { label: 'Année Académique', value: cls.academicYearId?.year, icon: Calendar },
                  { label: 'Nombre de groupes', value: cls.groupNumber || 1, icon: Hash },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-0.5 border-l-2 border-primary/10 pl-3">
                    <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest">{item.label}</span>
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                      <item.icon className="h-3.5 w-3.5 text-primary opacity-70" />
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-4 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Calendar size={120} />
            </div>
            <h2 className="text-lg font-bold text-primary flex items-center gap-2 relative z-10">
              <Clock className="h-5 w-5" /> Emploi du Temps
            </h2>
            <p className="text-xs text-muted-foreground/80 relative z-10 leading-relaxed">
              Visualisez le planning hebdomadaire complet pour cette section. Gérez les créneaux, les salles et les modifications.
            </p>
            {schedules.length === 0 ? (
              <div className="pt-2 relative z-10">
                <Button 
                  variant="outline" 
                  className="w-full rounded-2xl border-primary/30 text-primary hover:bg-primary/10 font-bold"
                  onClick={() => router.push('/admin/schedules/create')}
                >
                  <Plus className="mr-2 h-4 w-4" /> Créer un planning
                </Button>
              </div>
            ) : (
              <div className="pt-2 space-y-2 relative z-10">
                <Button 
                  className="w-full rounded-2xl bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all font-bold"
                  onClick={() => router.push(`/admin/schedules/${schedules[0]._id}`)}
                >
                  <Calendar className="mr-2 h-4 w-4" /> Voir le planning
                </Button>
                <div className="grid grid-cols-2 gap-2">
                   <div className="p-2 bg-background/50 rounded-xl border border-primary/10 text-center">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-tighter">Status</p>
                      <p className="text-[11px] font-bold text-emerald-600">{schedules[0].isPublished ? 'Publié' : 'Draft'}</p>
                   </div>
                   <div className="p-2 bg-background/50 rounded-xl border border-primary/10 text-center">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-tighter">Séances</p>
                      <p className="text-[11px] font-bold text-primary">{schedules[0].entries?.length || 0}</p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
