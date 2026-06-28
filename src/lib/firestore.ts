import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as limitFn,
  onSnapshot,
  type Unsubscribe,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";

// ===== Generic helpers =====

export async function getAll<T>(collName: string, constraints: QueryConstraint[] = []): Promise<T[]> {
  const q = query(collection(db, collName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

export async function getById<T>(collName: string, id: string): Promise<T | null> {
  const ref = doc(db, collName, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

export async function create<T extends { id?: string }>(
  collName: string,
  data: T
): Promise<T & { id: string }> {
  const id = data.id || doc(collection(db, collName)).id;
  const { id: _omit, ...rest } = data;
  await setDoc(doc(db, collName, id), rest);
  return { ...data, id } as T & { id: string };
}

export async function update<T extends Record<string, unknown>>(
  collName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  await updateDoc(doc(db, collName, id), data as Record<string, unknown>);
}

export async function remove(collName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collName, id));
}

// ===== Real-time subscription =====

export function subscribe<T>(
  collName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, collName), ...constraints);
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
    },
    onError
  );
}

// Re-export Firestore helpers for convenience
export { collection, doc, query, where, orderBy, limitFn, onSnapshot };
export type { QueryConstraint, Unsubscribe };
