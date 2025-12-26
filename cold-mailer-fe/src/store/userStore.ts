import { create } from "zustand";

interface UserInfo {
  id: string;
  email: string;
  name?: string;
  googleId?: string;
  gmailRefreshToken?: string;
  hasGmailAuth?: boolean;
  [key: string]: unknown;
}

interface UserStore {
  user: UserInfo | null;
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
  getUser: () => UserInfo | null;
  hasGmailOAuth: () => boolean;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  getUser: () => get().user,
  hasGmailOAuth: () => {
    const user = get().user;
    return !!(user?.googleId || user?.gmailRefreshToken || user?.hasGmailAuth);
  },
}));

export const selectUser = (state: UserStore) => state.user;
export const selectSetUser = (state: UserStore) => state.setUser;
export const selectClearUser = (state: UserStore) => state.clearUser;
export const selectHasGmailOAuth = (state: UserStore) => state.hasGmailOAuth;
