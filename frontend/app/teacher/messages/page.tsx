'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  MessageSquare, 
  GraduationCap,
  LayoutDashboard
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Chat } from '@/components/chat/Chat';
import { Input } from '@/components/ui/input';

export default function TeacherMessagesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<{ id: string, type: 'private' | 'class', title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesRes, studentsRes] = await Promise.all([
          api.get('/classes'),
          api.get('/users?role=student') // Backend might need filtering support for this
        ]);
        setClasses(classesRes.data);
        setStudents(studentsRes.data);
        
        if (classesRes.data.length > 0) {
            setSelectedChat({
                id: classesRes.data[0]._id,
                type: 'class',
                title: classesRes.data[0].name
            });
        }
      } catch (error) {
        console.error('Failed to fetch chat data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="h-[calc(100vh-120px)] flex gap-8 p-6">
      {/* Sidebar - Contacts */}
      <div className="w-80 flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">Messages</h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Inbox & Channels</p>
        </div>

        <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <Input 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 rounded-xl h-12"
            />
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide">
            {/* Classes Section */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-2 mb-2">Class Channels</h3>
                {classes.map(cls => (
                    <button
                        key={cls._id}
                        onClick={() => setSelectedChat({ id: cls._id, type: 'class', title: cls.name })}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                            selectedChat?.id === cls._id 
                                ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                                : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="text-left min-w-0">
                            <p className="text-sm font-bold truncate">{cls.name}</p>
                            <p className="text-[10px] opacity-60">Group Channel</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Students Section */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-2 mb-2">Direct Messages</h3>
                {students.map(student => (
                    <button
                        key={student._id}
                        onClick={() => setSelectedChat({ id: student._id, type: 'private', title: `${student.firstName} ${student.lastName}` })}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                            selectedChat?.id === student._id 
                                ? 'bg-purple-600/10 border-purple-500/50 text-purple-400' 
                                : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center font-bold text-xs">
                            {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div className="text-left min-w-0">
                            <p className="text-sm font-bold truncate">{student.firstName} {student.lastName}</p>
                            <p className="text-[10px] opacity-60 font-medium">Student</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1">
        {selectedChat ? (
          <Chat 
            key={selectedChat.id}
            type={selectedChat.type}
            receiverId={selectedChat.type === 'private' ? selectedChat.id : undefined}
            classId={selectedChat.type === 'class' ? selectedChat.id : undefined}
            title={selectedChat.title}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 bg-white/5 border border-white/10 rounded-3xl">
             <div className="p-6 bg-blue-500/10 rounded-full text-blue-400">
                <MessageSquare size={40} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-white">Séléctionne une discussion</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xs">Choisis une classe ou un étudiant pour commencer à échanger en temps réel.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
