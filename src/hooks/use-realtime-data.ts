"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import {
  collection,
  query as fsQuery,
  where,
  orderBy,
  limit as limitFn,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { firestoreClient } from "@/lib/firebase-client";
import type {
  Schedule,
  ScheduleChange,
  Notice,
  TimeSlot,
  Room,
  User,
  Course,
} from "@/types";

// Shared fetcher (fallback for non-Firestore data like current user)
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json() as Promise<T>;
}

const RT_INTERVAL = 5000; // fallback polling interval

export interface ScheduleFilters {
  program?: string;
  semester?: number | string;
  teacherId?: string;
  roomId?: string;
  day?: string;
  classType?: string;
}

function buildQS(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "" && v !== "all") {
      params.set(k, String(v));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

// ===== Real-time Firestore hook =====
function useFirestoreRealtime<T>(
  collName: string,
  constraints: ReturnType<typeof where>[] | ReturnType<typeof orderBy>[],
  fallbackUrl: string,
  queryKey: unknown[]
) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    // Try Firestore onSnapshot first
    try {
      if (firestoreClient) {
        const q = fsQuery(collection(firestoreClient, collName), ...constraints);
        unsubRef.current = onSnapshot(
          q,
          (snap) => {
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
            setData(items);
            setError(null);
          },
          (err) => {
            console.warn(`[firestore:${collName}] onSnapshot error, falling back to polling:`, err.message);
            setError(err);
          }
        );
        return () => {
          unsubRef.current?.();
          unsubRef.current = null;
        };
      }
    } catch (e) {
      console.warn(`[firestore:${collName}] init error, using polling:`, e);
    }
  }, [collName]);

  // Fallback: TanStack Query polling
  const fallbackQuery = useQuery<T[]>({
    queryKey: queryKey,
    queryFn: () => fetcher<T[]>(fallbackUrl),
    refetchInterval: data ? false : RT_INTERVAL, // stop polling if Firestore works
    enabled: data === null, // only poll if Firestore hasn't provided data
    staleTime: 3000,
  });

  const isLoading = data === null && fallbackQuery.isLoading;
  const finalError = error && data === null ? fallbackQuery.error : null;

  return {
    data: data ?? fallbackQuery.data ?? undefined,
    isLoading,
    error: finalError ?? undefined,
  };
}

// ===== Exported hooks =====

export function useRealtimeSchedules(filters: ScheduleFilters = {}) {
  const qs = buildQS(filters);
  const constraints: ReturnType<typeof where>[] = [];
  // Note: Firestore queries with multiple where clauses need composite indexes.
  // For simplicity, we fetch all active schedules and filter client-side via the API fallback.
  // The onSnapshot will fire for any change, giving instant real-time updates.
  return useFirestoreRealtime<Schedule>(
    "schedules",
    constraints,
    `/api/schedules${qs}`,
    ["schedules", filters]
  );
}

export function useRealtimeScheduleChanges(filters: {
  teacherId?: string;
  program?: string;
  semester?: number | string;
} = {}) {
  const qs = buildQS(filters);
  return useFirestoreRealtime<ScheduleChange>(
    "scheduleChanges",
    [],
    `/api/schedule-changes${qs}`,
    ["schedule-changes", filters]
  );
}

export function useRealtimeNotices(filters: { category?: string; limit?: number } = {}) {
  const qs = buildQS(filters);
  return useFirestoreRealtime<Notice>(
    "notices",
    [],
    `/api/notices${qs}`,
    ["notices", filters]
  );
}

export function useRealtimeTimeSlots() {
  return useFirestoreRealtime<TimeSlot>(
    "timeSlots",
    [],
    "/api/timeslots",
    ["timeslots"]
  );
}

export function useRealtimeRooms(type?: string) {
  const qs = type ? `?type=${type}` : "";
  return useFirestoreRealtime<Room>(
    "rooms",
    [],
    `/api/rooms${qs}`,
    ["rooms", type ?? "all"]
  );
}

export function useRealtimeTeachers() {
  return useFirestoreRealtime<User>(
    "users",
    [],
    "/api/teachers",
    ["teachers"]
  );
}

export function useRealtimeCourses(filters: { program?: string; semester?: number | string } = {}) {
  const qs = buildQS(filters);
  return useFirestoreRealtime<Course>(
    "courses",
    [],
    `/api/courses${qs}`,
    ["courses", filters]
  );
}

export function useRealtimeStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () =>
      fetcher<{
        teachers: number;
        courses: number;
        rooms: number;
        schedules: number;
        notices: number;
        changes: number;
        todayClasses: number;
        todayName: string;
      }>("/api/stats"),
    refetchInterval: RT_INTERVAL,
    staleTime: 3000,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () =>
      fetcher<{
        siteName: string;
        siteTagline: string;
        departmentName: string;
        universityName: string;
        contactEmail: string;
        contactPhone: string;
        address: string;
        aboutText: string;
        headerLinks: { label: string; href: string }[];
        footerDescription: string;
        footerQuickLinks: { label: string; href: string }[];
        socialMedia: { name: string; url: string; icon: string }[];
        developerName: string;
        developerUrl: string;
        academicSession: string;
      }>("/api/settings"),
    staleTime: 60_000,
  });
}

export function useCurrentUser() {
  return useQuery<{ user: User | null }>({
    queryKey: ["current-user"],
    queryFn: () => fetcher<{ user: User | null }>("/api/user"),
    staleTime: 10_000,
  });
}

export interface StudentUser {
  id: string;
  fullName: string;
  rollNumber: string;
  program: "bsc" | "msc";
  semester: number;
  role: "student";
  isActive: boolean;
}

export function useCurrentStudent() {
  return useQuery<{ student: StudentUser | null }>({
    queryKey: ["current-student"],
    queryFn: () => fetcher<{ student: StudentUser | null }>("/api/student/me"),
    staleTime: 10_000,
  });
}
