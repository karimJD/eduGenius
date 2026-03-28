import api from '../axios';

// Classes
export const getMyClasses = async (params?: any) => {
  const response = await api.get('/student/classes', { params });
  return response.data;
};

// Schedule
export const getMySchedule = async (params?: any) => {
  const response = await api.get('/student/schedule', { params });
  return response.data;
};

// Video Sessions
export const getMyVideoSessions = async (params?: any) => {
  const response = await api.get('/student/video-sessions', { params });
  return response.data;
};

export const joinVideoSession = async (sessionId: string) => {
  const response = await api.post(`/student/video-sessions/${sessionId}/join`);
  return response.data;
};
