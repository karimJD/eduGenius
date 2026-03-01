'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Image as ImageIcon, 
  MoreVertical, 
  User,
  Search
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  _id: string;
  senderId: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  content: string;
  createdAt: string;
  type: string;
}

interface ChatProps {
  receiverId?: string;
  classId?: string;
  type: 'private' | 'class';
  title: string;
}

export function Chat({ receiverId, classId, type, title }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const params = type === 'private' ? { userId: receiverId } : { classId };
        const res = await api.get('/messages', { params });
        setMessages(res.data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    // In a real app, set up Socket.io listener here
  }, [receiverId, classId, type]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await api.post('/messages', {
        receiverId,
        classId,
        content: newMessage,
        type
      });
      
      // Manually add the temporary message for instant feedback
      const tempMsg: Message = {
          ...res.data,
          senderId: {
              _id: user?._id || '',
              firstName: user?.firstName || '',
              lastName: user?.lastName || ''
          }
      };
      setMessages([...messages, tempMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm">
            {title[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight">{title}</h3>
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5 text-gray-400">
                <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5 text-gray-400">
                <MoreVertical className="w-4 h-4" />
            </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-95"
      >
        <AnimatePresence>
          {messages.map((msg, idx) => {
            const isMe = msg.senderId._id === user?._id;
            return (
              <motion.div
                key={msg._id || idx}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-xl ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white/10 text-gray-200 border border-white/5 rounded-tl-none'
                }`}>
                  {!isMe && type === 'class' && (
                    <p className="text-[10px] font-bold text-blue-400 mb-1">
                        {msg.senderId.firstName} {msg.senderId.lastName}
                    </p>
                  )}
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-black/40 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" className="rounded-xl text-gray-500 hover:bg-white/5">
                <Paperclip className="w-5 h-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="rounded-xl text-gray-500 hover:bg-white/5">
                <ImageIcon className="w-5 h-5" />
            </Button>
          </div>
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écris ton message ici..."
            className="flex-1 bg-white/5 border-white/10 py-5 rounded-2xl focus:ring-blue-500/40 text-sm"
          />
          <Button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
