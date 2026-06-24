import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { User } from "@/types";

export interface StudentUser {
  id: string;
  fullName: string;
  rollNumber: string;
  program: "bsc" | "msc";
  semester: number;
  role: "student";
  isActive: boolean;
}

export async function getSessionUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const role = (session.user as { role?: string }).role;
  if (role === "student") return null;
  const u = await db.user.findUnique({ where: { id: session.user.id } });
  if (!u || !u.isActive) return null;
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    designation: u.designation,
    department: u.department,
    phone: u.phone,
    photoURL: u.photoURL,
    officeRoom: u.officeRoom,
    bio: u.bio,
    role: u.role as "admin" | "teacher",
    isActive: u.isActive,
  };
}

export async function getCurrentStudent(): Promise<StudentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== "student") return null;
  const s = await db.student.findUnique({ where: { id: session.user.id } });
  if (!s || !s.isActive) return null;
  return {
    id: s.id,
    fullName: s.fullName,
    rollNumber: s.rollNumber,
    program: s.program as "bsc" | "msc",
    semester: s.semester,
    role: "student",
    isActive: s.isActive,
  };
}

export function requireRole(user: User | null, role: "admin" | "teacher") {
  if (!user) return false;
  return user.role === role;
}
