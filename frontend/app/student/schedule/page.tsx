'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getMySchedule } from '@/lib/api/student';
import { getVideoSessions, getSessionToken } from '@/lib/api/teacher';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Play,
  BookOpen,
  Loader2,
  Radio,
  Clock,
  Video,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/student/PageHeader';
import { Button } from '@/components/ui/button';
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
  resource: {
    room: string;
    professor: string;
    subjectName: string;
    sessionType: string;
    existingSession?: any;
    color: string;
    meetingUrl?: string;
  };
}

export default function StudentSchedulePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  
  // Lobby Modal State
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [joining, setJoining] = useState(false);

  const colors = [
    'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  ];

  const fetchScheduleAndSessions = async () => {
    try {
      setLoading(true);
      // For students, we fetch their specific schedule and active video sessions for their class
      const [schedRes, sessionsRes] = await Promise.all([
        getMySchedule(),
        getVideoSessions({ status: 'live' })
      ]);

      const activeSessions = sessionsRes || [];

      if (schedRes?.data) {
        const calEvents: CalendarEvent[] = [];
        
        schedRes.data.forEach((schedule: any) => {
          schedule.entries.forEach((entry: any, index: number) => {
            const eventDate = moment().day(entry.dayOfWeek);
            const [startH, startM] = entry.startTime.split(':');
            const [endH, endM] = entry.endTime.split(':');

            const startDate = moment(eventDate).set({ hour: parseInt(startH), minute: parseInt(startM), second: 0 }).toDate();
            const endDate = moment(eventDate).set({ hour: parseInt(endH), minute: parseInt(endM), second: 0 }).toDate();

            // Find if there's a live session for this entry
            // This is a bit tricky as we need to match subject/class
            const existingSession = activeSessions.find((s: any) => 
               s.classId?._id === (entry.classId?._id || schedule.targetId) && 
               s.status === 'live'
            );

            calEvents.push({
              id: entry._id || `${schedule._id}-${index}`,
              title: entry.subjectId?.name || 'Session',
              start: startDate,
              end: endDate,
              resource: {
                room: entry.room || 'Salle Virtuelle',
                professor: entry.teacherId ? `${entry.teacherId.firstName} ${entry.teacherId.lastName}` : 'Administration',
                subjectName: entry.subjectId?.name || 'Matière',
                sessionType: entry.sessionType || 'Cours',
                existingSession,
                color: colors[index % colors.length],
                meetingUrl: entry.meetingUrl
              }
            });
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
      
      // If there's an existing live session, join it
      if (selectedEvent.resource.existingSession) {
        router.push(`/student/schedule/call/${selectedEvent.resource.existingSession._id}`);
      } else if (selectedEvent.resource.meetingUrl) {
        // Fallback for custom meeting URLs (Zoom, Jitsi direct, etc.)
        window.open(selectedEvent.resource.meetingUrl, '_blank');
      } else {
        toast.info("Cette session n'est pas encore ouverte.");
      }
      
      setIsLobbyOpen(false);
    } catch (err: any) {
      console.error('Failed to join call:', err);
      toast.error('Erreur lors de la préparation de la session');
    } finally {
      setJoining(false);
    }
  };

  const CustomEvent = ({ event }: EventProps<CalendarEvent>) => {
    const isLive = !!event.resource.existingSession;

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
            {event.resource.professor}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-1">
          {event.resource.meetingUrl || isLive ? <Video className="w-2.5 h-2.5 opacity-60" /> : <MapPin className="w-2.5 h-2.5 opacity-60" />}
          <span className="text-[9px] font-bold opacity-80 uppercase truncate text-blue-500 dark:text-blue-400">
            {event.resource.room}
          </span>
        </div>

        <AnimatePresence>
          {(isLive || event.resource.meetingUrl) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              whileHover={{ height: 'auto', opacity: 1 }}
              className="overflow-hidden mt-1.5"
            >
              <Button 
                  size="sm"
                  className={cn(
                      "w-full h-7 rounded-lg text-[9px] font-black uppercase tracking-widest gap-1.5 shadow-sm",
                      isLive ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "bg-blue-600 hover:bg-blue-700 text-white"
                  )}
              >
                  {isLive ? <><Radio className="w-3 h-3" /> LIVE</> : <><Play className="w-3 h-3" /> REJOINDRE</>}
              </Button>
            </motion.div>
          )}
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
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Synchronisation du planning...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <PageHeader 
        title="Mon Planning"
        description="Consultez vos horaires de cours et rejoignez vos sessions virtuelles en un clic."
        icon={CalendarIcon}
        badgeText="Emploi du temps"
        badgeClassName="bg-blue-500/10 border-blue-500/20 text-blue-500"
        actions={
          <div className="flex items-center gap-3">
            <Button 
                variant={view === Views.WEEK ? "default" : "outline"} 
                onClick={() => setView(Views.WEEK)}
                className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest hidden sm:flex"
            >
                Semaine
            </Button>
            <Button 
                variant={view === Views.DAY ? "default" : "outline"} 
                onClick={() => setView(Views.DAY)}
                className="rounded-xl h-10 px-5 font-bold uppercase text-[10px] tracking-widest hidden sm:flex"
            >
                Jour
            </Button>
          </div>
        }
      />

      <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden h-[800px]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full -mr-48 -mt-48" />
        
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
        <DialogContent className="max-w-2xl bg-white dark:bg-card border-gray-200 dark:border-border p-0 overflow-hidden rounded-[2rem] shadow-2xl">
          {selectedEvent && (
            <div className="flex flex-col">
              {/* Header / Banner */}
              <div className="h-40 bg-gradient-to-br from-blue-600 to-indigo-700 p-10 flex items-end relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
                <div className="relative z-10 flex items-center gap-5">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                    <Play className="fill-white text-white w-7 h-7 ml-0.5" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-black text-white tracking-tighter uppercase italic">Lobby de Cours</DialogTitle>
                    <p className="text-white/60 text-sm font-medium uppercase tracking-widest">{selectedEvent.resource.sessionType}</p>
                  </div>
                </div>
              </div>

              {/* Lobby Content */}
              <div className="p-10 space-y-10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Matière</p>
                      <p className="text-foreground font-bold text-xl tracking-tight">{selectedEvent.resource.subjectName}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Enseignant</p>
                      <p className="text-foreground font-semibold text-lg">{selectedEvent.resource.professor}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Horaire</p>
                      <div className="flex items-center gap-2 text-foreground font-bold text-xl">
                        <Clock className="w-5 h-5 text-blue-500" />
                        {moment(selectedEvent.start).format('HH:mm')} - {moment(selectedEvent.end).format('HH:mm')}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Lieu</p>
                      <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 font-bold text-lg italic">
                        <MapPin className="w-5 h-5" />
                        {selectedEvent.resource.room}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-8 flex items-start gap-6 relative overflow-hidden group">
                  <div className="absolute inset-y-0 left-0 w-1 bg-blue-500" />
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/20">
                    <Info className="text-blue-500 w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-foreground font-bold text-lg tracking-tight">Prêt pour le cours ?</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Si le cours est en ligne, cliquez sur le bouton ci-dessous pour rejoindre la salle virtuelle. Assurez-vous d'avoir une connexion stable.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <Button 
                    onClick={handleJoinCall}
                    disabled={joining || (!selectedEvent.resource.existingSession && !selectedEvent.resource.meetingUrl)}
                    className="flex-1 h-16 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/20 group transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        CONNEXION...
                      </>
                    ) : (
                      <>
                        REJOINDRE LE COURS
                        <Play className="ml-3 w-5 h-5 fill-current group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsLobbyOpen(false)}
                    className="h-16 px-10 rounded-2xl border border-gray-200 dark:border-border text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-accent font-bold uppercase tracking-widest text-xs"
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

