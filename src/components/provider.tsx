"use client";
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";
import type { Appointment, ChatMessage, Intake, Locale } from "@/lib/types";
type State = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (ar: string, en: string, he: string) => string;
  saved: string[];
  toggleSaved: (id: string) => void;
  appointments: Appointment[];
  setAppointments: Dispatch<SetStateAction<Appointment[]>>;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  intake: Intake;
  setIntake: Dispatch<SetStateAction<Intake>>;
  chatStep: number;
  setChatStep: Dispatch<SetStateAction<number>>;
};
const Context = createContext<State | null>(null);
export const emptyIntake: Intake = {
  concern: "",
  duration: "",
  severity: "",
  age: "",
  city: "",
};
export function Provider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, updateLocale] = useState<Locale>(initialLocale);
  const [saved, setSaved] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [intake, setIntake] = useState<Intake>(emptyIntake);
  const [chatStep, setChatStep] = useState(0);
  function setLocale(value: Locale) {
    updateLocale(value);
    document.documentElement.lang = value;
    document.documentElement.dir = value === "en" ? "ltr" : "rtl";
    document.cookie = `clinic-locale=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  const t = (ar: string, en: string, he: string) => ({ ar, en, he })[locale];
  return (
    <Context.Provider
      value={{
        locale,
        setLocale,
        t,
        saved,
        toggleSaved: (id) =>
          setSaved((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
          ),
        appointments,
        setAppointments,
        messages,
        setMessages,
        intake,
        setIntake,
        chatStep,
        setChatStep,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useClinic() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Clinic provider is missing");
  return ctx;
}
