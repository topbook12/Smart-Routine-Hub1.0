import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDrWzeIb8FUIua3JyrSq3jL8a90fT1Uv9U",
  authDomain: "smart-routine-hub2.firebaseapp.com",
  projectId: "smart-routine-hub2",
  storageBucket: "smart-routine-hub2.firebasestorage.app",
  messagingSenderId: "926299872101",
  appId: "1:926299872101:web:ad8ebbe158e0d558f9df8c",
  measurementId: "G-5DQW2KZY9S",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { app };
