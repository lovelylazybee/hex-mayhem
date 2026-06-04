const BASE_URL = '/api';

interface ApiOptions extends RequestInit {
  token?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;
      const result = await response.json();
      if (result.success && result.data?.token) {
        localStorage.setItem('token', result.data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  const storedToken = token || localStorage.getItem('token');
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/')) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = localStorage.getItem('token');
      if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${BASE_URL}${endpoint}`, { ...rest, headers });
      if (!retryResponse.ok) {
        const errData = await retryResponse.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${retryResponse.status}`);
      }
      const retryResult: ApiResponse<T> = await retryResponse.json();
      if (!retryResult.success) throw new Error(retryResult.error || '请求失败');
      return retryResult.data as T;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    throw new Error('登录已过期，请重新登录');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  if (!result.success) {
    throw new Error(result.error || '请求失败');
  }
  return result.data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: ApiOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: ApiOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),

  put: <T>(endpoint: string, data?: unknown, options?: ApiOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),

  delete: <T>(endpoint: string, options?: ApiOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string; refreshToken: string; user: any }>('/auth/login', { username, password }),
  register: (username: string, password: string, email: string) =>
    api.post<{ token: string; refreshToken: string; user: any }>('/auth/register', { username, password, email }),
  me: () => api.get<any>('/auth/me'),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put<any>('/auth/change-password', { oldPassword, newPassword }),
  refresh: (refreshToken: string) =>
    api.post<{ token: string; user: any }>('/auth/refresh', { refreshToken }),
};

export const seasonApi = {
  getCurrent: () => api.get<any>('/seasons/current'),
  getAll: () => api.get<any[]>('/seasons'),
  create: (data: any) => api.post<any>('/seasons', data),
  update: (id: number, data: any) => api.put<any>(`/seasons/${id}`, data),
};

export const registrationApi = {
  register: (data: any) => api.post<any>('/registrations', data),
  getMine: () => api.get<any>('/registrations/mine'),
  getAll: (params?: string) => api.get<any>(`/registrations${params ? `?${params}` : ''}`),
  approve: (id: number) => api.put<any>(`/registrations/${id}/status`, { status: 'approved' }),
  reject: (id: number) => api.put<any>(`/registrations/${id}/status`, { status: 'rejected' }),
};

export const teamApi = {
  getAll: (params?: string) => api.get<any[]>(`/teams${params ? `?${params}` : ''}`),
  create: (data: any) => api.post<any>('/teams', data),
  update: (id: number, data: any) => api.put<any>(`/teams/${id}`, data),
  updateMembers: (id: number, data: any) => api.put<any>(`/teams/${id}/members`, data),
  autoAssign: (seasonId: number) => api.post<any>('/teams/auto-assign', { seasonId }),
  delete: (id: number) => api.delete(`/teams/${id}`),
};

export const runeApi = {
  getAll: () => api.get<any[]>('/runes'),
  get: (id: number) => api.get<any>(`/runes/${id}`),
  draw: (teamId: number) => api.post<any>('/runes/draw', { teamId }),
  create: (data: any) => api.post<any>('/runes', data),
  update: (id: number, data: any) => api.put<any>(`/runes/${id}`, data),
  delete: (id: number) => api.delete(`/runes/${id}`),
};

export const matchApi = {
  getAll: (params?: string) => api.get<any[]>(`/matches${params ? `?${params}` : ''}`),
  create: (data: any) => api.post<any>('/matches', data),
  update: (id: number, data: any) => api.put<any>(`/matches/${id}`, data),
  updateScore: (id: number, data: any) => api.put<any>(`/matches/${id}/score`, data),
};

export const contentApi = {
  get: (key: string) => api.get<any>(`/content/${key}`),
  update: (key: string, value: string) => api.put<any>(`/content/${key}`, { value }),
};

export const userApi = {
  getAll: () => api.get<any[]>('/users'),
  update: (id: number, data: any) => api.put<any>(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export const hallOfFameApi = {
  getAll: () => api.get<any[]>('/hall-of-fame'),
  getBySeason: (seasonNumber: number) => api.get<any>(`/hall-of-fame/${seasonNumber}`),
  create: (data: any) => api.post<any>('/hall-of-fame', data),
  update: (id: number, data: any) => api.put<any>(`/hall-of-fame/${id}`, data),
  addMoment: (id: number, data: any) => api.post<any>(`/hall-of-fame/${id}/moments`, data),
  addSponsor: (id: number, data: any) => api.post<any>(`/hall-of-fame/${id}/sponsors`, data),
};

export const reportApi = {
  submit: (data: { type: string; url?: string; description: string; contact?: string }) =>
    api.post<any>('/reports', data),
  getAll: (params?: string) => api.get<any>(`/reports${params ? `?${params}` : ''}`),
  update: (id: number, data: any) => api.put<any>(`/reports/${id}`, data),
  delete: (id: number) => api.delete(`/reports/${id}`),
};
