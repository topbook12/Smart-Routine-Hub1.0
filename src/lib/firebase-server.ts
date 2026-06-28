import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
// In production, use service account credentials from env.
// In dev, fall back to the client config (limited but works for basic operations).
const apps = getApps();
const adminApp =
  apps.length > 0
    ? apps[0]
    : initializeApp({
        projectId: "smart-routine-hub2",
        ...(process.env.FIREBASE_SERVICE_ACCOUNT
          ? {
              credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount),
            }
          : {}),
      });

export const firestoreDb = getFirestore(adminApp);
export { adminApp };
