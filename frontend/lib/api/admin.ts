import axiosInstance from './axios';

// ---------- Students ----------
export const getStudents = (params?: Record<string, string | number>) =>
  axiosInstance.get('/api/admin/students', { params }).then(r => r.data);

export const getStudent = (id: string) =>
  axiosInstance.get(`/api/admin/students/${id}`).then(r => r.data);

export const createStudent = (data: Record<string, unknown>) =>
  axiosInstance.post('/api/admin/students', data).then(r => r.data);

export const updateStudent = (id: string, data: Record<string, unknown>) =>
  axiosInstance.put(`/api/admin/students/${id}`, data).then(r => r.data);

export const deleteStudent = (id: string) =>
  axiosInstance.delete(`/api/admin/students/${id}`).then(r => r.data);

export const bulkImportStudents = (students: unknown[]) =>
  axiosInstance.post('/api/admin/students/bulk-import', { students }).then(r => r.data);

export const getStudentGrades = (id: string) =>
  axiosInstance.get(`/api/admin/students/${id}/grades`).then(r => r.data);

// ---------- Teachers ----------
export const getTeachers = (params?: Record<string, string | number>) =>
  axiosInstance.get('/api/admin/teachers', { params }).then(r => r.data);

export const getTeacher = (id: string) =>
  axiosInstance.get(`/api/admin/teachers/${id}`).then(r => r.data);

export const createTeacher = (data: Record<string, unknown>) =>
  axiosInstance.post('/api/admin/teachers', data).then(r => r.data);

export const updateTeacher = (id: string, data: Record<string, unknown>) =>
  axiosInstance.put(`/api/admin/teachers/${id}`, data).then(r => r.data);

export const deleteTeacher = (id: string) =>
  axiosInstance.delete(`/api/admin/teachers/${id}`).then(r => r.data);

// ---------- Departments ----------
export const getDepartments = (params?: Record<string, string>) =>
  axiosInstance.get('/api/admin/departments', { params }).then(r => r.data);

export const createDepartment = (data: Record<string, unknown>) =>
  axiosInstance.post('/api/admin/departments', data).then(r => r.data);

export const updateDepartment = (id: string, data: Record<string, unknown>) =>
  axiosInstance.put(`/api/admin/departments/${id}`, data).then(r => r.data);

export const deleteDepartment = (id: string) =>
  axiosInstance.delete(`/api/admin/departments/${id}`).then(r => r.data);

// ---------- Programs ----------
export const getPrograms = (params?: Record<string, string>) =>
  axiosInstance.get('/api/admin/programs', { params }).then(r => r.data);

export const createProgram = (data: Record<string, unknown>) =>
  axiosInstance.post('/api/admin/programs', data).then(r => r.data);

export const updateProgram = (id: string, data: Record<string, unknown>) =>
  axiosInstance.put(`/api/admin/programs/${id}`, data).then(r => r.data);

export const deleteProgram = (id: string) =>
  axiosInstance.delete(`/api/admin/programs/${id}`).then(r => r.data);

// ---------- Classes ----------
export const getClasses = (params?: Record<string, string>) =>
  axiosInstance.get('/api/admin/classes', { params }).then(r => r.data);

export const getClass = (id: string) =>
  axiosInstance.get(`/api/admin/classes/${id}`).then(r => r.data);

export const createClass = (data: Record<string, unknown>) =>
  axiosInstance.post('/api/admin/classes', data).then(r => r.data);

export const updateClass = (id: string, data: Record<string, unknown>) =>
  axiosInstance.put(`/api/admin/classes/${id}`, data).then(r => r.data);

export const enrollStudent = (classId: string, studentId: string) =>
  axiosInstance.post(`/api/admin/classes/${classId}/students`, { studentId }).then(r => r.data);

// ---------- Schedules ----------
export const getSchedules = (params?: Record<string, string>) =>
  axiosInstance.get('/api/admin/schedules', { params }).then(r => r.data);

export const createSchedule = (data: Record<string, unknown>) =>
  axiosInstance.post('/api/admin/schedules', data).then(r => r.data);

export const publishSchedule = (id: string) =>
  axiosInstance.post(`/api/admin/schedules/${id}/publish`).then(r => r.data);

export const getScheduleConflicts = (id: string) =>
  axiosInstance.get(`/api/admin/schedules/${id}/conflicts`).then(r => r.data);

// ---------- Video Sessions ----------
export const createVideoSession = (data: Record<string, unknown>) =>
  axiosInstance.post('/api/admin/video/sessions', data).then(r => r.data);

export const startSession = (id: string) =>
  axiosInstance.post(`/api/admin/video/sessions/${id}/start`).then(r => r.data);

export const endSession = (id: string) =>
  axiosInstance.post(`/api/admin/video/sessions/${id}/end`).then(r => r.data);

export const getLiveAttendance = () =>
  axiosInstance.get('/api/admin/video/sessions/live').then(r => r.data);

export const getSessionAttendance = (id: string) =>
  axiosInstance.get(`/api/admin/video/sessions/${id}/attendance`).then(r => r.data);

// ---------- Attendance ----------
export const getAttendanceRecords = (params?: Record<string, string>) =>
  axiosInstance.get('/api/admin/attendance', { params }).then(r => r.data);

export const getClassAttendanceReport = (classId: string, params?: Record<string, string>) =>
  axiosInstance.get(`/api/admin/attendance/class/${classId}`, { params }).then(r => r.data);

export const getStudentAttendance = (studentId: string, params?: Record<string, string>) =>
  axiosInstance.get(`/api/admin/attendance/student/${studentId}`, { params }).then(r => r.data);

export const adjustAttendance = (id: string, data: Record<string, unknown>) =>
  axiosInstance.post(`/api/admin/attendance/${id}/adjust`, data).then(r => r.data);

// ---------- Grades ----------
export const getGrades = (params?: Record<string, string>) =>
  axiosInstance.get('/api/admin/grades', { params }).then(r => r.data);

export const saveGrade = (data: Record<string, unknown>) =>
  axiosInstance.post('/api/admin/grades', data).then(r => r.data);

export const bulkSaveGrades = (grades: unknown[]) =>
  axiosInstance.post('/api/admin/grades/bulk', { grades }).then(r => r.data);

export const validateGrade = (id: string, pvNumber: string) =>
  axiosInstance.post(`/api/admin/grades/${id}/validate`, { pvNumber }).then(r => r.data);

// ---------- Reports ----------
export const getDashboardStats = () =>
  axiosInstance.get('/api/admin/reports/dashboard').then(r => r.data);

export const getPVData = (params: Record<string, string>) =>
  axiosInstance.get('/api/admin/reports/pv', { params }).then(r => r.data);

export const getGradeSummary = (params: Record<string, string>) =>
  axiosInstance.get('/api/admin/reports/grade-summary', { params }).then(r => r.data);

// ---------- Settings ----------
export const getSettings = () =>
  axiosInstance.get('/api/admin/settings').then(r => r.data);

export const updateSettings = (data: Record<string, unknown>) =>
  axiosInstance.put('/api/admin/settings', data).then(r => r.data);
