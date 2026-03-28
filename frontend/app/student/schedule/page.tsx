'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getMySchedule } from '@/lib/api/student';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Users,
  Video
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';

export default function StudentSchedulePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scheduleEvents, setScheduleEvents] = useState<any[]>([]);
  
  // Weekly Schedule Data
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi']; // Based on 0=Sun...4=Thu
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const colors = [
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'bg-green-500/20 text-green-400 border-green-500/30',
    'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'bg-teal-500/20 text-teal-400 border-teal-500/30'
  ];

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const res = await getMySchedule();
        if (res?.data) {
          const events: any[] = [];
          res.data.forEach((schedule: any) => {
            schedule.entries.forEach((entry: any, index: number) => {
              const startHour = parseInt(entry.startTime.split(':')[0], 10);
              const endHour = parseInt(entry.endTime.split(':')[0], 10);
              events.push({
                id: entry._id || `${schedule._id}-${index}`,
                day: entry.dayOfWeek,
                start: startHour,
                duration: endHour - startHour,
                title: entry.subjectId?.name || 'Session',
                professor: entry.teacherId ? `${entry.teacherId.firstName} ${entry.teacherId.lastName}` : 'N/A',
                room: entry.room || 'online',
                color: colors[index % colors.length],
                meetingUrl: entry.meetingUrl
              });
            });
          });
          setScheduleEvents(events);
        }
      } catch (error) {
        console.error('Failed to fetch schedule:', error);
        toast.error('Erreur lors du chargement de l\'emploi du temps');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchedule();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium w-fit"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Mon Emploi du Temps</span>
          </motion.div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Planning Hebdomadaire</h1>
        </div>

        <div className="flex items-center gap-4 bg-[#111111] border border-[#222222] p-1.5 rounded-xl">
           <button className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#222222] transition-colors">
              <ChevronLeft className="w-5 h-5" />
           </button>
           <span className="font-bold text-white px-2">12 Mai - 16 Mai 2025</span>
           <button className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#222222] transition-colors">
              <ChevronRight className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-[#111111] border border-[#222222] rounded-3xl overflow-hidden shadow-xl">
         <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[800px]">
               {/* Days Header */}
               <div className="grid grid-cols-6 border-b border-[#222222]">
                  <div className="p-4 border-r border-[#222222] bg-[#0a0a0a] flex items-center justify-center">
                     <Clock className="w-5 h-5 text-gray-500" />
                  </div>
                  {days.map(day => (
                     <div key={day} className="p-4 border-r border-[#222222] text-center last:border-r-0 bg-[#0a0a0a]">
                        <span className="font-bold text-white block">{day}</span>
                     </div>
                  ))}
               </div>

               {/* Time Slots & Events */}
               <div className="relative" style={{ height: `${hours.length * 80}px` }}> {/* 80px per hour */}
                  
                  {/* Grid Lines & Times */}
                  {hours.map((hour, idx) => (
                     <div key={hour} className="absolute w-full grid grid-cols-6 pointer-events-none" style={{ top: `${idx * 80}px`, height: '80px' }}>
                        <div className="border-r border-b border-[#222222] flex items-start justify-center pt-2">
                           <span className="text-xs font-bold text-gray-500">{hour}</span>
                        </div>
                        {days.map((_, i) => (
                           <div key={i} className="border-r border-b border-[#222222] border-dashed border-b-gray-800 last:border-r-0" />
                        ))}
                     </div>
                  ))}

                  {/* Render Events */}
                  {scheduleEvents.map(event => {
                     // Event Positioning Logic
                     // Start is 8 to 17. So hour index is event.start - 8
                     const top = (event.start - 8) * 80;
                     const height = event.duration * 80;
                     const left = `calc((100% / 6) * ${event.day + 1})`; // +1 to skip time column width
                     const width = `calc(100% / 6)`;

                     return (
                        <motion.div
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           key={event.id}
                           className="absolute p-2"
                           style={{ top: `${top}px`, height: `${height}px`, left, width }}
                        >
                           <div className={cn(
                              "w-full h-full rounded-2xl border p-3 flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer",
                              event.color
                           )}>
                              <h4 className="font-bold text-sm tracking-tight leading-tight">{event.title}</h4>
                              <p className="text-xs mt-1 mb-auto opacity-80">{event.start}:00 - {event.start + event.duration}:00</p>
                              
                              <div className="space-y-1 mt-2">
                                 <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-1.5 text-xs font-medium">
                                      {event.meetingUrl ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                                      <span className="truncate">{event.room}</span>
                                   </div>
                                   {event.meetingUrl && (
                                     <a 
                                       href={event.meetingUrl} 
                                       target="_blank" 
                                       rel="noreferrer"
                                       className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm transition-colors"
                                       onClick={(e) => e.stopPropagation()}
                                     >
                                       Rejoindre
                                     </a>
                                   )}
                                 </div>
                                 <div className="flex items-center gap-1.5 text-xs font-medium">
                                    <Users className="w-3.5 h-3.5" />
                                    <span className="truncate">{event.professor}</span>
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
