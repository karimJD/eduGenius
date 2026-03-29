'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Play,
  BookOpen,
  Loader2,
  Radio,
  X,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getMySchedule, getVideoSessions, createVideoSession, endVideoSession } from '@/lib/api/teacher';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';

// React Big Calendar
import { Calendar, momentLocalizer, Views, EventProps, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Set moment locale to French
moment.locale('fr');
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
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

export default function TeacherSchedulePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [creatingSessionId, setCreatingSessionId] = useState<string | null>(null);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  
  // Lobby Modal State
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [joining, setJoining] = useState(false);

  const colors = [
    'border-blue-500 bg-blue-500/10 text-blue-400',
    'border-purple-500 bg-purple-500/10 text-purple-400',
    'border-orange-500 bg-orange-500/10 text-orange-400',
    'border-green-500 bg-green-500/10 text-green-400',
    'border-pink-500 bg-pink-500/10 text-pink-400',
    'border-teal-500 bg-teal-500/10 text-teal-400',
    'border-indigo-500 bg-indigo-500/10 text-indigo-400',
  ];

  const fetchScheduleAndSessions = async () => {
    try {
      setLoading(true);
      const [schedRes, sessionsRes] = await Promise.all([
        getMySchedule(),
        getVideoSessions({ status: 'live,scheduled' })
      ]);

      const activeSessions = sessionsRes || [];

      if (schedRes?.data) {
        const calEvents: CalendarEvent[] = [];
        
        schedRes.data.forEach((schedule: any) => {
          schedule.entries.forEach((entry: any, index: number) => {
            // Check if current user is the teacher or advisor
            const isTeacher = entry.teacherId?._id === user?._id || entry.teacherId === user?._id;
            const isAdvisor = schedule.academicAdvisorId?._id === user?._id || schedule.academicAdvisorId === user?._id;

            if (isTeacher || isAdvisor) {
              const eventDate = moment().day(entry.dayOfWeek);
              const [startH, startM] = entry.startTime.split(':');
              const [endH, endM] = entry.endTime.split(':');

              const startDate = moment(eventDate).set({ hour: parseInt(startH), minute: parseInt(startM), second: 0 }).toDate();
              const endDate = moment(eventDate).set({ hour: parseInt(endH), minute: parseInt(endM), second: 0 }).toDate();

              const getClassId = (obj: any) => {
                if (!obj) return null;
                return typeof obj === 'string' ? obj : (obj._id || obj.id);
              };

              // Enhanced classId extraction
              const targetClassId = getClassId(entry.classId) || 
                                   (schedule.targetType === 'class' ? getClassId(schedule.targetId) : null);
              
              const targetClassName = entry.classId?.name || schedule.classId?.name || 'Classe inconnue';

              const existingSession = activeSessions.find((s: any) => 
                getClassId(s.classId) === targetClassId && s.status !== 'ended'
              );

              calEvents.push({
                id: entry._id || `${schedule._id}-${index}`,
                title: entry.subjectId?.name || 'Session',
                start: startDate,
                end: endDate,
                resource: {
                  className: targetClassName,
                  classId: targetClassId,
                  room: entry.room || 'En ligne',
                  subjectName: entry.subjectId?.name || 'Matière',
                  subjectCode: entry.subjectId?.code || '',
                  sessionType: entry.sessionType || 'lecture',
                  existingSession,
                  color: colors[index % colors.length]
                }
              });
            }
          });
        });
        setEvents(calEvents);
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      toast.error('Erreur lors du chargement de l\'emploi du temps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchScheduleAndSessions();
    }
  }, [user?._id]);

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
        if (!selectedEvent.resource.classId) {
          toast.error("Identifiant de classe manquant. Impossible de créer la session.");
          return;
        }

        const session = await createVideoSession({
          title: `${selectedEvent.resource.subjectName} - ${selectedEvent.resource.className}`,
          classId: selectedEvent.resource.classId,
          description: `Cours de ${selectedEvent.resource.subjectName} pour la classe ${selectedEvent.resource.className}`,
          scheduledStart: new Date()
        });
        sessionId = session._id;
      }

      // Redirect to full-screen call page
      router.push(`/teacher/schedule/call/${sessionId}`);
      setIsLobbyOpen(false);
    } catch (err: any) {
      console.error('Failed to join call:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la préparation de la session');
    } finally {
      setJoining(false);
    }
  };

  const handleEndActiveSession = async (sessionId: string) => {
    if (!confirm('Voulez-vous vraiment terminer cette session pour tout le monde ?')) return;
    
    try {
      await endVideoSession(sessionId);
      toast.success('Session terminée');
      fetchScheduleAndSessions();
      if (selectedEvent?.resource.existingSession?._id === sessionId) {
        setIsLobbyOpen(false);
      }
    } catch (err) {
      toast.error('Erreur lors de la fermeture de la session');
    }
  };

  const CustomEvent = ({ event }: EventProps<CalendarEvent>) => {
    const isLive = event.resource.existingSession?.status === 'live';

    return (
      <div className={cn(
        "flex flex-col h-full border-l-4 rounded-r-lg p-2 transition-all group overflow-hidden cursor-pointer",
        event.resource.color
      )} onClick={() => handleOpenLobby(event)}>
        <div className="flex items-start justify-between gap-1 mb-1">
          <p className="font-bold text-[11px] uppercase tracking-tight line-clamp-1 text-foreground">
            {event.resource.subjectName}
          </p>
          <BookOpen className="w-3 h-3 opacity-50 shrink-0" />
        </div>

        <div className="flex items-center gap-1.5 mt-auto">
          <Users className="w-2.5 h-2.5 opacity-60" />
          <span className="text-[9px] font-bold opacity-80 uppercase truncate">
            {event.resource.className}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          <MapPin className="w-2.5 h-2.5 opacity-60" />
          <span className="text-[9px] font-bold opacity-80 uppercase truncate text-emerald-500">
            {event.resource.room}
          </span>
        </div>

        <AnimatePresence>
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            whileHover={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden mt-1.5"
          >
            <Button 
                size="sm"
                className={cn(
                    "w-full h-7 rounded-lg text-[9px] font-black uppercase tracking-widest gap-1.5",
                    isLive ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "bg-black/80 text-white hover:bg-black"
                )}
            >
                {isLive ? <><Radio className="w-3 h-3" /> LIVE</> : <><Play className="w-3 h-3" /> REJOINDRRE</>}
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  const { messages } = useMemo(() => ({
    messages: {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-full mx-auto bg-background min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest"
          >
            <CalendarIcon className="w-3 h-3" />
            <span>Votre emploi du temps</span>
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">Planning Hebdomadaire</h1>
          <p className="text-muted-foreground font-medium text-sm">Gérez vos sessions de cours et rejoignez vos classes virtuelles.</p>
        </div>

        <div className="flex items-center gap-3">
            <Button 
                variant={view === Views.WEEK ? "default" : "outline"} 
                onClick={() => setView(Views.WEEK)}
                className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest"
            >
                Semaine
            </Button>
            <Button 
                variant={view === Views.DAY ? "default" : "outline"} 
                onClick={() => setView(Views.DAY)}
                className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest"
            >
                Jour
            </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden h-[800px]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -mr-48 -mt-48" />
        
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={(v: View) => setView(v)}
            date={date}
            onNavigate={(d: Date) => setDate(d)}
            onSelectEvent={handleOpenLobby}
            messages={messages}
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

      {/* Lobby Modal */}
      <Dialog open={isLobbyOpen} onOpenChange={setIsLobbyOpen}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-white/10 p-0 overflow-hidden rounded-[2rem] shadow-2xl">
          {selectedEvent && (
            <div className="flex flex-col">
              {/* Header / Banner */}
              <div className="h-40 bg-gradient-to-br from-violet-600 to-indigo-700 p-10 flex items-end relative overflow-hidden">
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

              {/* Lobby Content */}
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
                        <Clock className="w-5 h-5 text-violet-400" />
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
                  <div className="absolute inset-y-0 left-0 w-1 bg-violet-500" />
                  <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-violet-500/20">
                    <Users className="text-violet-400 w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-bold text-lg tracking-tight">Prêt à enseigner ?</p>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      L'appel s'ouvrira dans un environnement immersif plein écran. Assurez-vous d'être dans un endroit calme et vérifiez votre matériel audiovisuel.
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
                    className="h-16 px-10 rounded-2xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-xs"
                  >
                    Fermer
                  </Button>
                </div>

                {selectedEvent.resource.existingSession && (
                  <div className="pt-4 border-t border-white/5 flex justify-center">
                    <button 
                      onClick={() => handleEndActiveSession(selectedEvent.resource.existingSession._id)}
                      className="text-red-500/60 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                    >
                      Terminer la session pour tous
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
