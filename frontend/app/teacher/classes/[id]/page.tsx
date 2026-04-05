'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users, BookOpen, ClipboardList, Megaphone, ArrowLeft,
  CheckCircle, XCircle, Clock, Video, FileText, BarChart3,
  Calendar as CalendarIcon, MoreVertical, Mail, GraduationCap,
  MapPin, Play, Radio, Loader2
} from 'lucide-react';
import { 
  getClassDetails, 
  getVideoSessions, 
  createVideoSession, 
  endVideoSession 
} from '@/lib/api/teacher';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// React Big Calendar
import { Calendar, momentLocalizer, Views, EventProps, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Set moment locale to French
moment.locale('fr');
const localizer = momentLocalizer(moment);

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId?: string;
}

interface ScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectId?: { _id: string; name: string; code: string };
  teacherId?: { _id: string; firstName: string; lastName: string; email: string };
  room?: string;
  sessionType?: 'lecture' | 'tutorial' | 'practical';
  _id: string;
}

interface ClassDetail {
  _id: string;
  name: string;
  code: string;
  students?: {
    studentId: Student;
    status: string;
    _id: string;
  }[];
  departmentId?: { name: string };
  schedule?: ScheduleEntry[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    className: string;
    classId: string;
    room: string;
    subjectName: string;
    subjectCode: string;
    sessionType: string;
    existingSession?: any;
    color: string;
  };
}

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const EVENT_COLORS = [
  'border-blue-500 bg-blue-500/10 text-blue-400',
  'border-purple-500 bg-purple-500/10 text-purple-400',
  'border-orange-500 bg-orange-500/10 text-orange-400',
  'border-green-500 bg-green-500/10 text-green-400',
  'border-pink-500 bg-pink-500/10 text-pink-400',
];

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'schedule'>('overview');

  // Calendar State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarView, setCalendarView] = useState<View>(Views.WEEK);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [joining, setJoining] = useState(false);

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

  // Convert schedule entries to calendar events
  useEffect(() => {
    const convertToEvents = async () => {
      if (!cls?.schedule) return;

      try {
        const sessionsRes = await getVideoSessions({ status: 'live,scheduled', classId: id });
        const activeSessions = sessionsRes || [];

        const calEvents: CalendarEvent[] = (cls.schedule || [])
          .filter(entry => {
            // Check if current user is the teacher
            const isTeacher = entry.teacherId?._id === user?._id || entry.teacherId === user?._id;
            // Note: Advisor check removed here if it's class-specific, or we could keep it
            return isTeacher;
          })
          .map((entry, index) => {
            const eventDate = moment().day(entry.dayOfWeek);
            const [startH, startM] = entry.startTime.split(':');
            const [endH, endM] = entry.endTime.split(':');

            const startDate = moment(eventDate).set({ hour: parseInt(startH), minute: parseInt(startM), second: 0 }).toDate();
            const endDate = moment(eventDate).set({ hour: parseInt(endH), minute: parseInt(endM), second: 0 }).toDate();

            const existingSession = activeSessions.find((s: any) => 
              s.classId === id && s.status !== 'ended'
            );

            return {
              id: entry._id,
              title: entry.subjectId?.name || 'Cours',
              start: startDate,
              end: endDate,
              resource: {
                className: cls.name,
                classId: cls._id,
                room: entry.room || 'Lab 2',
                subjectName: entry.subjectId?.name || 'Matière',
                subjectCode: entry.subjectId?.code || '',
                sessionType: entry.sessionType || 'lecture',
                existingSession,
                color: EVENT_COLORS[index % EVENT_COLORS.length]
              }
            };
          });

        setEvents(calEvents);
      } catch (err) {
        console.error('Failed to convert schedule to events:', err);
      }
    };

    if (cls && activeTab === 'schedule') {
        convertToEvents();
    }
  }, [cls, activeTab, id]);

  const handleOpenLobby = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsLobbyOpen(true);
  };

  const handleJoinCall = async () => {
    if (!selectedEvent) return;
    
    try {
      setJoining(true);
      let sessionId = selectedEvent.resource.existingSession?._id;
      
      if (!sessionId) {
        const session = await createVideoSession({
          title: `${selectedEvent.resource.subjectName} - ${selectedEvent.resource.className}`,
          classId: selectedEvent.resource.classId,
          description: `Cours de ${selectedEvent.resource.subjectName} pour la classe ${selectedEvent.resource.className}`,
          scheduledStart: new Date()
        });
        sessionId = session._id;
      }

      router.push(`/teacher/schedule/call/${sessionId}`);
      setIsLobbyOpen(false);
    } catch (err: any) {
      console.error('Failed to join call:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la préparation de la session');
    } finally {
      setJoining(false);
    }
  };

  const { calendarMessages } = useMemo(() => ({
    calendarMessages: {
      allDay: 'Toute la journée',
      previous: 'Précédent',
      next: 'Suivant',
      today: "Aujourd'hui",
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour',
      agenda: 'Agenda',
      date: 'Date',
      time: 'Heure',
      event: 'Événement',
      noEventsInRange: 'Aucun cours prévu pour cette période.',
      showMore: (total: number) => `+ Voir plus (${total})`
    }
  }), []);

  const CustomEvent = ({ event }: EventProps<CalendarEvent>) => {
    const isLive = event.resource.existingSession?.status === 'live';

    return (
      <div className={cn(
        "flex flex-col h-full border-l-4 rounded-r-lg p-2 transition-all group overflow-hidden cursor-pointer",
        event.resource.color
      )} onClick={() => handleOpenLobby(event)}>
        <div className="flex items-start justify-between gap-1 mb-1">
          <p className="font-bold text-[10px] uppercase tracking-tight line-clamp-1 text-foreground">
            {event.resource.subjectName}
          </p>
          <BookOpen className="w-2.5 h-2.5 opacity-50 shrink-0" />
        </div>

        <div className="flex items-center gap-1.5 mt-auto">
          <MapPin className="w-2.5 h-2.5 opacity-60" />
          <span className="text-[8px] font-bold opacity-80 uppercase truncate">
            {event.resource.room}
          </span>
        </div>

        {isLive && (
            <div className="mt-1 flex items-center gap-1">
                <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">LIVE</span>
            </div>
        )}
      </div>
    );
  };

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
    <div className="p-6 space-y-8 mx-auto">
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
                      <p className="text-3xl font-black text-white">{cls.students?.length || 0}</p>
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
                                      <Calendar className="w-4 h-4 text-primary" localizer={localizer}/> Prochaine Séance
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

                          {!cls.students || cls.students.length === 0 ? (
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
                                        {cls.students?.map((item) => {
                                            const student = item.studentId;
                                            return (
                                                <tr key={item._id} className="hover:bg-accent/30 transition-colors group">
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
                                                            {item.status || "Inscrit"}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                          )}
                      </motion.div>
                  )}

                   {activeTab === 'schedule' && (
                      <motion.div
                        key="schedule"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                          <div className="bg-card border border-border rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden h-[600px]">
                              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -mr-48 -mt-48" />
                              
                              <Calendar
                                  localizer={localizer}
                                  events={events}
                                  startAccessor="start"
                                  endAccessor="end"
                                  view={calendarView}
                                  onView={(v: View) => setCalendarView(v)}
                                  date={calendarDate}
                                  onNavigate={(d: Date) => setCalendarDate(d)}
                                  onSelectEvent={handleOpenLobby}
                                  messages={calendarMessages}
                                  culture="fr"
                                  components={{
                                    event: CustomEvent,
                                  }}
                                  min={new Date(2024, 0, 1, 8, 0)}
                                  max={new Date(2024, 0, 1, 19, 0)}
                                  step={60}
                                  timeslots={1}
                                  formats={{
                                      timeGutterFormat: 'HH:mm',
                                      eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }, culture?: string, local?: any) =>
                                        `${local.format(start, 'HH:mm', culture)} - ${local.format(end, 'HH:mm', culture)}`
                                  }}
                                  className="relative z-10"
                              />
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>
      </div>

      {/* Lobby Modal Integration */}
      <Dialog open={isLobbyOpen} onOpenChange={setIsLobbyOpen}>
        <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/5 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
          {selectedEvent && (
            <div className="flex flex-col">
              <div className="h-40 bg-gradient-to-br from-primary to-indigo-700 p-10 flex items-end relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                    <Play className="fill-white text-white w-7 h-7 ml-0.5" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Lobby de Session</h2>
                    <p className="text-white/60 text-sm font-medium uppercase tracking-widest">{selectedEvent.resource.subjectCode}</p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Matière</p>
                      <p className="text-white font-bold text-xl tracking-tight">{selectedEvent.resource.subjectName}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Classe / Groupe</p>
                      <p className="text-white font-semibold text-lg">{selectedEvent.resource.className}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Horaire Prévu</p>
                      <div className="flex items-center gap-2 text-white font-bold text-xl">
                        <Clock className="w-5 h-5 text-primary" />
                        {moment(selectedEvent.start).format('HH:mm')} - {moment(selectedEvent.end).format('HH:mm')}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Lieu de Session</p>
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg italic">
                        <MapPin className="w-5 h-5" />
                        {selectedEvent.resource.room}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex items-start gap-6 relative overflow-hidden group">
                  <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20">
                    <Users className="text-primary w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-bold text-lg tracking-tight">Prêt à enseigner ?</p>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      L'appel s'ouvrira dans un environnement immersif plein écran. Assurez-vous d'être dans un endroit calme.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <Button 
                    onClick={handleJoinCall}
                    disabled={joining}
                    className="flex-1 h-16 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black text-lg shadow-2xl shadow-white/5 group transition-all"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        PRÉPARATION...
                      </>
                    ) : (
                      <>
                        REJOINDRE LA CLASSE
                        <Play className="ml-3 w-5 h-5 fill-black group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsLobbyOpen(false)}
                    className="h-16 px-10 rounded-2xl border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-xs"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
