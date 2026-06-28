import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import {
  collection,
  doc,
  setDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { firestoreClient } from "@/lib/firebase-client";

export async function POST() {
  try {
    // Fetch all data from Prisma
    const [users, students, courses, rooms, timeSlots, schedules, notices, libraryLinks, settings] = await Promise.all([
      prisma.user.findMany(),
      prisma.student.findMany(),
      prisma.course.findMany(),
      prisma.room.findMany(),
      prisma.timeSlot.findMany(),
      prisma.schedule.findMany(),
      prisma.notice.findMany(),
      prisma.libraryLink.findMany(),
      prisma.setting.findMany(),
    ]);

    const results: Record<string, number> = {};

    // Helper to batch-write a collection (Firestore batch max 500 writes)
    const batchWrite = async (collName: string, items: Record<string, unknown>[]) => {
      if (items.length === 0) {
        results[collName] = 0;
        return;
      }
      for (let i = 0; i < items.length; i += 450) {
        const batch = writeBatch(firestoreClient);
        const chunk = items.slice(i, i + 450);
        for (const item of chunk) {
          const { id, ...rest } = item;
          if (id) {
            batch.set(doc(firestoreClient, collName, String(id)), rest as DocumentData);
          } else {
            batch.set(doc(collection(firestoreClient, collName)), rest as DocumentData);
          }
        }
        await batch.commit();
      }
      results[collName] = items.length;
    };

    // Write each collection
    await batchWrite("users", users.map(({ passwordHash, pinHash, ...rest }) => {
      void passwordHash; void pinHash;
      return { ...rest, createdAt: rest.createdAt?.toISOString?.() ?? rest.createdAt, updatedAt: rest.updatedAt?.toISOString?.() ?? rest.updatedAt };
    }));
    await batchWrite("students", students.map(({ passwordHash, ...rest }) => {
      void passwordHash;
      return { ...rest, createdAt: rest.createdAt?.toISOString?.() ?? rest.createdAt, updatedAt: rest.updatedAt?.toISOString?.() ?? rest.updatedAt };
    }));
    await batchWrite("courses", courses.map((c) => ({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() })));
    await batchWrite("rooms", rooms.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })));
    await batchWrite("timeSlots", timeSlots as unknown as Record<string, unknown>[]);
    await batchWrite("schedules", schedules.map((s) => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() })));
    await batchWrite("notices", notices.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      expiryDate: n.expiryDate?.toISOString() ?? null,
    })));
    await batchWrite("libraryLinks", libraryLinks.map((l) => ({ ...l, createdAt: l.createdAt.toISOString(), updatedAt: l.updatedAt.toISOString() })));
    await batchWrite("settings", settings as unknown as Record<string, unknown>[]);

    return NextResponse.json({ success: true, counts: results });
  } catch (e) {
    console.error("[seed-firestore] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Seed failed" },
      { status: 500 }
    );
  }
}
