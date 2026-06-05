'use client';

import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

export function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.isRead).map(n => api.put(`/notifications/${n._id}/read`))
      );
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications(notifications.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative w-10 h-10 rounded-xl bg-background border border-border hover:bg-accent transition-all group"
        >
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[10px] font-bold text-primary-foreground items-center justify-center">
                {unreadCount}
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl shadow-2xl border-border bg-card/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 font-bold text-base">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-2 bg-border/60" />
        <div className="max-h-[400px] overflow-y-auto space-y-1 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Aucune notification</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem 
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer transition-colors focus:bg-accent",
                  !notif.isRead && "bg-primary/5 border-l-2 border-primary"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm text-foreground">{notif.title}</span>
                  <span className="text-[10px] text-muted-foreground">{formatTime(notif.createdAt)}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {notif.message}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="my-2 bg-border/60" />
        <div className="p-1">
          <Button variant="ghost" className="w-full text-xs font-bold rounded-lg h-9">
            Voir toutes les notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
