'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquare, Search, Edit } from 'lucide-react';
import { cn } from '../../../lib/utils';
import api from '../../../lib/axios';
import { Chat } from '../../../components/chat/Chat';

interface Contact {
  _id: string;
  name: string;
  type: 'private' | 'class';
  unread?: number;
  online?: boolean;
}

export default function StudentMessagesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        // Fetch student's enrolled classes to use as group chats
        const classesRes = await api.get('/student/classes');
        const classesChats: Contact[] = classesRes.data.map((c: any) => ({
          _id: c._id,
          name: c.name,
          type: 'class'
        }));

        // Fetch teachers to chat with privately
        const usersRes = await api.get('/users?role=teacher');
        const teacherChats: Contact[] = usersRes.data.map((u: any) => ({
          _id: u._id,
          name: `${u.firstName} ${u.lastName}`,
          type: 'private'
        }));

        setContacts([...classesChats, ...teacherChats]);
        if (classesChats.length > 0 || teacherChats.length > 0) {
          setActiveContact(classesChats[0] || teacherChats[0]);
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[600px]">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[600px] flex gap-6">
      
      {/* Sidebar - Contacts List */}
      <div className="w-80 bg-[#111111] border border-[#222222] rounded-3xl overflow-hidden flex flex-col shrink-0 flex-1 md:flex-none">
        <div className="p-4 border-b border-[#222222] space-y-4">
           <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 Messages
              </h2>
           </div>
           
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
             <input
               type="text"
               placeholder="Rechercher..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-[#0a0a0a] border border-[#333333] text-white rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors"
             />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
           {filteredContacts.map(contact => (
             <button
                key={contact._id}
                onClick={() => setActiveContact(contact)}
                className={cn(
                   "w-full p-3 flex items-center gap-3 rounded-xl transition-all text-left group hover:bg-[#1a1a1a]",
                   activeContact?._id === contact._id ? "bg-[#1a1a1a] border border-[#333333]" : "border border-transparent"
                )}
             >
                <div className="relative shrink-0">
                   <div className="w-12 h-12 bg-[#222222] rounded-full overflow-hidden border border-[#333333]">
                      <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-400 font-bold">
                         {contact.name.substring(0,2).toUpperCase()}
                      </div>
                   </div>
                   {contact.online && (
                     <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#111111] rounded-full" />
                   )}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-baseline mb-1">
                      <h3 className={cn("font-bold truncate text-sm", activeContact?._id === contact._id ? "text-white" : "text-gray-200")}>
                         {contact.name}
                      </h3>
                   </div>
                   <p className="text-xs text-gray-500 truncate capitalize">
                      {contact.type === 'class' ? 'Groupe de classe' : 'Message privé'}
                   </p>
                </div>
             </button>
           ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col hidden md:flex">
         {activeContact ? (
            <Chat 
              key={activeContact._id} // Force re-render on contact change
              title={activeContact.name}
              type={activeContact.type}
              receiverId={activeContact.type === 'private' ? activeContact._id : undefined}
              classId={activeContact.type === 'class' ? activeContact._id : undefined}
            />
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-[#0a0a0a] border border-[#222222] rounded-3xl">
               <div className="w-20 h-20 bg-[#111111] rounded-full border border-[#222222] flex items-center justify-center mb-6">
                  <MessageSquare className="w-8 h-8 text-gray-600" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Vos Messages</h3>
               <p className="max-w-xs text-center text-sm">Sélectionnez une conversation pour commencer à discuter avec vos professeurs ou camarades.</p>
            </div>
         )}
      </div>

    </div>
  );
}
