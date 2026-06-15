import { create } from 'zustand';
import { api } from '../services/api';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  status: string;
  is_online: boolean;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; username: string; displayName: string }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    if (data.error) throw new Error(data.error);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    connectSocket(data.user.id);
    set({ user: data.user, token: data.token, isAuthenticated: true });
  },

  register: async (regData) => {
    const data = await api.post('/api/auth/register', regData);
    if (data.error) throw new Error(data.error);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    connectSocket(data.user.id);
    set({ user: data.user, token: data.token, isAuthenticated: true });
  },

  logout: () => {
    disconnectSocket();
    localStorage.clear();
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    set({ isLoading: true });
    const stored = localStorage.getItem('user');
    if (stored) {
      set({ user: JSON.parse(stored), isLoading: false });
      const u = JSON.parse(stored);
      connectSocket(u.id);
    }
    set({ isLoading: false });
  },
}));

interface ChatState {
  users: User[];
  groups: any[];
  currentChat: any;
  messages: any[];
  typingUsers: Map<string, boolean>;
  unreadCount: number;
  loadUsers: () => Promise<void>;
  loadGroups: () => Promise<void>;
  setCurrentChat: (chat: any) => void;
  loadMessages: (userId: string) => Promise<void>;
  loadGroupMessages: (groupId: string) => Promise<void>;
  sendMessage: (data: any) => void;
  addMessage: (message: any) => void;
  setTyping: (userId: string, typing: boolean) => void;
  loadUnread: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  users: [],
  groups: [],
  currentChat: null,
  messages: [],
  typingUsers: new Map(),
  unreadCount: 0,

  loadUsers: async () => {
    const data = await api.get('/api/users');
    if (Array.isArray(data)) set({ users: data });
  },

  loadGroups: async () => {
    const data = await api.get('/api/groups');
    if (Array.isArray(data)) set({ groups: data });
  },

  setCurrentChat: (chat) => {
    set({ currentChat: chat, messages: [] });
  },

  loadMessages: async (userId) => {
    const data = await api.get(`/api/messages/${userId}`);
    if (Array.isArray(data)) set({ messages: data });
  },

  loadGroupMessages: async (groupId) => {
    const data = await api.get(`/api/messages/group/${groupId}`);
    if (Array.isArray(data)) set({ messages: data });
  },

  sendMessage: (data) => {
    const socket = getSocket();
    socket.emit('message:send', data);
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  setTyping: (userId, typing) => {
    set((state) => {
      const newMap = new Map(state.typingUsers);
      newMap.set(userId, typing);
      return { typingUsers: newMap };
    });
  },

  loadUnread: async () => {
    const data = await api.get('/api/notifications/unread');
    if (data?.count !== undefined) set({ unreadCount: data.count });
  },
}));
