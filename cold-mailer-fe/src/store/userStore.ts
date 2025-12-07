import { create } from "zustand";

interface UserInfo {
  id: string;
  email: string;
  name?: string;
  [key: string]: any;
}

interface UserStore {
  user: UserInfo | null;
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
  getUser: () => UserInfo | null;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  getUser: () => get().user,
}));

export const selectUser = (state: UserStore) => state.user;
export const selectSetUser = (state: UserStore) => state.setUser;
export const selectClearUser = (state: UserStore) => state.clearUser;
