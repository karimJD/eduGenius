import api from '../axios';

export const arenaApi = {
  getChallenge: () => api.get('/student/arena/challenge'),
  getTodayQuests: () => api.get('/student/arena/quests/today'),
  startQuest: (questId: string) => api.post(`/student/arena/quests/${questId}/start`),
  submitQuest: (questId: string, answers: (string | null)[], timeTaken: number) =>
    api.post(`/student/arena/quests/${questId}/submit`, { answers, timeTaken }),
  getLeaderboard: () => api.get('/student/arena/leaderboard'),
  getMyProgress: () => api.get('/student/arena/progress'),
};
