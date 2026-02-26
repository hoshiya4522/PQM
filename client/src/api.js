import axios from 'axios';

// Use relative path so it works on localhost, LAN IP, or behind a proxy
const BASE = import.meta.env.BASE_URL || '/';
const API_URL = import.meta.env.VITE_API_URL || (BASE.endsWith('/') ? BASE + 'api' : BASE + '/api');
const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === 'true';

export const api = axios.create({
  baseURL: API_URL,
});

// For static site (GitHub Pages): append .json to all GET requests
if (STATIC_MODE) {
  api.interceptors.request.use((config) => {
    if (config.method === 'get') {
      config.url = config.url + '.json';
    }
    return config;
  });
}

export const isReadOnly = () => STATIC_MODE;

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // If path starts with /, remove it
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const base = import.meta.env.BASE_URL || '/';
  // Ensure base ends with /
  const normalizedBase = base.endsWith('/') ? base : base + '/';
  return normalizedBase + cleanPath;
};

export const getCourses = () => api.get('/courses').then(res => res.data);
export const createCourse = (course) => api.post('/courses', course).then(res => res.data);
export const updateCourse = (id, course) => api.put(`/courses/${id}`, course).then(res => res.data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`).then(res => res.data);
export const reorderCourses = (orders) => api.post('/courses/reorder', { orders }).then(res => res.data);
export const getQuestions = (courseId, search, sortBy, order) => api.get(`/courses/${courseId}/questions`, { params: { search, sortBy, order } }).then(res => res.data);
export const getQuestion = (id) => api.get(`/questions/${id}`).then(res => res.data);
export const createQuestion = (formData) => api.post('/questions', formData).then(res => res.data);
export const updateQuestion = (id, formData) => api.put(`/questions/${id}`, formData).then(res => res.data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`).then(res => res.data);
export const addPage = (questionId, formData) => api.post(`/questions/${questionId}/pages`, formData).then(res => res.data);
export const updatePage = (pageId, formData) => api.put(`/pages/${pageId}`, formData).then(res => res.data);
export const deletePage = (pageId) => api.delete(`/pages/${pageId}`).then(res => res.data);
export const addSolution = (questionId, formData) => api.post(`/questions/${questionId}/solutions`, formData).then(res => res.data);
export const updateSolution = (solutionId, formData) => api.put(`/solutions/${solutionId}`, formData).then(res => res.data);
export const deleteSolution = (solutionId) => api.delete(`/solutions/${solutionId}`).then(res => res.data);
export const deleteAttachment = (attachmentId) => api.delete(`/attachments/${attachmentId}`).then(res => res.data);
export const getStats = () => api.get('/stats').then(res => res.data);
export const getRecentQuestions = () => api.get('/questions/recent').then(res => res.data);
export const getUnsolvedQuestions = () => api.get('/questions/unsolved').then(res => res.data);
export const getTags = () => api.get('/tags').then(res => res.data);