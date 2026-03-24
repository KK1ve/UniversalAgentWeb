import axios from 'axios';

export const getBaseUrl = () => localStorage.getItem('api_base_url') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const getAuthToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const agentApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/api/v1/agent/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  runTask: async (payload: {
    message: string;
    session_id?: string;
    uploaded_files?: string[];
    agent_id?: string;
    enabled_skills?: string[];
  }) => {
    const { data } = await api.post('/api/v1/agent/run', payload);
    return data;
  },
};

export const sessionApi = {
  list: async (limit = 20, offset = 0) => {
    const { data } = await api.get('/api/v1/sessions', { params: { limit, offset } });
    return data;
  },
  create: async (title?: string) => {
    const { data } = await api.post('/api/v1/sessions', { title });
    return data;
  },
  get: async (sessionId: string) => {
    const { data } = await api.get(`/api/v1/sessions/${sessionId}`);
    return data;
  },
  delete: async (sessionId: string) => {
    await api.delete(`/api/v1/sessions/${sessionId}`);
  },
  listRuns: async (sessionId: string, limit = 50, offset = 0) => {
    const { data } = await api.get(`/api/v1/sessions/${sessionId}/runs`, { params: { limit, offset } });
    return data;
  },
  getRun: async (sessionId: string, runId: string) => {
    const { data } = await api.get(`/api/v1/sessions/${sessionId}/runs/${runId}`);
    return data;
  },
};

export const managementApi = {
  listAgents: async () => {
    const { data } = await api.get('/api/v1/management/agents');
    return data;
  },
  createAgent: async (agent: { name: string; model_id: number; is_default?: boolean }) => {
    const { data } = await api.post('/api/v1/management/agents', agent);
    return data;
  },
  updateAgent: async (agentId: string, agent: Partial<{ name: string; model_id: number; is_default: boolean }>) => {
    const { data } = await api.put(`/api/v1/management/agents/${agentId}`, agent);
    return data;
  },
  deleteAgent: async (agentId: string) => {
    await api.delete(`/api/v1/management/agents/${agentId}`);
  },
  setDefaultAgent: async (agentId: string) => {
    const { data } = await api.post(`/api/v1/management/agents/${agentId}/set-default`);
    return data;
  },
  listSkills: async () => {
    const { data } = await api.get('/api/v1/management/skills');
    return data;
  },
  toggleSkill: async (skillName: string, enabled: boolean) => {
    const { data } = await api.put(`/api/v1/management/skills/${skillName}`, { enabled });
    return data;
  },
};

export const getStreamUrl = (sessionId: string, runId: string) => {
  return `${getBaseUrl()}/api/v1/sessions/${sessionId}/runs/${runId}/stream`;
};
