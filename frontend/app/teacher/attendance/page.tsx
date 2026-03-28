'use client';

import { useEffect, useState } from 'react';
import { Users, Check, X, Clock, PlusCircle, ChevronDown } from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';

interface Student { _id: string; firstName: string; lastName: string; email: string }
interface Class { _id: string; name: string; code: string; studentIds: Student[] }
interface Session {
  _id: string;
  title: string;
  scheduledStart: string;
  attendance: { studentId: string; status: string }[];
  statistics?: { attendanceRate?: number }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  present: { label: 'Present', color: 'bg-green-500/10 text-green-500 border-green-500/30', dot: 'bg-green-500' },
  late:    { label: 'Late',    color: 'bg-amber-500/10 text-amber-500 border-amber-500/30', dot: 'bg-amber-500' },
  absent:  { label: 'Absent', color: 'bg-red-500/10 text-red-500 border-red-500/30', dot: 'bg-red-500' },
  excused: { label: 'Excused', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', dot: 'bg-blue-500' },
};

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [marking, setMarking] = useState(false);
  const [records, setRecords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/teacher/classes').then(r => setClasses(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const selectClass = async (cls: Class) => {
    setSelectedClass(cls);
    setLoadingSessions(true);
    const init: Record<string, string> = {};
    cls.studentIds.forEach(s => { init[s._id] = 'present'; });
    setRecords(init);
    try {
      const r = await api.get(`/teacher/attendance/${cls._id}`);
      setSessions(r.data);
    } catch { setSessions([]); }
    setLoadingSessions(false);
    setMarking(false);
  };

  const save = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      await api.post(`/teacher/attendance/${selectedClass._id}`, {
        records: Object.entries(records).map(([studentId, status]) => ({ studentId, status })),
      });
      await selectClass(selectedClass);
      setMarking(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">Track and manage student attendance per session.</p>
      </div>

      {/* Class selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {loading ? [1, 2, 3].map(i => <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />) :
         classes.map(cls => (
          <button key={cls._id} onClick={() => selectClass(cls)}
            className={`flex items-center gap-3 p-4 bg-card border rounded-xl text-left transition-all ${
              selectedClass?._id === cls._id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
            }`}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
              {cls.code?.slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{cls.name}</p>
              <p className="text-xs text-muted-foreground">{cls.studentIds.length} students</p>
            </div>
          </button>
        ))}
      </div>

      {selectedClass && (
        <div className="space-y-5">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{selectedClass.name} — Attendance</h2>
            {!marking ? (
              <button onClick={() => setMarking(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">
                <PlusCircle className="w-4 h-4" /> Mark Today
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setMarking(false)} className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-accent">Cancel</button>
                <button onClick={save} disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Mark attendance form */}
          <AnimatePresence>
            {marking && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-primary/5">
                  <p className="text-sm font-semibold text-foreground">
                    Session: {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {selectedClass.studentIds.map(student => (
                    <div key={student._id} className="flex items-center gap-4 px-5 py-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{student.firstName} {student.lastName}</p>
                      </div>
                      <div className="flex gap-2">
                        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                          <button key={status} onClick={() => setRecords(p => ({ ...p, [student._id]: status }))}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                              records[student._id] === status ? cfg.color + ' border' : 'border-border text-muted-foreground hover:bg-accent'
                            }`}>
                            {cfg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Past sessions */}
          {loadingSessions ? (
            <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 bg-card border border-border rounded-xl animate-pulse" />)}</div>
          ) : sessions.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground border border-dashed border-border rounded-2xl text-sm">
              No attendance sessions recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Past Sessions</h3>
              {sessions.map(session => {
                const rate = session.statistics?.attendanceRate ?? 0;
                return (
                  <div key={session._id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: rate >= 70 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(session.scheduledStart).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{rate}%</p>
                      <p className="text-xs text-muted-foreground">attendance rate</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
