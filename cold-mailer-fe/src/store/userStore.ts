import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "../configs/axiosConfig";

export interface CsvRecord {
  _id: string;
  name: string;
  url: string;
  totalRecords: number;
  sent: number;
  uploadedAt: string;
  sentEmailRowIds?: string[];
  failedEmailRowIds?: string[];
}

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
  csvs: CsvRecord[];
  csvsLoading: boolean;
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
  getUser: () => UserInfo | null;
  hasGmailOAuth: () => boolean;
  setEmailSubject: (subject: string) => void;
  setEmailHtml: (html: string) => void;
  fetchCsvs: () => Promise<void>;
  setCsvs: (csvs: CsvRecord[]) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      emailSubject: "",
      emailHtml: "",
      csvs: [],
      csvsLoading: false,
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
      fetchCsvs: async () => {
        try {
          set({ csvsLoading: true });
          const response = await axios.get("/upload/csv");
          set({ csvs: response.data.data || [] });
        } catch (err) {
          console.error("Error fetching CSVs:", err);
        } finally {
          set({ csvsLoading: false });
        }
      },
      setCsvs: (csvs) => set({ csvs }),
    }),
    {
      name: "user-storage", // name of the item in localStorage
      partialize: (state) => ({
        user: state.user,
        emailSubject: state.emailSubject,
        emailHtml: state.emailHtml,
      }), // persist these fields
    }
  )
);

export const selectUser = (state: UserStore) => state.user;
export const selectSetUser = (state: UserStore) => state.setUser;
export const selectClearUser = (state: UserStore) => state.clearUser;
export const selectHasGmailOAuth = (state: UserStore) => state.hasGmailOAuth;
export const selectEmailSubject = (state: UserStore) => state.emailSubject;
export const selectEmailHtml = (state: UserStore) => state.emailHtml;
export const selectCsvs = (state: UserStore) => state.csvs;
export const selectCsvsLoading = (state: UserStore) => state.csvsLoading;
export const selectFetchCsvs = (state: UserStore) => state.fetchCsvs;
export const selectSetCsvs = (state: UserStore) => state.setCsvs;
