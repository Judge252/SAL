import { api, json } from "./client";
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "patient" | "doctor" | "admin" | "super_admin";
  preferred_language: "ar" | "en" | "he";
}
export const auth = {
  me: () => api<User>("/auth/me"),
  login: (email: string, password: string) =>
    api("/auth/login", { method: "POST", body: json({ email, password }) }),
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    preferred_language: string;
    next?: string;
  }) =>
    api<{ confirmation_required: boolean }>("/auth/register", {
      method: "POST",
      body: json(data),
    }),
  google: (next: string) =>
    api<{ url: string }>("/auth/oauth/google", {
      method: "POST",
      body: json({ next }),
    }),
  confirm: (data: Record<string, string>) =>
    api("/auth/confirm", { method: "POST", body: json(data) }),
  resend: (email: string, next: string) =>
    api("/auth/resend", { method: "POST", body: json({ email, next }) }),
  logout: () => api("/auth/logout", { method: "POST" }),
  update: (data: {
    full_name: string;
    phone: string | null;
    preferred_language: string;
  }) => api<User>("/auth/me", { method: "PATCH", body: json(data) }),
};
