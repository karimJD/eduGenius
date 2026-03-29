import api from '../axios';

// Stats
export const getDashboardStats = async () => {
  const response = await api.get('/teacher/dashboard/stats');
  return response.data;
};

export const getUpcomingSessions = async () => {
  const response = await api.get('/teacher/dashboard/upcoming-sessions');
  return response.data;
};

// Classes
export const getMyClasses = async (params?: any) => {
  const response = await api.get('/teacher/classes', { params });
  return response.data;
};

export const getClassDetails = async (id: string) => {
  const response = await api.get(`/teacher/classes/${id}`);
  return response.data;
};

// Schedule
export const getMySchedule = async (params?: any) => {
  const response = await api.get('/teacher/schedule', { params });
  return response.data;
};

// Announcements
export const getRecentAnnouncements = async () => {
  const response = await api.get('/teacher/announcements/recent');
  return response.data;
};

// Courses
export const getMyCourses = async (params?: any) => {
  const response = await api.get('/teacher/courses', { params });
  return response.data;
};

export const createCourse = async (data: any) => {
  const response = await api.post('/teacher/courses', data);
  return response.data;
};

// Video Sessions
export const getVideoSessions = async (params?: any) => {
  const response = await api.get('/sessions', { params }); // Sessions are currently under /api/sessions in server.js
  return response.data;
};

export const createVideoSession = async (data: any) => {
  const response = await api.post('/sessions', data);
  return response.data;
};

export const getSessionToken = async (id: string) => {
  const response = await api.post(`/sessions/${id}/token`);
  return response.data;
};

export const startVideoSession = async (id: string) => {
  const response = await api.put(`/sessions/${id}/start`);
  return response.data;
};

export const endVideoSession = async (id: string) => {
  const response = await api.put(`/sessions/${id}/end`);
  return response.data;
};
