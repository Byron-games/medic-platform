import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role:
    | "ADMIN"
    | "FACILITY_ADMIN"
    | "PHARMACY"
    | "ANALYST"
    | "DOCTOR"
    | "NURSE"
    | "MIDWIFE"
    | "LAB_TECHNICIAN"
    | "RADIOLOGIST"
    | "PHARMACIST"
    | "RECEPTIONIST"
    | "REGISTRAR"
    | "PENDING";
  facilityId: string;
  facilityName: string;
  staffId?: string; // optional
  phoneNumber?: string; // optional
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  avatarUrl: string | null; // ← NEW
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: Partial<User>) => void; // ← changed to accept partial updates
  setAvatar: (url: string | null) => void; // ← NEW
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      avatarUrl: null, // ← NEW

      login: (user, token) => set({ user, token, isAuthenticated: true }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          avatarUrl: null,
        }),

      setUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setAvatar: (url) => set({ avatarUrl: url }), // ← NEW
    }),
    {
      name: "medic-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        // avatarUrl is excluded from persistence (to avoid huge base64 strings)
      }),
    },
  ),
);
