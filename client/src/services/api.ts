const API = import.meta.env.VITE_API_URL || '';

async function request(url: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API}${url}`, { ...options, headers });

  if (res.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const refreshRes = await fetch(`${API}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem('token', data.token);
        headers['Authorization'] = `Bearer ${data.token}`;
        const retryRes = await fetch(`${API}${url}`, { ...options, headers });
        return retryRes.json();
      }
    }
    localStorage.clear();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return res.json();
}

export const api = {
  get: (url: string) => request(url),
  post: (url: string, body?: any) => request(url, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (url: string, body?: any) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url: string) => request(url, { method: 'DELETE' }),
};
