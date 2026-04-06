import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('token');
      Cookies.remove('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const getMe = () => api.get('/auth/me');

// Student
export const getStudentDashboard = () => api.get('/student/dashboard');
export const getAttendanceHistory = (params) =>
  api.get('/student/attendance/history', { params });

// Teacher
export const getTeacherDashboard = () => api.get('/teacher/dashboard');
export const getTeacherSubject = (subjectId) =>
  api.get(`/teacher/subject/${subjectId}`);
export const downloadSubjectCSV = (subjectId) =>
  `${API_URL}/teacher/subject/${subjectId}/download-csv`;

// QR
export const generateQR = (subjectId, duration = 15) =>
  api.post('/qr/generate', { subjectId, duration });

export const validateSession = (sessionId) =>
  api.get(`/qr/session/${sessionId}`);

export const getActiveSession = (subjectId) =>
  api.get(`/qr/active/${subjectId}`);

export const invalidateSession = (sessionId) =>
  api.delete(`/qr/invalidate/${sessionId}`);

// Attendance
export const markAttendance = (data) =>
  api.post('/attendance/mark', data);

export const getSessionStudents = (sessionId) =>
  api.get(`/attendance/session/${sessionId}/students`);

export default api;
