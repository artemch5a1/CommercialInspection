const getBaseUrl = () => {
  if (import.meta.env.DEV) {
    return '';
  }
  return 'http://127.0.0.1:8000';
};

const API_URL = getBaseUrl();

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

async function fetchJSON(endpoint: string, options: any = {}) {
  try {
    let url: string;
    if (API_URL) {
      url = `${API_URL}/api/${endpoint}`;
    } else {
      url = `/api/${endpoint}`;
    }
    
    console.log(`Запрос к: ${url}`);
    
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    const authToken = getAuthToken();
    
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };
    
    if (options.method && options.method !== 'GET' && csrfToken) {
      headers['X-CSRF-TOKEN'] = csrfToken;
    }
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
      removeAuthToken();
      clearCurrentUser();
      window.location.href = '/login';
      return { success: false, error: 'Unauthorized' };
    }
    
    if (response.status === 204) {
      return { success: true };
    }
    
    if (!response.ok) {
      console.error(`Ошибка запроса ${endpoint}:`, response.status);
      const errorData = await response.json().catch(() => null);
      return { success: false, error: errorData?.message || errorData?.error || `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    console.log(`Ответ от ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`Ошибка fetch для ${endpoint}:`, error);
    return { success: false, error: 'Connection error' };
  }
}

export const loginUser = async (login: string, password: string) => {
  try {
    const data = await fetchJSON('login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    
    if (data.success && data.token) {
      setAuthToken(data.token);
      if (data.user) {
        setCurrentUser(data.user);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Connection error' };
  }
};

let currentUser: any = null;

export const setCurrentUser = (user: any) => {
  currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const getCurrentUser = async () => {
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    return { success: true, user: JSON.parse(storedUser) };
  }
  if (currentUser) {
    return { success: true, user: currentUser };
  }
  return { success: false, message: 'Пользователь не авторизован' };
};

export const clearCurrentUser = () => {
  currentUser = null;
  localStorage.removeItem('currentUser');
  removeAuthToken();
};

export const saveStatistic = async (data: {
  task_id: number;
  user_id?: number;  // <-- ДОБАВЬТЕ
  defects: Array<{
    task_malfunction_id: number;
    malfunction_name: string;
    status: 'found' | 'not_found';
  }>;
}) => {
  const response = await fetchJSON('statistics', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response;
};

export const getUserStatistics = async (userId: number) => {
  const response = await fetchJSON(`statistics/user/${userId}`);
  return response;
};

export const getStatistic = async (statisticId: number) => {
  const response = await fetchJSON(`statistics/${statisticId}`);
  return response;
};

export const getFindFaults = async () => {
  const response = await fetchJSON('find-faults');
  return response;
};

export const getFindFaultsByStatistic = async (statisticId: number) => {
  const response = await fetchJSON(`find-faults/statistic/${statisticId}`);
  return response;
};

export const createFindFault = async (data: {
  task_malfunction_id: number;
  statistic_id: number;
  right: string;
  comment?: string;
}) => {
  const response = await fetchJSON('find-faults', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response;
};

export const getTasks = async () => {
  const data = await fetchJSON('tasks');
  return data?.tasks || [];
};

export const getTask = async (id: number) => {
  const data = await fetchJSON(`tasks/${id}`);
  return data;
};

export const createTask = async (taskData: any) => {
  const data = await fetchJSON('tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
  return data;
};

export const updateTask = async (id: number, taskData: any) => {
  const data = await fetchJSON(`tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData)
  });
  return data;
};

export const deleteTask = async (id: number) => {
  const data = await fetchJSON(`tasks/${id}`, { method: 'DELETE' });
  return data;
};

export const getMalfunctions = async () => {
  const response = await fetchJSON('malfunctions');
  return response;
};

export const getGroups = async () => {
  const data = await fetchJSON('groups');
  return data?.groups || [];
};

export const createGroup = async (name: string) => {
  const data = await fetchJSON('groups', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
  return { success: data?.success || false, data: data };
};

export const updateGroup = async (id: number, name: string) => {
  const data = await fetchJSON(`groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name })
  });
  return { success: data?.success || false, data: data };
};

export const deleteGroup = async (id: number) => {
  const data = await fetchJSON(`groups/${id}`, { method: 'DELETE' });
  return { success: data?.success || false };
};

export const getProfessions = async () => {
  const data = await fetchJSON('professions');
  return data?.professions || [];
};

export const createProfession = async (name: string) => {
  const data = await fetchJSON('professions', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
  return { success: data?.success || false, data: data };
};

export const updateProfession = async (id: number, name: string) => {
  const data = await fetchJSON(`professions/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name })
  });
  return { success: data?.success || false, data: data };
};

export const deleteProfession = async (id: number) => {
  const data = await fetchJSON(`professions/${id}`, { method: 'DELETE' });
  return { success: data?.success || false };
};

export const getTopics = async () => {
  const data = await fetchJSON('topics');
  return data?.topics || [];
};

export const createTopic = async (name: string) => {
  const data = await fetchJSON('topics', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
  return { success: data?.success || false, data: data };
};

export const updateTopic = async (id: number, name: string) => {
  const data = await fetchJSON(`topics/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name })
  });
  return { success: data?.success || false, data: data };
};

export const deleteTopic = async (id: number) => {
  const data = await fetchJSON(`topics/${id}`, { method: 'DELETE' });
  return { success: data?.success || false };
};

export const getUsers = async () => {
  const data = await fetchJSON('users');
  return data?.users || [];
};

export const registerUser = async (userData: any) => {
  const data = await fetchJSON('register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
  return { success: data?.success || false, data: data, errors: data?.errors };
};

export const updateUser = async (id: number, userData: any) => {
  const data = await fetchJSON(`users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  });
  return { success: data?.success || false, data: data };
};

export const deleteUser = async (id: number) => {
  const data = await fetchJSON(`users/${id}`, { method: 'DELETE' });
  return { success: data?.success || false };
};

export default {
  loginUser,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  saveStatistic,
  getUserStatistics,
  getStatistic,
  getFindFaults,
  getFindFaultsByStatistic,
  createFindFault,
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getMalfunctions,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getProfessions,
  createProfession,
  updateProfession,
  deleteProfession,
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getUsers,
  registerUser,
  updateUser,
  deleteUser,
};