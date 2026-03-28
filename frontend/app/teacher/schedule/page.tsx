'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { getMySchedule, getVideoSessions, createVideoSession } from '@/lib/api/teacher';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Users,
  Video,
  BookOpen,
  Play,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';

interface ScheduleEvent {
  id: string;
  day: number;
  start: number;
  duration: number;
  title: string;
  className: string;
  classId: string;
  room: string;
  color: string;
  meetingUrl?: string;
  existingSession?: any;
}

export default function TeacherSchedulePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [creatingSessionId, setCreatingSessionId] = useState<string | null>(null);
  
  // Weekly Schedule Data
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']; 
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const colors = [
    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'bg-green-500/10 text-green-400 border-green-500/20',
    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'bg-pink-500/10 text-pink-400 border-pink-500/20',
    'bg-teal-500/10 text-teal-400 border-teal-500/20'
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
        const events: ScheduleEvent[] = [];
        schedRes.data.forEach((schedule: any) => {
          schedule.entries.forEach((entry: any, index: number) => {
            if (entry.teacherId?._id === user?._id || entry.teacherId === user?._id) {
              const startHour = parseInt(entry.startTime.split(':')[0], 10);
              const endHour = parseInt(entry.endTime.split(':')[0], 10);
              
              // Try to find an existing video session for this class/teacher
              const existingSession = activeSessions.find((s: any) => 
                s.classId?._id === schedule.classId?._id && 
                s.status !== 'ended'
              );

              events.push({
                id: entry._id || `${schedule._id}-${index}`,
                day: entry.dayOfWeek,
                start: startHour,
                duration: endHour - startHour,
                title: entry.subjectId?.name || 'Session',
                className: schedule.classId?.name || 'N/A',
                classId: schedule.classId?._id,
                room: entry.room || 'En ligne',
                color: colors[index % colors.length],
                meetingUrl: entry.meetingUrl,
                existingSession
              });
            }
          });
        });
        setScheduleEvents(events);
      }
    } catch (error) {
      console.error('Failed to fetch schedule components:', error);
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

  const handleStartSession = async (event: ScheduleEvent) => {
    if (event.existingSession) {
      router.push(`/teacher/sessions/${event.existingSession._id}`);
      return;
    }

    try {
      setCreatingSessionId(event.id);
      const session = await createVideoSession({
        title: `${event.title} - ${event.className}`,
        classId: event.classId,
        description: `Cours de ${event.title} pour la classe ${event.className}`,
        scheduledStart: new Date() // Start now
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Planning de la semaine</span>
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-white">Mon Emploi du Temps</h1>
          <p className="text-muted-foreground font-medium">Gérez vos sessions de cours et lancez vos appels vidéo en un clic.</p>
        </div>

        <div className="flex items-center gap-4 bg-[#111111] border border-[#222222] p-2 rounded-2xl shadow-xl">
           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5">
              <ChevronLeft className="w-5 h-5" />
           </Button>
           <div className="px-4 text-center">
              <span className="font-black text-sm text-white block">SÉMAINE 12</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">21 - 27 MARS</span>
           </div>
           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5">
              <ChevronRight className="w-5 h-5" />
           </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-[2.5rem] overflow-hidden shadow-2xl relative">
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -mr-48 -mt-48" />
         
         <div className="overflow-x-auto relative z-10">
            <div className="min-w-[1000px]">
               {/* Days Header */}
               <div className="grid grid-cols-7 border-b border-[#1a1a1a] bg-[#111111]/50 backdrop-blur-md">
                  <div className="p-6 border-r border-[#1a1a1a] flex items-center justify-center">
                     <Clock className="w-5 h-5 text-primary" />
                  </div>
                  {days.map(day => (
                     <div key={day} className="p-6 border-r border-[#1a1a1a] text-center last:border-r-0">
                        <span className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground block mb-1">{day}</span>
                        <span className="text-xl font-black text-white">{new Date().getDate() + days.indexOf(day)}</span>
                     </div>
                  ))}
               </div>

               {/* Time Slots */}
               <div className="relative bg-[#0a0a0a]" style={{ height: `${hours.length * 100}px` }}>
                  {hours.map((hour, idx) => (
                     <div key={hour} className="absolute w-full grid grid-cols-7 pointer-events-none" style={{ top: `${idx * 100}px`, height: '100px' }}>
                        <div className="border-r border-b border-[#1a1a1a] flex items-start justify-center pt-4">
                           <span className="text-[10px] font-black text-muted-foreground opacity-50">{hour}</span>
                        </div>
                        {Array.from({ length: 6 }).map((_, i) => (
                           <div key={i} className="border-r border-b border-[#1a1a1a] last:border-r-0" />
                        ))}
                     </div>
                  ))}

                  {/* Events */}
                  {scheduleEvents.map(event => {
                     const top = (event.start - 8) * 100;
                     const height = event.duration * 100;
                     const left = `calc((100% / 7) * ${event.day})`; 
                     const width = `calc(100% / 7)`;
                     const isCreating = creatingSessionId === event.id;

                     return (
                        <motion.div
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           key={event.id}
                           className="absolute p-2"
                           style={{ top: `${top}px`, height: `${height}px`, left, width }}
                        >
                           <div className={cn(
                               "w-full h-full rounded-3xl border p-4 flex flex-col transition-all group relative overflow-hidden",
                               event.color,
                               "hover:scale-[1.02] hover:shadow-2xl hover:z-20 active:scale-95 shadow-lg"
                           )}>
                              {/* Glowing effect on hover */}
                              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              
                              <div className="relative z-10 flex flex-col h-full">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                      <h4 className="font-black text-sm text-white line-clamp-2 leading-tight tracking-tight uppercase">{event.title}</h4>
                                      <div className="p-1.5 bg-background/40 rounded-lg backdrop-blur-sm border border-white/5">
                                          <BookOpen className="w-3.5 h-3.5" />
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mb-auto">
                                      <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-muted-foreground uppercase">
                                          {event.start}:00 — {event.start + event.duration}:00
                                      </div>
                                  </div>

                                  <div className="mt-4 space-y-2.5">
                                      <div className="flex items-center gap-2 group/info">
                                          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover/info:bg-primary/20 transition-colors">
                                              <Users className="w-3 h-3 text-muted-foreground group-hover/info:text-primary" />
                                          </div>
                                          <span className="text-[10px] font-black text-muted-foreground truncate uppercase tracking-widest">{event.className}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 group/info">
                                          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover/info:bg-blue-500/20 transition-colors">
                                              <MapPin className="w-3 h-3 text-muted-foreground group-hover/info:text-blue-500" />
                                          </div>
                                          <span className="text-[10px] font-black text-muted-foreground truncate uppercase tracking-widest">{event.room}</span>
                                      </div>
                                      
                                      <Button 
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleStartSession(event);
                                          }}
                                          disabled={isCreating}
                                          className={cn(
                                              "w-full mt-2 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg",
                                              event.existingSession?.status === 'live' 
                                                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                                                : "bg-white text-black hover:bg-white/90"
                                          )}
                                      >
                                          {isCreating ? (
                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : event.existingSession?.status === 'live' ? (
                                              <><Radio className="w-3.5 h-3.5" /> En Direct</>
                                          ) : (
                                              <><Play className="w-3.5 h-3.5" /> Démarrer</>
                                          )}
                                      </Button>
                                  </div>
                              </div>
                           </div>
                        </motion.div>
                     );
                  })}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

interface RadioProps extends React.SVGProps<SVGSVGElement> {}
function Radio(props: RadioProps) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
            <circle cx="12" cy="12" r="2" />
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
            <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
        </svg>
    )
}
