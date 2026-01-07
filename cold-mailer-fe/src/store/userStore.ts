import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CustomMail {
  _id: string;
  emailId: string;
  openedStatus: boolean;
  userId: string;
  company: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  googleId?: string;
  gmailRefreshToken?: string;
  hasGmailAuth?: boolean;
  picture?: string;
  openedEmails?: Array<{
    csvId: string;
    rowId: string;
    openedAt: string;
  }>;
  customMailSent?: CustomMail[];
  stats?: {
    totalCampaigns: number;
    totalEmailsSent: number;
    totalOpens: number;
    totalClicks: number;
  };
  [key: string]: unknown;
}

interface UserStore {
  user: UserInfo | null;
  emailSubject: string;
  emailHtml: string;
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
  getUser: () => UserInfo | null;
  hasGmailOAuth: () => boolean;
  setEmailSubject: (subject: string) => void;
  setEmailHtml: (html: string) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      emailSubject: "",
      emailHtml: "",
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      getUser: () => get().user,
      hasGmailOAuth: () => {
        const user = get().user;
        return !!(
          user?.googleId ||
          user?.gmailRefreshToken ||
          user?.hasGmailAuth
        );
      },
      setEmailSubject: (emailSubject) => set({ emailSubject }),
      setEmailHtml: (emailHtml) => set({ emailHtml }),
    }),
    {
      name: "user-storage", // name of the item in localStorage
      partialize: (state) => ({ user: state.user }), // only persist user field
    }
  )
);

export const selectUser = (state: UserStore) => state.user;
export const selectSetUser = (state: UserStore) => state.setUser;
export const selectClearUser = (state: UserStore) => state.clearUser;
export const selectHasGmailOAuth = (state: UserStore) => state.hasGmailOAuth;
export const selectEmailSubject = (state: UserStore) => state.emailSubject;
export const selectEmailHtml = (state: UserStore) => state.emailHtml;
