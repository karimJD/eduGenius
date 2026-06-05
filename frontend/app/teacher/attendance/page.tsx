'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAttendanceReport } from '@/lib/api/teacher';
import { TeacherPageHeader } from '@/components/teacher/TeacherPageHeader';
import { Loader2, Calendar, Clock, Users, ArrowRight, Search, Filter, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Course {
  classId: { _id: string; name: string; code: string };
  subjectId: { _id: string; name: string; code: string };
}

interface SessionInfo {
  _id: string;
  title: string;
  classId: { _id: string; name: string; code: string };
  subjectId?: { _id: string; name: string; code: string };
  scheduledStart: string;
  status: string;
  attendance: any[];
  statistics?: {
    totalParticipants: number;
    attendanceRate: number;
  };
}

interface StudentStat {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  present: number;
  late: number;
  absent: number;
  totalSessions: number;
  attendanceRate: number;
}

export default function AttendanceDashboardPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);

  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const data = await getAttendanceReport(selectedClass, selectedSubject);
        setCourses(data.courses);
        setSessions(data.sessions);
        setStudentStats(data.studentStats || []);
      } catch (error) {
        console.error('Failed to fetch attendance report:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [selectedClass, selectedSubject]);

  // Derive unique classes and subjects for dropdowns
  const uniqueClasses = Array.from(
    new Map(
      courses
        .filter(c => c.classId && c.classId._id)
        .map(c => [c.classId._id, c.classId])
    ).values()
  );

  const availableSubjects = selectedClass === 'all'
    ? Array.from(
        new Map(
          courses
            .filter(c => c.subjectId && c.subjectId._id)
            .map(c => [c.subjectId._id, c.subjectId])
        ).values()
      )
    : Array.from(
        new Map(
          courses
            .filter(c => c.classId && c.classId._id === selectedClass && c.subjectId && c.subjectId._id)
            .map(c => [c.subjectId._id, c.subjectId])
        ).values()
      );

  // Filter sessions locally by search query
  const filteredSessions = sessions.filter(s => {
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || 
           s.classId?.name.toLowerCase().includes(q) ||
           (s.subjectId?.name?.toLowerCase() || '').includes(q);
  });

  // Calculate global summary metrics from studentStats
  const avgAttendance = studentStats.length > 0
    ? studentStats.reduce((acc, st) => acc + st.attendanceRate, 0) / studentStats.length
    : 0;

  return (
    <div className="space-y-6">
      <TeacherPageHeader 
        title="Dashboard d'Assiduité" 
        subtitle="Consultez l'historique des présences et les statistiques globales de vos étudiants."
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une session..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        
        <div className="w-full md:w-[250px] shrink-0">
          <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSubject('all'); }}>
            <SelectTrigger className="w-full bg-card border-border">
              <div className="flex items-center gap-2 truncate">
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Toutes les classes" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              {uniqueClasses.map(cls => (
                <SelectItem key={cls._id} value={cls._id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-[250px] shrink-0">
          <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={selectedClass === 'all'}>
            <SelectTrigger className="w-full bg-card border-border">
              <div className="flex items-center gap-2 truncate">
                <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder={selectedClass === 'all' ? "Sélectionnez une classe" : "Toutes les matières"} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les matières</SelectItem>
              {availableSubjects.map(sub => (
                <SelectItem key={sub._id} value={sub._id}>{sub.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium">Génération des statistiques...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Global Stats if a class is selected */}
          {selectedClass !== 'all' && studentStats.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Statistiques Étudiants</h2>
                <div className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold text-sm">
                  Moyenne globale : {avgAttendance.toFixed(1)}%
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold">
                      <tr>
                        <th className="px-6 py-4">Étudiant</th>
                        <th className="px-6 py-4 text-center">Présences</th>
                        <th className="px-6 py-4 text-center">Retards</th>
                        <th className="px-6 py-4 text-center">Absences</th>
                        <th className="px-6 py-4 text-center">Total Séances</th>
                        <th className="px-6 py-4 text-center">Taux d'assiduité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {studentStats.map(student => (
                        <tr key={student.studentId} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                {student.profileImage ? (
                                  <img src={student.profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  `${student.firstName[0]}${student.lastName[0]}`
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate">{student.firstName} {student.lastName}</p>
                                <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center font-medium text-emerald-500">{student.present}</td>
                          <td className="px-6 py-3 text-center font-medium text-amber-500">{student.late}</td>
                          <td className="px-6 py-3 text-center font-medium text-red-500">{student.absent}</td>
                          <td className="px-6 py-3 text-center font-medium text-muted-foreground">{student.totalSessions}</td>
                          <td className="px-6 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${student.attendanceRate >= 70 ? 'bg-emerald-500' : student.attendanceRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${student.attendanceRate}%` }}
                                />
                              </div>
                              <span className="font-bold min-w-[3ch]">{student.attendanceRate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedClass !== 'all' && studentStats.length === 0 && (
            <div className="p-6 bg-muted/30 border border-dashed border-border rounded-2xl text-center text-muted-foreground">
              Aucun étudiant trouvé dans cette classe.
            </div>
          )}

          {/* Sessions List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Historique des Séances</h2>
            
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 bg-card border border-border rounded-2xl">
                <p className="text-muted-foreground">Aucune session trouvée avec ces filtres.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSessions.map((session) => (
                  <div 
                    key={session._id} 
                    className="bg-card border border-border p-5 rounded-2xl flex flex-col gap-4 hover:border-primary/50 transition-colors group"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{session.title}</h3>
                      <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {session.classId?.name} 
                        {session.subjectId?.name && (
                          <>
                            <span className="opacity-50">•</span>
                            {session.subjectId.name}
                          </>
                        )}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-400"/> Date</span>
                        <span className="font-medium text-foreground">{new Date(session.scheduledStart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-400"/> Heure</span>
                        <span className="font-medium text-foreground">{new Date(session.scheduledStart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-400"/> Présences</span>
                        <span className="font-bold text-primary">{session.statistics?.attendanceRate || 0}%</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => router.push(`/teacher/attendance/${session._id}`)}
                      className="w-full mt-auto"
                      variant="secondary"
                    >
                      Détails de la séance
                      <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
