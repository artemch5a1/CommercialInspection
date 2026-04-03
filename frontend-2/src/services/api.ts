const API_URL = 'http://127.0.0.1:8000';

// Универсальная функция для fetch с проверкой ошибок
async function fetchJSON(endpoint: string, options: any = {}) {
  try {
    const response = await fetch(`${API_URL}/${endpoint}`, options);
    if (!response.ok) {
      console.error(`Ошибка запроса ${endpoint}:`, response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`${error}`, error);
    return null;
  }
}

// ===== Группы =====
export const getGroups = async () => {
  const data = await fetchJSON('groups');
  return data?.groups || [];
};

export const createGroup = async (name: string) => fetchJSON('groups', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name })
});

export const updateGroup = async (id: number, name: string) => fetchJSON(`groups/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name })
});

export const deleteGroup = async (id: number) => fetchJSON(`groups/${id}`, { method: 'DELETE' });

// ===== Профессии =====
export const getProfessions = async () => {
  const data = await fetchJSON('professions');
  return data?.professions || [];
};

export const createProfession = async (name: string) => fetchJSON('professions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name })
});

export const updateProfession = async (id: number, name: string) => fetchJSON(`professions/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name })
});

export const deleteProfession = async (id: number) => fetchJSON(`professions/${id}`, { method: 'DELETE' });

// ===== Темы =====
export const getTopics = async () => {
  const data = await fetchJSON('topics');
  return data?.topics || [];
};

export const createTopic = async (name: string) => fetchJSON('topics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name })
});

export const updateTopic = async (id: number, name: string) => fetchJSON(`topics/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name })
});

export const deleteTopic = async (id: number) => fetchJSON(`topics/${id}`, { method: 'DELETE' });

// ===== Пользователи =====
export const getUsers = async () => {
  const data = await fetchJSON('users');
  return data?.users || [];
};

export const registerUser = async (userData: any) => fetchJSON('register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userData)
});

export const updateUser = async (id: number, userData: any) => fetchJSON(`users/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userData)
});

export const deleteUser = async (id: number) => fetchJSON(`users/${id}`, { method: 'DELETE' });