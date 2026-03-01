'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar, Users, User, Clock, MapPin, Hash } from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface Class {
  _id: string;
  name: string;
  teacherId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  studentIds: any[];
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
    room: string;
  }[];
  code: string;
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClass, setCurrentClass] = useState<Partial<Class>>({
    name: '',
    teacherId: { _id: '', firstName: '', lastName: '' },
    schedule: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '' }],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, usersRes] = await Promise.all([
        api.get('/classes'),
        api.get('/users')
      ]);
      setClasses(classesRes.data);
      setTeachers(usersRes.data.filter((u: any) => u.role === 'teacher'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (cls?: Class) => {
    if (cls) {
      setIsEditing(true);
      setCurrentClass(cls);
    } else {
      setIsEditing(false);
      setCurrentClass({
        name: '',
        teacherId: { _id: '', firstName: '', lastName: '' },
        schedule: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '' }],
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: currentClass.name,
        teacherId: typeof currentClass.teacherId === 'object' ? currentClass.teacherId?._id : currentClass.teacherId,
        schedule: currentClass.schedule,
      };

      if (isEditing) {
        await api.put(`/classes/${currentClass._id}`, payload);
      } else {
        await api.post('/classes', payload);
      }
      fetchData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save class:', error);
      alert('Error saving class');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this class?')) {
      try {
        await api.delete(`/classes/${id}`);
        fetchData();
      } catch (error) {
        console.error('Failed to delete class:', error);
      }
    }
  };

  const addScheduleField = () => {
    setCurrentClass({
      ...currentClass,
      schedule: [...(currentClass.schedule || []), { day: 'Monday', startTime: '09:00', endTime: '10:00', room: '' }]
    });
  };

  const removeScheduleField = (index: number) => {
    const newSchedule = [...(currentClass.schedule || [])];
    newSchedule.splice(index, 1);
    setCurrentClass({ ...currentClass, schedule: newSchedule });
  };

  const updateScheduleField = (index: number, field: string, value: string) => {
    const newSchedule = [...(currentClass.schedule || [])];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setCurrentClass({ ...currentClass, schedule: newSchedule });
  };

  const filteredClasses = classes.filter((c) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
            Class Management
          </h1>
          <p className="text-muted-foreground">Organize courses, teachers, and student schedules.</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-6 rounded-2xl flex gap-2 font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create New Class
        </Button>
      </header>

      <div className="flex items-center gap-4 max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="text"
            placeholder="Search classes or codes..."
            className="pl-11 bg-card border-border py-6 rounded-2xl focus:ring-primary/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-card border border-border rounded-3xl animate-pulse" />
            ))
          ) : filteredClasses.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted-foreground border border-dashed border-border rounded-3xl">
              No classes found.
            </div>
          ) : (
            filteredClasses.map((cls, idx) => (
              <motion.div
                key={cls._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card border border-border rounded-3xl p-6 hover:bg-accent transition-all group relative overflow-hidden premium-card-shadow hover:premium-card-shadow-hover duration-300"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Hash size={80} />
                </div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold mb-4">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => handleOpenModal(cls)} className="rounded-xl hover:bg-muted">
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" onClick={() => handleDelete(cls._id)} className="rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div>
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{cls.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono px-2 py-0.5 bg-muted rounded text-muted-foreground border border-border uppercase">
                            CODE: {cls.code}
                        </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      Teacher: <span className="text-foreground">{(cls.teacherId as any)?.firstName} {(cls.teacherId as any)?.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Students: <span className="text-foreground">{cls.studentIds.length} enrolled</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Schedule</p>
                    <div className="space-y-2">
                      {cls.schedule.map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-muted/50 p-2 rounded-lg border border-border">
                          <span className="font-medium text-primary">{s.day}</span>
                          <span className="text-muted-foreground">{s.startTime} - {s.endTime}</span>
                          <span className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.room || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-background border-border text-foreground rounded-3xl sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{isEditing ? 'Update Class' : 'Create Class'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveClass} className="space-y-6 mt-4 relative z-10">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground">Class Name</Label>
              <Input
                id="name"
                className="bg-muted/40 border-border rounded-xl py-6"
                placeholder="e.g. History Grade 10"
                value={currentClass.name}
                onChange={(e) => setCurrentClass({ ...currentClass, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Assign Teacher</Label>
              <Select
                value={typeof currentClass.teacherId === 'object' ? currentClass.teacherId?._id : currentClass.teacherId}
                onValueChange={(value) => setCurrentClass({...currentClass, teacherId: value as any})}
                required
              >
                <SelectTrigger className="w-full h-12 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm focus:ring-primary">
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  {teachers.map((t) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.firstName} {t.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <Label className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Weekly Schedule</Label>
                <Button type="button" onClick={addScheduleField} variant="ghost" className="text-primary hover:bg-primary/10">
                  <Plus className="w-4 h-4 mr-1" /> Add Slot
                </Button>
              </div>

              {currentClass.schedule?.map((item, index) => (
                <div key={index} className="p-4 bg-muted/20 border border-border rounded-2xl relative group">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Day</Label>
                        <Select
                          value={item.day}
                          onValueChange={(value) => updateScheduleField(index, 'day', value)}
                        >
                          <SelectTrigger className="w-full bg-transparent border-0 border-b border-border text-sm py-1 h-auto rounded-none focus:ring-0 focus:border-primary outline-none px-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border text-foreground">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Room</Label>
                        <input
                            type="text"
                            placeholder="Room name/number"
                            className="w-full bg-transparent border-b border-border text-sm py-1 focus:border-primary outline-none placeholder:text-muted-foreground/50"
                            value={item.room}
                            onChange={(e) => updateScheduleField(index, 'room', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Starts At</Label>
                        <input
                            type="time"
                            className="w-full bg-transparent border-b border-border text-sm py-1 focus:border-primary outline-none"
                            value={item.startTime}
                            onChange={(e) => updateScheduleField(index, 'startTime', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Ends At</Label>
                        <input
                            type="time"
                            className="w-full bg-transparent border-b border-border text-sm py-1 focus:border-primary outline-none"
                            value={item.endTime}
                            onChange={(e) => updateScheduleField(index, 'endTime', e.target.value)}
                        />
                    </div>
                  </div>
                  {currentClass.schedule!.length > 1 && (
                    <Button 
                      type="button" 
                      onClick={() => removeScheduleField(index)} 
                      variant="ghost" 
                      className="absolute -top-2 -right-2 bg-background text-destructive hover:bg-destructive/10 border border-border opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="pt-6 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-muted-foreground rounded-xl px-8">Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-12 shadow-lg shadow-primary/20 active:scale-95 transition-all">
                {isEditing ? 'Update Class' : 'Launch Class'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
