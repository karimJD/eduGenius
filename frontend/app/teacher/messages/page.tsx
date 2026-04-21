'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  MessageSquare, 
  GraduationCap,
  Briefcase,
  User as UserIcon,
  Filter
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Chat } from '@/components/chat/Chat';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RecipientType = 'student' | 'class' | 'admin';

export default function TeacherMessagesPage() {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<RecipientType>('class');
  const [selectedChat, setSelectedChat] = useState<{ id: string, type: 'private' | 'class', title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let res;
        if (activeTab === 'class') {
          res = await api.get('/classes');
        } else if (activeTab === 'admin') {
          res = await api.get('/users?role=admin');
        } else {
          res = await api.get('/users?role=student');
        }
        setRecipients(res.data);
      } catch (error) {
        console.error('Failed to fetch recipients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const filteredRecipients = recipients.filter(r => {
    const name = activeTab === 'class' ? (r?.name || '') : `${r?.firstName || ''} ${r?.lastName || ''}`;
    return name.toLowerCase().includes((searchTerm || '').toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-4.5rem)] flex gap-8 p-0">
      {/* Sidebar - Contacts */}
      <div className="w-80 flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Espace Enseignant</p>
        </div>

        {/* Recipient Type Tabs */}
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
          {(['class', 'student', 'admin'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedChat(null);
              }}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all capitalize",
                activeTab === tab 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
              )}
            >
              {tab === 'class' ? 'Classes' : tab === 'student' ? 'Élèves' : 'Admin'}
            </button>
          ))}
        </div>

        <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <Input 
                placeholder="Rechercher..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl h-12 text-gray-900 dark:text-white placeholder:text-gray-500"
            />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              filteredRecipients.map(r => (
                <button
                    key={r._id}
                    onClick={() => setSelectedChat({ 
                      id: r._id, 
                      type: activeTab === 'class' ? 'class' : 'private', 
                      title: activeTab === 'class' ? r.name : `${r.firstName} ${r.lastName}` 
                    })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                        selectedChat?.id === r._id 
                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-600 dark:text-blue-400' 
                            : 'bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      activeTab === 'class' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                      activeTab === 'student' ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                      "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                    )}>
                        {activeTab === 'class' ? <GraduationCap size={18} /> :
                         activeTab === 'student' ? <UserIcon size={18} /> :
                         <Briefcase size={18} />}
                    </div>
                    <div className="text-left min-w-0">
                        <p className="text-sm font-bold truncate">
                          {activeTab === 'class' ? r.name : `${r.firstName} ${r.lastName}`}
                        </p>
                        <p className="text-[10px] opacity-60">
                          {activeTab === 'class' ? 'Canal de classe' : r.role || 'Personnel'}
                        </p>
                    </div>
                </button>
              ))
            )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1">
        {selectedChat ? (
          <Chat 
            key={`${selectedChat.type}-${selectedChat.id}`}
            type={selectedChat.type}
            receiverId={selectedChat.type === 'private' ? selectedChat.id : undefined}
            classId={selectedChat.type === 'class' ? selectedChat.id : undefined}
            title={selectedChat.title}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl">
             <div className="p-6 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
                <MessageSquare size={40} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Messagerie Enseignant</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xs">
                  Séléctionnez une classe, un étudiant ou l'administration pour commencer à échanger.
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
