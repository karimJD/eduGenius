'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Image as ImageIcon, 
  MoreVertical, 
  User,
  Search,
  Info
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { io, Socket } from 'socket.io-client';

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
  messageType: string;
}

interface ChatProps {
  receiverId?: string;
  classId?: string;
  type: 'private' | 'class';
  title: string;
  isBroadcast?: boolean;
}

export function Chat({ receiverId, classId, type, title, isBroadcast }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const roomId = type === 'private' 
    ? (user?._id && receiverId ? [user._id, receiverId].sort().join('-') : null)
    : classId;

  // Initialize Socket
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    socketRef.current = io(socketUrl, {
      withCredentials: true,
    });

    socketRef.current.on('new-message', (msg: Message) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socketRef.current.on('user-typing', ({ userName }: { userName: string }) => {
      setTypingUser(userName);
    });

    socketRef.current.on('user-stop-typing', () => {
      setTypingUser(null);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

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

    // Join Socket Room
    if (socketRef.current && roomId) {
      socketRef.current.emit('join-chat', { roomId });
    }

    return () => {
      if (socketRef.current && roomId) {
        socketRef.current.emit('leave-chat', { roomId });
      }
    };
  }, [receiverId, classId, type, roomId]);

  // Handle typing indicator emission
  useEffect(() => {
    if (!socketRef.current || !roomId || !user) return;

    if (newMessage.length > 0) {
      socketRef.current.emit('typing', { roomId, userName: user.firstName });
    } else {
      socketRef.current.emit('stop-typing', { roomId });
    }
  }, [newMessage, receiverId, classId, type, user, roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomId) return;

    try {
      // Emit via socket instantly (the backend socket handler persists it to DB)
      socketRef.current?.emit('send-message', {
        roomId,
        content: newMessage,
        messageType: type, // Using the 'type' prop from the component
        receiverId,
        classId,
        senderId: user._id,
        senderName: `${user.firstName} ${user.lastName}`,
      });

      setNewMessage('');
      socketRef.current?.emit('stop-typing', { roomId });
    } catch (error) {
      console.error('Failed to send message via socket:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm">
            {title[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{title}</h3>
          </div>
        </div>
        <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold px-3">
            ID: {receiverId || classId?.slice(-6)}
        </div>
      </div>

      {isBroadcast && (
        <div className="bg-blue-500/10 border-b border-blue-500/10 px-4 py-2 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
            Broadcast: Chaque étudiant recevra ce message individuellement et pourra répondre en privé.
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-[0.03] dark:opacity-95"
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
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm dark:shadow-xl ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/5 rounded-tl-none'
                }`}>
                  {!isMe && type === 'class' && (
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {msg.senderId.firstName} {msg.senderId.lastName}
                    </p>
                  )}
                  <p className="leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100/70' : 'text-gray-500 dark:text-gray-500'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {typingUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-4 py-3 rounded-2xl rounded-tl-none text-xs italic border border-gray-200 dark:border-white/5 flex items-center gap-2">
              <span>{typingUser} est en train d'écrire</span>
              <span className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce delay-150" />
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 bg-gray-50 dark:bg-black/40 border-t border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2" />
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écris ton message ici..."
            className="flex-1 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 py-5 rounded-2xl focus:ring-blue-500/40 text-sm text-gray-900 dark:text-white"
          />
          <Button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-white"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
