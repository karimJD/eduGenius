'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Edit, Calendar, Clock, User, MapPin, Printer,
  FileText, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSchedule, getTeachers, getSubjects, getClasses } from '@/lib/api/admin';
import { Badge } from '@/components/ui/badge';
import clsx from 'clsx';

// Constants aligned with create/page.tsx
const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAY_NUMS   = [1, 2, 3, 4, 5, 6];

const SESSION_TYPE_LABELS: Record<string, string> = {
  lecture:  'Cours Magistral',
  tutorial: 'Travaux Dirigés (TD)',
  practical: 'Travaux Pratiques (TP)',
};

interface Entry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId?: string;
  room?: string;
  sessionType: 'lecture' | 'tutorial' | 'practical';
  notes?: string;
}

interface Schedule {
  _id: string;
  title: string;
  academicYearId: string;
  semester: number;
  targetType: 'class' | 'teacher';
  targetId: string;
  isPublished: boolean;
  entries: Entry[];
}

export default function ViewSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Lookups for labels
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sData, tData, sbData, cData] = await Promise.all([
        getSchedule(id),
        getTeachers().catch(() => []),
        getSubjects().catch(() => []),
        getClasses().catch(() => []),
      ]);
      
      setSchedule(sData.schedule || sData);
      setTeachers(Array.isArray(tData) ? tData : tData.teachers || []);
      setSubjects(Array.isArray(sbData) ? sbData : []);
      setClasses(Array.isArray(cData) ? cData : cData.classes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getSubjectLabel = (idOrObj: any) => {
    if (idOrObj && typeof idOrObj === 'object' && idOrObj.name) {
      return `${idOrObj.name} (${idOrObj.code})`;
    }
    const s = subjects.find(su => su._id === idOrObj);
    return s ? `${s.name} (${s.code})` : String(idOrObj || '');
  };

  const getTeacherLabel = (idOrObj: any) => {
    if (!idOrObj) return '';
    if (typeof idOrObj === 'object' && idOrObj.firstName) {
      return `${idOrObj.firstName} ${idOrObj.lastName}`;
    }
    const t = teachers.find(tc => tc._id === idOrObj);
    return t ? `${t.firstName} ${t.lastName}` : String(idOrObj);
  };

  const getTargetLabel = () => {
    if (!schedule) return '';
    if (schedule.targetType === 'class') {
      const c = classes.find(cl => cl._id === schedule.targetId);
      return c ? `${c.name} (${c.code})` : schedule.targetId;
    }
    const t = teachers.find(tc => tc._id === schedule.targetId);
    return t ? `${t.firstName} ${t.lastName}` : schedule.targetId;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Emploi du temps non trouvé.</p>
        <Button variant="link" onClick={() => router.back()}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {schedule.title}
              {!schedule.isPublished && (
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] uppercase tracking-wider font-bold">
                  Brouillon
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              {schedule.academicYearId} · Semestre {schedule.semester} · {schedule.targetType === 'class' ? 'Classe' : 'Enseignant'}: {getTargetLabel()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden sm:flex">
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>
          <Button size="sm" onClick={() => router.push(`/admin/schedules/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" /> Modifier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[700px]">
                <thead>
                  <tr>
                    {DAY_LABELS.map((d) => (
                      <th key={d} className="p-3 text-xs font-bold text-muted-foreground bg-muted/40 border-b border-r border-border last:border-r-0 text-center uppercase tracking-tight">
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {DAY_NUMS.map(day => {
                      const dayEntries = schedule.entries
                        .filter(e => e.dayOfWeek === day)
                        .sort((a, b) => a.startTime.localeCompare(b.startTime));
                      
                      return (
                        <td key={day} className="align-top p-2 border-r border-border last:border-r-0 min-w-[140px] bg-background/50">
                          {dayEntries.length === 0 ? (
                            <div className="h-20 flex items-center justify-center text-muted-foreground/20 italic text-xs">—</div>
                          ) : (
                            <div className="space-y-2">
                              {dayEntries.map((e, i) => (
                                <div key={i} className={clsx(
                                  'p-3 rounded-xl border-l-4 shadow-sm space-y-1.5 transition-all hover:translate-y-[-2px] hover:shadow-md cursor-default',
                                  e.sessionType === 'lecture'  ? 'bg-blue-500/5 border-blue-500 text-blue-700 dark:text-blue-300' :
                                  e.sessionType === 'tutorial' ? 'bg-indigo-500/5 border-indigo-500 text-indigo-700 dark:text-indigo-300' :
                                  'bg-amber-500/5 border-amber-500 text-amber-700 dark:text-amber-300'
                                )}>
                                  <div className="flex justify-between items-start gap-1">
                                    <p className="font-bold leading-tight line-clamp-2">{getSubjectLabel(e.subjectId).split('(')[0].trim()}</p>
                                    <Badge variant="outline" className="px-1 py-0 h-4 text-[9px] border-current opacity-70 shrink-0">
                                      {e.sessionType === 'lecture' ? 'CM' : e.sessionType === 'tutorial' ? 'TD' : 'TP'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5 text-[10px] opacity-80 font-medium">
                                    <Clock className="h-2.5 w-2.5" />
                                    {e.startTime} – {e.endTime}
                                  </div>

                                  {e.teacherId && (
                                    <div className="flex items-center gap-1.5 text-[10px] opacity-80 border-t border-current/10 pt-1.5">
                                      <User className="h-2.5 w-2.5" />
                                      <span className="truncate">{getTeacherLabel(e.teacherId)}</span>
                                    </div>
                                  )}

                                  {e.room && (
                                    <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                                      <MapPin className="h-2.5 w-2.5" />
                                      <span>Salle {e.room}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground/80">
              <FileText className="h-4 w-4 text-primary" /> Détails
            </h3>
            
            <div className="space-y-3">
              {[
                { label: 'Statut', value: schedule.isPublished ? 'Publié' : 'Brouillon', icon: schedule.isPublished ? ShieldCheck : AlertTriangle, color: schedule.isPublished ? 'text-emerald-600' : 'text-amber-600' },
                { label: 'Année', value: schedule.academicYearId },
                { label: 'Semestre', value: `S${schedule.semester}` },
                { label: 'Cible', value: getTargetLabel() },
                { label: 'Nombre de séances', value: `${schedule.entries.length} séances` },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col gap-0.5 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    {item.icon && <item.icon className={clsx("h-3.5 w-3.5", item.color)} />}
                    <span className={clsx("text-sm font-semibold", item.color ?? "text-foreground")}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              Légende
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded bg-blue-500"></div>
                <span>Cours Magistral (CM)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded bg-indigo-500"></div>
                <span>Travaux Dirigés (TD)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-3 w-3 rounded bg-amber-500"></div>
                <span>Travaux Pratiques (TP)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
