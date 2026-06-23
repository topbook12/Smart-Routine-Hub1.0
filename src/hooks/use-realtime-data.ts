"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  Schedule,
  ScheduleChange,
  Notice,
  TimeSlot,
  Room,
  User,
  Course,
} from "@/types";

// Shared fetcher
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json() as Promise<T>;
}

const RT_INTERVAL = 5000; // 5s — simulates real-time snapshots

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

export function useRealtimeSchedules(filters: ScheduleFilters = {}) {
  const qs = buildQS(filters);
  return useQuery<Schedule[]>({
    queryKey: ["schedules", filters],
    queryFn: () => fetcher<Schedule[]>(`/api/schedules${qs}`),
    refetchInterval: RT_INTERVAL,
    staleTime: 3000,
  });
}

export function useRealtimeScheduleChanges(filters: {
  teacherId?: string;
  program?: string;
  semester?: number | string;
} = {}) {
  const qs = buildQS(filters);
  return useQuery<ScheduleChange[]>({
    queryKey: ["schedule-changes", filters],
    queryFn: () => fetcher<ScheduleChange[]>(`/api/schedule-changes${qs}`),
    refetchInterval: RT_INTERVAL,
    staleTime: 3000,
  });
}

export function useRealtimeNotices(filters: { category?: string; limit?: number } = {}) {
  const qs = buildQS(filters);
  return useQuery<Notice[]>({
    queryKey: ["notices", filters],
    queryFn: () => fetcher<Notice[]>(`/api/notices${qs}`),
    refetchInterval: RT_INTERVAL,
    staleTime: 3000,
  });
}

export function useRealtimeTimeSlots() {
  return useQuery<TimeSlot[]>({
    queryKey: ["timeslots"],
    queryFn: () => fetcher<TimeSlot[]>("/api/timeslots"),
    refetchInterval: RT_INTERVAL * 4,
    staleTime: 30_000,
  });
}

export function useRealtimeRooms(type?: string) {
  const qs = type ? `?type=${type}` : "";
  return useQuery<Room[]>({
    queryKey: ["rooms", type ?? "all"],
    queryFn: () => fetcher<Room[]>(`/api/rooms${qs}`),
    refetchInterval: RT_INTERVAL * 4,
    staleTime: 20_000,
  });
}

export function useRealtimeTeachers() {
  return useQuery<User[]>({
    queryKey: ["teachers"],
    queryFn: () => fetcher<User[]>("/api/teachers"),
    refetchInterval: RT_INTERVAL * 4,
    staleTime: 20_000,
  });
}

export function useRealtimeCourses(filters: { program?: string; semester?: number | string } = {}) {
  const qs = buildQS(filters);
  return useQuery<Course[]>({
    queryKey: ["courses", filters],
    queryFn: () => fetcher<Course[]>(`/api/courses${qs}`),
    refetchInterval: RT_INTERVAL * 4,
    staleTime: 20_000,
  });
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
