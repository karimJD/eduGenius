const API_URL = 'http://localhost:5000/api/courses';

export interface UserProgress {
  courseId: string;
  questionsAnswered: number;
  correctAnswers: number;
  lastQuizDate: string;
}

export interface Course {
  _id: string;
  title: string;
  content: string;
  quiz: any[];
  summary?: string;
  createdAt: string;
  userProgress?: UserProgress;
}

export const fetchCourses = async (): Promise<Course[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  return response.json();
};

export const createCourseWithAI = async (title: string, content: string | File[]): Promise<Course> => {
  const isFiles = Array.isArray(content);
  
  let body;
  let headers: HeadersInit = {};

  if (isFiles) {
    const formData = new FormData();
    formData.append('title', title);
    content.forEach((file) => {
      formData.append('files', file);
    });
    body = formData;
  } else {
    body = JSON.stringify({ title, content });
    headers = { 'Content-Type': 'application/json' };
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body,
  });
  
  if (!response.ok) {
    throw new Error('Failed to create course');
  }
  return response.json();
};

export const fetchCourseById = async (id: string): Promise<Course> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch course');
  }
  return response.json();
};

export const generateEnhancedSummary = async (courseId: string, style: 'enhanced' | 'shrink' = 'enhanced'): Promise<Course> => {
  const response = await fetch(`${API_URL}/${courseId}/summary`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ style }),
  });
  if (!response.ok) throw new Error('Failed to generate enhanced summary');
  return response.json();
};

export const ensureQuizCount = async (courseId: string, count: number): Promise<Course> => {
  const response = await fetch(`${API_URL}/${courseId}/quiz/ensure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count }),
  });
  if (!response.ok) throw new Error('Failed to ensure quiz count');
  return response.json();
};

export const submitQuizResult = async (courseId: string, questionsAnswered: number, correctAnswers: number, token: string) => {
  const response = await fetch(`${API_URL}/${courseId}/quiz/submit`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ questionsAnswered, correctAnswers }),
  });
  if (!response.ok) throw new Error('Failed to submit quiz result');
  return response.json();
};

export const reviewQuiz = async (courseId: string, questions: any[], userAnswers: number[]) => {
  const response = await fetch(`${API_URL}/${courseId}/quiz/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions, userAnswers }),
  });
  if (!response.ok) throw new Error('Failed to review quiz');
  return response.json();
};
