import { api, json } from "./client";
import type { DoctorRecord } from "./doctors";
export interface SalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
export interface Conversation {
  id: string;
  created_at: string;
}
export interface MatchContext {
  specialty_id?: string | null;
  city?: string | null;
  language?: string | null;
  consultation_type?: "clinic" | "video" | null;
}
export interface SalReply {
  conversation_id: string | null;
  message: SalMessage;
  urgent: boolean;
  doctors: DoctorRecord[];
  sources: { id: string; title: string }[];
  match_context?: MatchContext;
}
export const salApi = {
  conversations: () => api<Conversation[]>("/sal/conversations"),
  history: (id: string) => api<SalMessage[]>(`/sal/conversations/${id}`),
  chat: (
    message: string,
    locale: string,
    conversation_id?: string,
    history?: Pick<SalMessage, "role" | "content">[],
  ) =>
    api<SalReply>("/sal/chat", {
      method: "POST",
      body: json({ message, locale, conversation_id, history }),
    }),
};
