'use client';

import io, { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (userId?: string): Socket => {
  if (socket) return socket;

  const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  socket = io(socketUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    if (userId) {
      socket?.emit('subscribeToUserEvents', { userId });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToUserEvents = (userId: string) => {
  if (!socket) socket = initializeSocket();
  socket?.emit('subscribeToUserEvents', { userId });
};

export const onSummaryGenerated = (callback: (summary: any) => void) => {
  if (!socket) socket = initializeSocket();
  socket?.on('summaryGenerated', callback);
  return () => socket?.off('summaryGenerated', callback);
};

export const onSummaryError = (callback: (error: string) => void) => {
  if (!socket) socket = initializeSocket();
  socket?.on('summaryError', callback);
  return () => socket?.off('summaryError', callback);
};
