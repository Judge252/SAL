"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { salApi, type SalMessage, type SalReply } from "@/lib/api/sal";
import { ApiError } from "@/lib/api/client";
import { salErrorMessage } from "@/lib/api/sal-errors";
import { useClinic } from "../provider";

type Session = {
  owner: string | null;
  conversationId?: string;
  draft: string;
  messages: SalMessage[];
  reply: SalReply | null;
  busy: boolean;
  loading: boolean;
  error: string;
};
const empty = (owner: string | null): Session => ({
  owner,
  draft: "",
  messages: [],
  reply: null,
  busy: false,
  loading: false,
  error: "",
});
type SessionContext = Session & {
  setDraft: (draft: string) => void;
  send: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  reset: () => void;
};
const Context = createContext<SessionContext | null>(null);

// In-memory only: a draft survives the existing sign-in navigation, but never
// enters a URL or browser storage. Account changes cannot expose another chat.
export function SALSessionProvider({ children }: { children: ReactNode }) {
  const { user, authLoading, locale, t } = useClinic();
  const owner = user?.id ?? null;
  const [session, setSession] = useState<Session>(() => empty(null));
  const generation = useRef(0);
  const inFlight = useRef(false);
  const activeOwner = useRef(owner);
  useEffect(() => {
    const changed = activeOwner.current !== owner;
    activeOwner.current = owner;
    if (authLoading) return;
    if (changed) inFlight.current = false;
    void Promise.resolve().then(() =>
      setSession((previous) =>
        previous.owner === owner
          ? previous
          : {
              ...empty(owner),
              draft: previous.owner === null ? previous.draft : "",
            },
      ),
    );
  }, [owner, authLoading]);

  const visible =
    session.owner === owner
      ? session
      : { ...empty(owner), draft: session.owner === null ? session.draft : "" };
  function setDraft(draft: string) {
    setSession((previous) => ({
      ...(previous.owner === owner ? previous : empty(owner)),
      draft,
    }));
  }
  function reset() {
    if (inFlight.current) return;
    generation.current += 1;
    setSession(empty(owner));
  }
  const loadConversation = useCallback(
    async (id: string) => {
      if (!owner || inFlight.current) return;
      const current = ++generation.current;
      setSession((previous) => ({
        ...empty(owner),
        draft: previous.owner === owner ? previous.draft : "",
        conversationId: id,
        loading: true,
      }));
      try {
        const messages = await salApi.history(id);
        if (current === generation.current && activeOwner.current === owner) {
          setSession((previous) => ({ ...previous, messages, loading: false }));
        }
      } catch (error) {
        if (current === generation.current && activeOwner.current === owner) {
          setSession((previous) => ({
            ...previous,
            loading: false,
            error: (error as Error).message,
          }));
        }
      }
    },
    [owner],
  );

  async function send() {
    const text = visible.draft.trim();
    if (
      !text ||
      (user && user.role !== "patient") ||
      inFlight.current ||
      visible.loading
    )
      return;
    inFlight.current = true;
    const current = ++generation.current;
    const sent: SalMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    const before = visible.messages;
    setSession({
      ...visible,
      messages: [...before, sent],
      draft: "",
      reply: null,
      busy: true,
      error: "",
    });
    try {
      const reply = await salApi.chat(
        text,
        locale,
        visible.conversationId,
        !user
          ? before.slice(-16).map(({ role, content }) => ({ role, content }))
          : undefined,
      );
      if (current !== generation.current || activeOwner.current !== owner)
        return;
      setSession((previous) => ({
        ...previous,
        conversationId: reply.conversation_id || undefined,
        messages: [...before, sent, reply.message],
        reply,
        busy: false,
      }));
    } catch (error) {
      if (current !== generation.current || activeOwner.current !== owner)
        return;
      setSession((previous) => ({
        ...previous,
        messages: before,
        draft: text,
        busy: false,
        conversationId: error instanceof ApiError
          ? error.detail?.conversation_id || previous.conversationId
          : previous.conversationId,
        error: salErrorMessage(error, t, !!user),
      }));
    } finally {
      if (current === generation.current) inFlight.current = false;
    }
  }

  return (
    <Context.Provider
      value={{ ...visible, setDraft, send, loadConversation, reset }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSALSession() {
  const context = useContext(Context);
  if (!context) throw new Error("SAL session provider is missing");
  return context;
}
