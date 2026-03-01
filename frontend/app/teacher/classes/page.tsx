'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Search,
  Video,
  ClipboardList
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface Class {
  _id: string;
  name: string;
  code: string;
  description?: string;
  studentIds: any[];
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
    room: string;
  }[];
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await api.get('/classes');
        setClasses(res.data);
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            My Classes
          </h1>
          <p className="text-gray-400">View and manage students, schedules, and live sessions.</p>
        </div>
      </header>

      <div className="flex items-center gap-4 max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
          <Input
            type="text"
            placeholder="Search your classes..."
            className="pl-11 bg-white/5 border-white/10 py-6 rounded-2xl focus:ring-purple-500/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-white/5 border border-white/10 rounded-3xl animate-pulse" />
            ))
          ) : filteredClasses.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500 border border-dashed border-white/10 rounded-3xl">
              No classes assigned to you yet.
            </div>
          ) : (
            filteredClasses.map((cls, idx) => (
              <motion.div
                key={cls._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono bg-black/40 px-2 py-1 rounded text-purple-400 border border-purple-500/20 uppercase">
                    {cls.code}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors truncate">{cls.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <Users className="w-4 h-4" /> {cls.studentIds.length} Students Enrolled
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-3">
                    {cls.schedule.slice(0, 2).map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-2">
                           <Clock className="w-3 h-3 text-purple-500" /> {s.day}
                        </span>
                        <span>{s.startTime} - {s.endTime}</span>
                      </div>
                    ))}
                    {cls.schedule.length > 2 && (
                      <p className="text-[10px] text-gray-600 italic">+{cls.schedule.length - 2} more sessions</p>
                    )}
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <Button variant="ghost" className="bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-xs py-1 h-auto rounded-xl flex gap-2">
                        <ClipboardList className="w-4 h-4" /> Attendance
                    </Button>
                    <Link href={`/teacher/classes/${cls._id}`} className="w-full">
                        <Button variant="ghost" className="w-full bg-white/5 hover:bg-blue-500/20 hover:text-blue-400 text-xs py-1 h-auto rounded-xl flex gap-2">
                            <Video className="w-4 h-4" /> Live Session
                        </Button>
                    </Link>
                  </div>
                </div>

                <Link href={`/teacher/classes/${cls._id}`} className="absolute inset-0 z-0 bg-transparent" />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
