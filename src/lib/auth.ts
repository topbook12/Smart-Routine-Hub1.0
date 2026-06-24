import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        if (!email || !password) return null;
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),
    CredentialsProvider({
      id: "pin",
      name: "PIN Login",
      credentials: {
        pin: { label: "PIN", type: "text" },
      },
      async authorize(credentials) {
        const pin = credentials?.pin ?? "";
        if (!/^\d{6}$/.test(pin)) return null;
        const users = await db.user.findMany({ where: { isActive: true, pinHash: { not: null } } });
        for (const u of users) {
          if (u.pinHash && (await bcrypt.compare(pin, u.pinHash))) {
            return {
              id: u.id,
              email: u.email,
              name: u.fullName,
              role: u.role,
            };
          }
        }
        return null;
      },
    }),
    CredentialsProvider({
      id: "student",
      name: "Student Login",
      credentials: {
        rollNumber: { label: "Roll Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const roll = credentials?.rollNumber?.trim();
        const password = credentials?.password ?? "";
        if (!roll || !password) return null;
        const student = await db.student.findUnique({ where: { rollNumber: roll } });
        if (!student || !student.isActive) return null;
        const ok = await bcrypt.compare(password, student.passwordHash);
        if (!ok) return null;
        return {
          id: student.id,
          email: `${student.rollNumber}@student.ice.ru.ac.bd`,
          name: student.fullName,
          role: "student",
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "teacher";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = (token.role as string) ?? "teacher";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "smart-routine-hub-dev-secret-key-2026",
};

// Re-export types for convenience
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    };
  }
}
