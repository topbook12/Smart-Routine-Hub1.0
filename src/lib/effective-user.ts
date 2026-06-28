import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import type { User } from "@/types";

/**
 * Returns the authenticated user, OR — in development mode only — a fallback
 * admin user so that API routes work when previewing dashboards without
 * logging in (dev bypass).
 *
 * In production this always returns the real session user (or null).
 */
export async function getEffectiveUser(): Promise<User | null> {
  const user = await getSessionUser();
  if (user) return user;

  // Dev bypass: no real session, but we're in development.
  if (process.env.NODE_ENV !== "production") {
    const admin = await db.user.findFirst({
      where: { role: "admin", isActive: true },
    });
    if (admin) {
      return {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        designation: admin.designation,
        department: admin.department,
        phone: admin.phone,
        photoURL: admin.photoURL,
        officeRoom: admin.officeRoom,
        bio: admin.bio,
        role: admin.role as "admin" | "teacher",
        isActive: admin.isActive,
      };
    }
  }

  return null;
}
