'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getMySchedule, getVideoSessions, createVideoSession } from '@/lib/api/teacher';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Play,
  BookOpen,
  Loader2,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';

// React Big Calendar
import { Calendar, momentLocalizer, Views, EventProps } from 'react-big-calendar';
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
  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(new Date());

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
              // Map dayOfWeek (0=Sun, 1=Mon...6=Sat) to current week's date precisely
              const eventDate = moment().day(entry.dayOfWeek);
              const [startH, startM] = entry.startTime.split(':');
              const [endH, endM] = entry.endTime.split(':');

              const startDate = moment(eventDate).set({ hour: parseInt(startH), minute: parseInt(startM), second: 0 }).toDate();
              const endDate = moment(eventDate).set({ hour: parseInt(endH), minute: parseInt(endM), second: 0 }).toDate();

              // Find associated live session
              const existingSession = activeSessions.find((s: any) => 
                s.classId?._id === schedule.classId?._id && s.status !== 'ended'
              );

              calEvents.push({
                id: entry._id || `${schedule._id}-${index}`,
                title: entry.subjectId?.name || 'Session',
                start: startDate,
                end: endDate,
                resource: {
                  className: schedule.classId?.name || 'N/A',
                  classId: schedule.classId?._id,
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
      console.error('Failed to fetch schedule stats:', error);
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

  const handleStartSession = async (event: CalendarEvent) => {
    if (event.resource.existingSession) {
      router.push(`/teacher/sessions/${event.resource.existingSession._id}`);
      return;
    }

    try {
      setCreatingSessionId(event.id);
      const session = await createVideoSession({
        title: `${event.resource.subjectName} - ${event.resource.className}`,
        classId: event.resource.classId,
        description: `Cours de ${event.resource.subjectName} pour la classe ${event.resource.className}`,
        scheduledStart: new Date()
      });
      
      toast.success('Session vidéo créée avec succès');
      router.push(`/teacher/sessions/${session._id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
      toast.error('Erreur lors de la création de la session');
    } finally {
      setCreatingSessionId(null);
    }
  };

  // Custom Event Component
  const CustomEvent = ({ event }: EventProps<CalendarEvent>) => {
    const isCreating = creatingSessionId === event.id;
    const isLive = event.resource.existingSession?.status === 'live';

    return (
      <div className={cn(
        "flex flex-col h-full border-l-4 rounded-r-lg p-2 transition-all group overflow-hidden",
        event.resource.color
      )}>
        <div className="flex items-start justify-between gap-1 mb-1">
          <p className="font-bold text-[11px] uppercase tracking-tight line-clamp-1 text-white">
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
          <span className="text-[9px] font-bold opacity-80 uppercase truncate">
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
                onClick={(e) => {
                    e.stopPropagation();
                    handleStartSession(event);
                }}
                disabled={isCreating}
                className={cn(
                    "w-full h-7 rounded-lg text-[9px] font-black uppercase tracking-widest gap-1.5",
                    isLive ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "bg-white text-black hover:bg-white/90"
                )}
            >
                {isCreating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : isLive ? (
                    <><Radio className="w-3 h-3" /> LIVE</>
                ) : (
                    <><Play className="w-3 h-3" /> LANCER</>
                )}
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
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-full mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest"
          >
            <CalendarIcon className="w-3 h-3" />
            <span>Votre emploi du temps</span>
          </motion.div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Planning Hebdomadaire</h1>
          <p className="text-muted-foreground font-medium text-sm">Gérez vos sessions de cours et lancez vos appels vidéo en un clic.</p>
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

      {/* Calendar Container */}
      <div className="bg-card border border-border rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden h-[800px]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -mr-48 -mt-48" />
        
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={(v: any) => setView(v)}
            date={date}
            onNavigate={(d: Date) => setDate(d)}
            messages={messages}
            culture="fr"
            components={{
              event: CustomEvent,
            }}
            min={new Date(2024, 0, 1, 8, 0)} // Start at 8 AM
            max={new Date(2024, 0, 1, 19, 0)} // End at 7 PM
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
    </div>
  );
}

