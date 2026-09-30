"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Doctor, Locale, Localized } from "@/lib/types";
import { doctorsApi, toDoctor } from "@/lib/api/doctors";
import { servicesApi } from "@/lib/api/services";
import { auth, type User } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
type State = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (ar: string, en: string, he: string) => string;
  user: User | null;
  authLoading: boolean;
  authError: string;
  refreshUser: () => Promise<User | null>;
  doctors: Doctor[];
  specialties: Record<string, Localized>;
  specialtyDescriptions: Record<string, Localized>;
  cities: Record<string, Localized>;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
};
const Context = createContext<State | null>(null);
export function Provider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, updateLocale] = useState(initialLocale);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Record<string, Localized>>({});
  const [specialtyDescriptions, setDescriptions] = useState<
    Record<string, Localized>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const authVersion = useRef(0);
  const refreshUser = useCallback(async () => {
    const version = ++authVersion.current;
    setAuthLoading(true);
    setAuthError("");
    try {
      const result = await auth.me();
      if (version === authVersion.current) setUser(result);
      return result;
    } catch (e) {
      if (version === authVersion.current) {
        setUser(null);
        if (!(e instanceof ApiError && e.status === 401))
          setAuthError((e as Error).message);
      }
      return null;
    } finally {
      if (version === authVersion.current) setAuthLoading(false);
    }
  }, []);
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rows, areas] = await Promise.all([
        doctorsApi.list(),
        servicesApi.specialties(),
      ]);
      setDoctors(rows.map(toDoctor));
      setSpecialties(
        Object.fromEntries(
          areas.map((s) => [
            s.id,
            {
              ar: s.name_ar || s.name_en,
              en: s.name_en,
              he: s.name_he || s.name_en,
            },
          ]),
        ),
      );
      setDescriptions(
        Object.fromEntries(
          areas.map((s) => [
            s.id,
            {
              ar: s.description || "",
              en: s.description || "",
              he: s.description || "",
            },
          ]),
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(reload);
    void Promise.resolve().then(refreshUser);
  }, [reload, refreshUser]);
  function setLocale(value: Locale) {
    updateLocale(value);
    document.documentElement.lang = value;
    document.documentElement.dir = value === "en" ? "ltr" : "rtl";
    document.cookie = `clinic-locale=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
  const cities = Object.fromEntries(
    doctors.flatMap((d) =>
      d.record.doctor_locations.map((l) => [
        l.city,
        { ar: l.city, en: l.city, he: l.city },
      ]),
    ),
  );
  return (
    <Context.Provider
      value={{
        locale,
        setLocale,
        t: (ar, en, he) => ({ ar, en, he })[locale],
        user,
        authLoading,
        authError,
        refreshUser,
        doctors,
        specialties,
        specialtyDescriptions,
        cities,
        loading,
        error,
        reload,
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
