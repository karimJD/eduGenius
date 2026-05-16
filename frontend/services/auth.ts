const API_BASE_URL = 'http://localhost:5000/api/auth';

export const forgotPassword = async (email: string) => {
  const response = await fetch(`${API_BASE_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Une erreur est survenue');
  }
  return data;
};

export const resetPassword = async (token: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/reset-password/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Une erreur est survenue');
  }
  return data;
};
